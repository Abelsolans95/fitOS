"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useTicketsPage } from "./useTicketsPage";
import { TicketList } from "./components/TicketList";
import { TicketDetail } from "./components/TicketDetail";
import { EmptyState } from "./components/shared";
import type { SupportTicket } from "./components/types";

function TicketsPageInner() {
  const router = useRouter();
  const {
    state,
    dispatch,
    filteredTickets,
    selectedTicket,
    handleSelectTicket,
    handleSendReply,
    handleUpdateStatus,
  } = useTicketsPage();

  const handleCreateArticle = (ticket: SupportTicket) => {
    // Navigate to knowledge page with ticket data as query params
    const params = new URLSearchParams({
      from_ticket: ticket.id,
      title: ticket.subject,
      category: ticket.category,
    });
    router.push(`/app/trainer/knowledge?${params.toString()}`);
  };

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
      <div className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-white">Consultas</h1>
        <p className="mt-1 text-sm text-[#5A5A72]">
          Resuelve dudas y problemas de tus clientes
        </p>
      </div>

      {/* Content — master-detail layout */}
      <div className="flex flex-1 gap-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0A0A0F]">
        {/* Left panel — ticket list */}
        <div
          className={`w-full flex-shrink-0 border-r border-white/[0.06] p-4 lg:w-[380px] ${
            selectedTicket ? "hidden lg:block" : ""
          }`}
        >
          <TicketList
            tickets={filteredTickets}
            selectedTicketId={state.selectedTicketId}
            activeTab={state.activeTab}
            filterCategory={state.filterCategory}
            searchQuery={state.searchQuery}
            onSelectTicket={handleSelectTicket}
            onSetTab={(tab) => dispatch({ type: "SET_ACTIVE_TAB", payload: tab })}
            onSetCategory={(cat) => dispatch({ type: "SET_FILTER_CATEGORY", payload: cat })}
            onSetSearch={(q) => dispatch({ type: "SET_SEARCH", payload: q })}
          />
        </div>

        {/* Right panel — ticket detail */}
        <div
          className={`flex-1 p-4 ${
            selectedTicket ? "" : "hidden lg:flex"
          }`}
        >
          {selectedTicket ? (
            <TicketDetail
              ticket={selectedTicket}
              replies={state.replies}
              loadingReplies={state.loadingReplies}
              replyContent={state.replyContent}
              sending={state.sending}
              onSetReplyContent={(v) => dispatch({ type: "SET_REPLY_CONTENT", payload: v })}
              onSendReply={handleSendReply}
              onUpdateStatus={handleUpdateStatus}
              onBack={() => handleSelectTicket(null)}
              onCreateArticle={handleCreateArticle}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState message="Selecciona una consulta para ver los detalles" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TicketsPage() {
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
