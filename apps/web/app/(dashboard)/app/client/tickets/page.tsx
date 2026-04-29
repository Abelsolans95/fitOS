"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useClientTicketsPage } from "./useClientTicketsPage";
import { CreateTicketForm } from "./components/CreateTicketForm";
import { TicketThread } from "./components/TicketThread";
import { CategoryBadge, StatusBadge, timeAgo } from "./components/shared";

function TicketsPageInner() {
  const router = useRouter();
  const {
    state,
    dispatch,
    selectedTicket,
    handleSelectTicket,
    handleCreateTicket,
    handleSendReply,
  } = useClientTicketsPage();

  if (state.loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Consultas</h1>
          <p className="mt-1 text-sm text-[#5A5A72]">
            Consulta dudas y problemas con tu entrenador
          </p>
        </div>
        {state.activeView === "list" && (
          <button
            onClick={() => dispatch({ type: "SET_VIEW", payload: "create" })}
            className="rounded-xl bg-[#00E5FF] px-4 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/80"
          >
            Nueva consulta
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0F] p-4">
        {state.activeView === "create" && (
          <CreateTicketForm
            category={state.formCategory}
            subject={state.formSubject}
            description={state.formDescription}
            submitting={state.submitting}
            trainerId={state.trainerId}
            onSetCategory={(c) => dispatch({ type: "SET_FORM_CATEGORY", payload: c })}
            onSetSubject={(v) => dispatch({ type: "SET_FORM_SUBJECT", payload: v })}
            onSetDescription={(v) => dispatch({ type: "SET_FORM_DESCRIPTION", payload: v })}
            onSubmit={handleCreateTicket}
            onCancel={() => dispatch({ type: "SET_VIEW", payload: "list" })}
            onViewArticle={(id) => router.push(`/app/client/knowledge?article=${id}`)}
          />
        )}

        {state.activeView === "detail" && selectedTicket && (
          <TicketThread
            ticket={selectedTicket}
            replies={state.replies}
            loadingReplies={state.loadingReplies}
            replyContent={state.replyContent}
            sending={state.sending}
            onSetReplyContent={(v) => dispatch({ type: "SET_REPLY_CONTENT", payload: v })}
            onSendReply={handleSendReply}
            onBack={() => handleSelectTicket(null)}
          />
        )}

        {state.activeView === "list" && (
          <div className="space-y-3">
            {state.tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="mb-4 h-12 w-12 text-[#5A5A72]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                </svg>
                <p className="text-sm text-[#5A5A72]">
                  Aún no tienes consultas. ¡Pregúntale a tu coach!
                </p>
                <button
                  onClick={() => dispatch({ type: "SET_VIEW", payload: "create" })}
                  className="mt-4 rounded-xl bg-[#00E5FF] px-6 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/80"
                >
                  Crear primera consulta
                </button>
              </div>
            ) : (
              state.tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket.id)}
                  className="w-full rounded-xl border border-white/10 bg-[#12121A] p-4 text-left transition-all hover:border-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-white">{ticket.subject}</span>
                        {(ticket.unread_count ?? 0) > 0 && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#7C3AED] px-1.5 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(124,58,237,0.4)]">
                            {ticket.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-[#8B8BA3]">{ticket.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <CategoryBadge category={ticket.category} />
                      <StatusBadge status={ticket.status} />
                      <span className="text-[10px] text-[#5A5A72]">{timeAgo(ticket.created_at)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
        </div>
      }
    >
      <TicketsPageInner />
    </Suspense>
  );
}
