"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";

interface Message {
  id: string;
  trainer_id: string;
  client_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface TrainerInfo {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function getInitials(name: string | null) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Refs to keep trainer/client ids available inside Realtime callbacks without stale closures
let _trainerId = "";
let _clientId = "";

export default function ClientChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [trainer, setTrainer] = useState<TrainerInfo | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const trainerIdRef = useRef<string>("");
  const clientIdRef = useRef<string>("");

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      // 1. Get current user
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setError("No se pudo obtener la sesión.");
        setLoading(false);
        return;
      }
      setClientId(user.id);
      clientIdRef.current = user.id;

      // 2. Find their trainer
      const { data: rel, error: relErr } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .single();

      if (relErr || !rel) {
        setError("No tienes un entrenador asignado.");
        setLoading(false);
        return;
      }
      const tid = rel.trainer_id as string;
      setTrainerId(tid);
      trainerIdRef.current = tid;

      // 3. Get trainer profile
      const { data: trainerProfile } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("user_id", tid)
        .single();
      setTrainer(trainerProfile as TrainerInfo | null);

      // 4. Load messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("trainer_id", tid)
        .eq("client_id", user.id)
        .order("created_at", { ascending: true })
        .limit(100);
      setMessages((msgs as Message[]) ?? []);
      setLoading(false);

      // 5. Mark trainer messages as read
      supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("trainer_id", tid)
        .eq("client_id", user.id)
        .eq("sender_id", tid)
        .is("read_at", null)
        .then(() => {});

      // 6. Subscribe to Realtime — only for messages from the trainer (client's own messages are added optimistically)
      channel = supabase
        .channel(`chat-client-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `client_id=eq.${user.id}`,
          },
          (payload) => {
            const msg = payload.new as Message;
            // Only add trainer messages here — client's own are added optimistically in handleSend
            if (msg.sender_id === clientIdRef.current) return;
            setMessages((prev) => {
              if (prev.find((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            // Auto-mark trainer message as read
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", msg.id)
              .then(() => {});
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !trainerIdRef.current || !clientIdRef.current) return;

    setSending(true);
    setInput("");

    // Optimistic update — show message immediately
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      trainer_id: trainerIdRef.current,
      client_id: clientIdRef.current,
      sender_id: clientIdRef.current,
      content: text,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const supabase = createClient();
    const { error: insertErr } = await supabase
      .from("messages")
      .insert({
        trainer_id: trainerIdRef.current,
        client_id: clientIdRef.current,
        sender_id: clientIdRef.current,
        content: text,
      });

    if (insertErr) {
      console.error("[Chat] Error al enviar mensaje:", insertErr);
    }

    // Refetch to get confirmed state from DB (replaces optimistic)
    const { data: fresh } = await supabase
      .from("messages")
      .select("*")
      .eq("trainer_id", trainerIdRef.current)
      .eq("client_id", clientIdRef.current)
      .order("created_at", { ascending: true })
      .limit(100);

    if (fresh) {
      setMessages(fresh as Message[]);
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by day
  type Group = { day: string; msgs: Message[] };
  const groups: Group[] = [];
  for (const msg of messages) {
    const day = new Date(msg.created_at).toDateString();
    const last = groups[groups.length - 1];
    if (!last || last.day !== day) {
      groups.push({ day, msgs: [msg] });
    } else {
      last.msgs.push(msg);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="rounded-2xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-6 py-4">
          <p className="text-sm text-[#FF1744]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Chat</h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">Mensajes con tu entrenador</p>
      </div>

      {/* Chat window */}
      <div className="flex h-[620px] flex-col rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00E5FF]/10 text-xs font-bold text-[#00E5FF]">
            {getInitials(trainer?.full_name ?? null)}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{trainer?.full_name ?? "Tu entrenador"}</p>
            <p className="text-xs text-[#8B8BA3]">Conversación privada</p>
          </div>
          <div className="ml-auto flex h-2 w-2 rounded-full bg-[#00C853]" title="Activo" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
                <svg className="h-6 w-6 text-[#8B8BA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white">Sin mensajes aún</p>
              <p className="text-xs text-[#8B8BA3]">Empieza la conversación con tu entrenador</p>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.day}>
              <div className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <p className="text-xs text-[#5A5A72] capitalize">{formatDay(group.msgs[0].created_at)}</p>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {group.msgs.map((msg) => {
                const isClient = msg.sender_id === clientId || msg.sender_id === clientIdRef.current;
                const isOptimistic = msg.id.startsWith("opt-");
                return (
                  <div key={msg.id} className={`flex mb-2 ${isClient ? "justify-end" : "justify-start"}`}>
                    {!isClient && (
                      <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00E5FF]/10 text-[10px] font-bold text-[#00E5FF] self-end mb-0.5">
                        {getInitials(trainer?.full_name ?? null)}
                      </div>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isClient
                        ? "bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-white rounded-br-sm"
                        : "bg-white/[0.05] border border-white/[0.06] text-[#E8E8ED] rounded-bl-sm"
                    } ${isOptimistic ? "opacity-70" : ""}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      <div className={`mt-1 flex items-center gap-1 ${isClient ? "justify-end" : "justify-start"}`}>
                        <p className="text-[10px] text-[#5A5A72]">
                          {isOptimistic ? "Enviando…" : formatTime(msg.created_at)}
                        </p>
                        {isClient && !isOptimistic && (
                          <svg className={`h-3 w-3 ${msg.read_at ? "text-[#7C3AED]" : "text-[#5A5A72]"}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje… (Enter para enviar)"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#7C3AED]/40 focus:bg-white/[0.06] transition-all max-h-32 overflow-y-auto"
              style={{ minHeight: "44px" }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED] text-white transition-all hover:bg-[#7C3AED]/80 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-[#5A5A72]">Shift+Enter para salto de línea</p>
        </div>
      </div>
    </div>
  );
}
