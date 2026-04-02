"use client";

import { memo, useRef, useEffect } from "react";
import type { SupportTicket, TicketReply } from "./types";
import { CategoryBadge, StatusBadge, timeAgo } from "./shared";

interface TicketThreadProps {
  ticket: SupportTicket;
  replies: TicketReply[];
  loadingReplies: boolean;
  replyContent: string;
  sending: boolean;
  onSetReplyContent: (v: string) => void;
  onSendReply: () => void;
  onBack: () => void;
}

export const TicketThread = memo(function TicketThread({
  ticket,
  replies,
  loadingReplies,
  replyContent,
  sending,
  onSetReplyContent,
  onSendReply,
  onBack,
}: TicketThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [replies]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendReply();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg p-1.5 text-[#5A5A72] transition-colors hover:bg-white/5 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-white">{ticket.subject}</h2>
            <p className="mt-0.5 text-xs text-[#5A5A72]">{timeAgo(ticket.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <CategoryBadge category={ticket.category} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto py-4">
        {/* Original message */}
        <div className="rounded-xl border border-white/[0.06] bg-[#12121A] p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E5FF]/20 text-xs font-bold text-[#00E5FF]">
              T
            </div>
            <span className="text-sm font-semibold text-[#00E5FF]">Tú</span>
            <span className="text-xs text-[#5A5A72]">{timeAgo(ticket.created_at)}</span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-[#8B8BA3]">{ticket.description}</p>
          {ticket.image_url && (
            <img
              src={ticket.image_url}
              alt="Adjunto"
              className="mt-3 max-h-64 rounded-lg border border-white/[0.06] object-cover"
            />
          )}
        </div>

        {/* Replies */}
        {loadingReplies ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
          </div>
        ) : (
          replies.map((reply) => {
            const isClient = reply.sender_role === "client";
            return (
              <div key={reply.id} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-xl p-3 ${
                    isClient
                      ? "bg-[#00E5FF]/5 border border-[#00E5FF]/20"
                      : "bg-[#7C3AED]/10 border border-[#7C3AED]/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${isClient ? "text-[#00E5FF]" : "text-[#7C3AED]"}`}>
                      {isClient ? "Tú" : "Coach"}
                    </span>
                    {!isClient && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#7C3AED]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#7C3AED]">
                        <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                        </svg>
                        Coach
                      </span>
                    )}
                    <span className="text-[10px] text-[#5A5A72]">{timeAgo(reply.created_at)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#8B8BA3]">{reply.content}</p>
                  {reply.image_url && (
                    <img
                      src={reply.image_url}
                      alt="Adjunto"
                      className="mt-2 max-h-48 rounded-lg border border-white/[0.06] object-cover"
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply input */}
      {ticket.status !== "resolved" ? (
        <div className="border-t border-white/[0.06] pt-3">
          <div className="flex gap-2">
            <textarea
              value={replyContent}
              onChange={(e) => onSetReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu respuesta..."
              rows={2}
              className="flex-1 resize-none rounded-xl border border-white/[0.06] bg-[#12121A] px-4 py-3 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/30"
            />
            <button
              onClick={onSendReply}
              disabled={sending || !replyContent.trim()}
              className="self-end rounded-xl bg-[#00E5FF] px-4 py-3 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/80 disabled:opacity-40"
            >
              {sending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F]/20 border-t-[#0A0A0F]" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-white/[0.06] pt-3">
          <p className="text-center text-sm text-[#00C853]">
            Esta consulta ha sido resuelta
          </p>
        </div>
      )}
    </div>
  );
});
