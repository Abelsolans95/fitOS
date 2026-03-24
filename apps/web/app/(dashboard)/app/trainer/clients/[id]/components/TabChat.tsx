"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Message } from "./types";

export function TabChat({
  trainerId,
  clientId,
  clientName,
}: {
  trainerId: string;
  clientId: string;
  clientName: string | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load initial messages and subscribe to Realtime
  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("trainer_id", trainerId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: true })
        .limit(100);
      setMessages((data as Message[]) ?? []);
      setLoading(false);

      // Mark client messages as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("trainer_id", trainerId)
        .eq("client_id", clientId)
        .eq("sender_id", clientId)
        .is("read_at", null);
    };

    load();

    const channel = supabase
      .channel(`chat:${trainerId}:${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `trainer_id=eq.${trainerId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.client_id !== clientId) return;
          // Trainer's own messages are added optimistically — only add client messages via Realtime
          if (msg.sender_id === trainerId) return;
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Auto-mark client message as read
          supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("id", msg.id)
            .then(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trainerId, clientId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    // Optimistic update — show message immediately
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      trainer_id: trainerId,
      client_id: clientId,
      sender_id: trainerId,
      content: text,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const supabase = createClient();
    const { data, error: insertErr } = await supabase
      .from("messages")
      .insert({
        trainer_id: trainerId,
        client_id: clientId,
        sender_id: trainerId,
        content: text,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[Chat] Error al enviar mensaje:", insertErr);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, id: `err-${Date.now()}` } : m))
      );
    } else if (data) {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? (data as Message) : m)));
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  const formatDay = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

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

  return (
    <div className="flex h-[580px] flex-col rounded-2xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7C3AED]/10 text-xs font-bold text-[#7C3AED]">
          {clientName
            ? clientName
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0])
                .join("")
                .toUpperCase()
            : "??"}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{clientName ?? "Cliente"}</p>
          <p className="text-xs text-[#8B8BA3]">Conversación privada</p>
        </div>
        <div className="ml-auto flex h-2 w-2 rounded-full bg-[#00C853]" title="En línea" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
              <svg className="h-6 w-6 text-[#8B8BA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">Sin mensajes aún</p>
            <p className="text-xs text-[#8B8BA3]">Empieza la conversación con {clientName ?? "tu cliente"}</p>
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
              const isTrainer = msg.sender_id === trainerId;
              const isOptimistic = msg.id.startsWith("opt-");
              return (
                <div key={msg.id} className={`flex mb-2 ${isTrainer ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isTrainer
                        ? "bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-white rounded-br-sm"
                        : "bg-white/[0.05] border border-white/[0.06] text-[#E8E8ED] rounded-bl-sm"
                    } ${isOptimistic ? "opacity-70" : ""}`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={`mt-1 flex items-center gap-1 ${isTrainer ? "justify-end" : "justify-start"}`}>
                      <p className="text-[10px] text-[#5A5A72]">
                        {isOptimistic ? "Enviando…" : formatTime(msg.created_at)}
                      </p>
                      {isTrainer && !isOptimistic && (
                        <svg
                          className={`h-3 w-3 ${msg.read_at ? "text-[#00E5FF]" : "text-[#5A5A72]"}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
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
            className="flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/40 focus:bg-white/[0.06] transition-all max-h-32 overflow-y-auto"
            style={{ minHeight: "44px" }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF] text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/80 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
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
  );
}
