"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface ChatThread {
  client_id: string;
  client_name: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return date.toLocaleDateString("es-ES", { weekday: "short" });
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function TrainerChatPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setTrainerId(user.id);

    const { data: messages } = await supabase
      .from("messages")
      .select("client_id, sender_id, content, read_at, created_at")
      .eq("trainer_id", user.id)
      .order("created_at", { ascending: false });

    if (!messages?.length) { setLoading(false); return; }

    // Group by client — first message per client = most recent
    const clientMap = new Map<string, { last_message: string; last_message_at: string; unread_count: number }>();
    for (const msg of messages) {
      if (!clientMap.has(msg.client_id)) {
        clientMap.set(msg.client_id, {
          last_message: msg.content,
          last_message_at: msg.created_at,
          unread_count: (!msg.read_at && msg.sender_id !== user.id) ? 1 : 0,
        });
      } else {
        if (!msg.read_at && msg.sender_id !== user.id) {
          clientMap.get(msg.client_id)!.unread_count++;
        }
      }
    }

    // Fetch profiles
    const clientIds = Array.from(clientMap.keys());
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", clientIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) ?? []);

    const result: ChatThread[] = Array.from(clientMap.entries()).map(([client_id, data]) => ({
      client_id,
      client_name: profileMap.get(client_id) ?? null,
      ...data,
    }));

    // Sort: unread first, then most recent
    result.sort((a, b) => {
      if (b.unread_count !== a.unread_count) return b.unread_count - a.unread_count;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

    setThreads(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchThreads();

    const supabase = createClient();
    const channel = supabase
      .channel("trainer-chat-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetchThreads)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchThreads]);

  const totalUnread = threads.reduce((sum, t) => sum + t.unread_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black tracking-tight text-white">Chat</h1>
          {totalUnread > 0 && (
            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#00E5FF] px-1.5 text-[11px] font-bold text-[#0A0A0F] shadow-[0_0_8px_rgba(0,229,255,0.4)]">
              {totalUnread}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-[#8B8BA3]">
          {threads.length > 0
            ? `${threads.length} conversación${threads.length !== 1 ? "es" : ""}`
            : "Mensajes con tus clientes"}
        </p>
      </div>

      {threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#12121A]/60 px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
            <svg className="h-6 w-6 text-[#5A5A72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white">Sin mensajes aún</p>
          <p className="mt-1 text-xs text-[#5A5A72]">Los mensajes de tus clientes aparecerán aquí</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#12121A]/60">
          {threads.map((thread, i) => (
            <button
              key={thread.client_id}
              type="button"
              onClick={() =>
                router.push(
                  `/app/trainer/clients/${thread.client_id}?from=chat&tab=comunicacion`
                )
              }
              className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] ${
                i < threads.length - 1 ? "border-b border-white/[0.04]" : ""
              }`}
            >
              {/* Avatar with unread dot */}
              <div
                className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  thread.unread_count > 0
                    ? "bg-[#00E5FF]/10 text-[#00E5FF]"
                    : "bg-[#7C3AED]/10 text-[#7C3AED]"
                }`}
              >
                {getInitials(thread.client_name)}
                {thread.unread_count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00E5FF] text-[9px] font-bold text-[#0A0A0F] shadow-[0_0_6px_rgba(0,229,255,0.6)]">
                    {thread.unread_count > 9 ? "9+" : thread.unread_count}
                  </span>
                )}
              </div>

              {/* Name + preview */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm font-semibold ${
                      thread.unread_count > 0 ? "text-white" : "text-[#8B8BA3]"
                    }`}
                  >
                    {thread.client_name ?? "Cliente"}
                  </p>
                  <span
                    className={`shrink-0 text-[11px] ${
                      thread.unread_count > 0 ? "text-[#00E5FF]" : "text-[#5A5A72]"
                    }`}
                  >
                    {formatTime(thread.last_message_at)}
                  </span>
                </div>
                <p
                  className={`mt-0.5 truncate text-xs ${
                    thread.unread_count > 0 ? "font-medium text-[#8B8BA3]" : "text-[#5A5A72]"
                  }`}
                >
                  {thread.last_message}
                </p>
              </div>

              <svg
                className="h-4 w-4 shrink-0 text-[#5A5A72]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
