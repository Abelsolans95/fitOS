"use client";

import { Suspense } from "react";
import { useContractsPage } from "./useContractsPage";
import { ContractList } from "./components/ContractList";
import { ContractDetail } from "./components/ContractDetail";
import { CreateContractForm } from "./components/CreateContractForm";
import { EmptyState } from "./components/shared";

function ContractsPageInner() {
  const {
    state,
    dispatch,
    filteredContracts,
    selectedContract,
    handleCreate,
    handleSend,
    handleExpire,
    handleDelete,
    handleApplyTemplate,
  } = useContractsPage();

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
          <h1 className="text-2xl font-black tracking-tight text-white">Contratos</h1>
          <p className="mt-1 text-sm text-[#5A5A72]">
            Gestiona contratos con tus clientes
          </p>
        </div>
        {state.activeView === "list" && (
          <button
            onClick={() => dispatch({ type: "SET_VIEW", payload: "create" })}
            className="rounded-xl bg-[#00E5FF] px-4 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/80"
          >
            Nuevo contrato
          </button>
        )}
      </div>

      {/* Content */}
      {state.activeView === "create" ? (
        <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0F] p-4">
          <CreateContractForm
            clients={state.clients}
            templates={state.templates}
            clientId={state.formClientId}
            title={state.formTitle}
            content={state.formContent}
            templateId={state.formTemplateId}
            submitting={state.submitting}
            onSetClientId={(v) => dispatch({ type: "SET_FORM_CLIENT_ID", payload: v })}
            onSetTitle={(v) => dispatch({ type: "SET_FORM_TITLE", payload: v })}
            onSetContent={(v) => dispatch({ type: "SET_FORM_CONTENT", payload: v })}
            onApplyTemplate={handleApplyTemplate}
            onSubmit={handleCreate}
            onCancel={() => dispatch({ type: "RESET_FORM" })}
          />
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0F]">
          {/* Left panel — contract list */}
          <div
            className={`w-full flex-shrink-0 border-r border-white/10 p-4 lg:w-[380px] ${
              selectedContract ? "hidden lg:block" : ""
            }`}
          >
            <ContractList
              contracts={filteredContracts}
              selectedId={state.selectedContractId}
              activeTab={state.activeTab}
              onSelectContract={(id) => dispatch({ type: "SELECT_CONTRACT", payload: id })}
              onSetTab={(tab) => dispatch({ type: "SET_TAB", payload: tab })}
            />
          </div>

          {/* Right panel — contract detail */}
          <div
            className={`flex-1 p-4 ${
              selectedContract ? "" : "hidden lg:flex"
            }`}
          >
            {selectedContract ? (
              <ContractDetail
                contract={selectedContract}
                confirmDeleteId={state.confirmDeleteId}
                onSend={handleSend}
                onExpire={handleExpire}
                onDelete={handleDelete}
                onConfirmDelete={(id) => dispatch({ type: "CONFIRM_DELETE", payload: id })}
                onBack={() => dispatch({ type: "SELECT_CONTRACT", payload: null })}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <EmptyState message="Selecciona un contrato para ver los detalles" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrainerContractsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
        </div>
      }
    >
      <ContractsPageInner />
    </Suspense>
  );
}
