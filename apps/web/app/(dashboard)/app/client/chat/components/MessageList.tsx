import { memo, useRef, useEffect } from "react";
import type { Message, TrainerInfo } from "@/hooks/useChat";
import { getInitials, formatChatTime } from "@/lib/utils";

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

interface Props {
  messages: Message[];
  clientId: string | null;
  clientIdRef: React.RefObject<string>;
  trainer: TrainerInfo | null;
}

export const MessageList = memo(function MessageList({ messages, clientId, clientIdRef, trainer }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Group by day
  type Group = { day: string; msgs: Message[] };
  const groups: Group[] = [];
  for (const msg of messages) {
    const day = new Date(msg.created_at).toDateString();
    const last = groups[groups.length - 1];
    if (!last || last.day !== day) groups.push({ day, msgs: [msg] });
    else last.msgs.push(msg);
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
          <svg className="h-6 w-6 text-[#8B8BA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-white">Sin mensajes aún</p>
        <p className="text-xs text-[#8B8BA3]">Empieza la conversación con tu entrenador</p>
      </div>
    );
  }

  return (
    <>
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
                    : "bg-white/[0.05] border border-white/10 text-[#E8E8ED] rounded-bl-sm"
                } ${isOptimistic ? "opacity-70" : ""}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className={`mt-1 flex items-center gap-1 ${isClient ? "justify-end" : "justify-start"}`}>
                    <p className="text-[10px] text-[#5A5A72]">
                      {isOptimistic ? "Enviando…" : formatChatTime(msg.created_at)}
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
    </>
  );
});
