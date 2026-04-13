"use client";

import { Suspense } from "react";
import type { LeaguesTab } from "./components/types";
import { LeagueList } from "./components/LeagueList";
import { LeagueForm } from "./components/LeagueForm";
import { Leaderboard } from "./components/Leaderboard";
import { useLeaguesPage } from "./useLeaguesPage";

const TABS: { key: LeaguesTab; label: string }[] = [
  { key: "list", label: "Ligas" },
  { key: "create", label: "Crear" },
];

function LeaguesPageInner() {
  const {
    state,
    dispatch,
    handleToggleGamification,
    handleCreate,
    handleUpdateStatus,
    handleDelete,
    handleViewLeaderboard,
    handleEnrollAll,
  } = useLeaguesPage();

  if (state.loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
      </div>
    );
  }

  const selectedLeague = state.leagues.find(
    (l) => l.id === state.selectedLeagueId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Ligas y Gamificacion
          </h1>
          <p className="mt-1 text-sm text-[#5A5A72]">
            Competiciones para motivar a tus clientes
          </p>
        </div>

        {/* Gamification toggle */}
        <button
          onClick={handleToggleGamification}
          disabled={state.togglingGamification}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 ${
            state.gamificationEnabled
              ? "bg-[#00C853]/10 text-[#00C853] hover:bg-[#00C853]/20"
              : "bg-[#FF1744]/10 text-[#FF1744] hover:bg-[#FF1744]/20"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              state.gamificationEnabled ? "bg-[#00C853]" : "bg-[#FF1744]"
            }`}
          />
          {state.gamificationEnabled
            ? "Gamificacion activada"
            : "Gamificacion desactivada"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-[#12121A] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => dispatch({ type: "SET_TAB", payload: tab.key })}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              state.activeTab === tab.key
                ? "bg-[#00E5FF]/10 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.1)]"
                : "text-[#5A5A72] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard panel */}
      {state.selectedLeagueId && selectedLeague && (
        <Leaderboard
          participants={state.leaderboard}
          loading={state.loadingLeaderboard}
          leagueTitle={selectedLeague.title}
          onClose={() =>
            dispatch({ type: "SET_SELECTED_LEAGUE", payload: null })
          }
        />
      )}

      {/* Content */}
      {state.activeTab === "list" && (
        <LeagueList
          leagues={state.leagues}
          confirmDeleteId={state.confirmDeleteId}
          deleting={state.deleting}
          onViewLeaderboard={handleViewLeaderboard}
          onUpdateStatus={handleUpdateStatus}
          onConfirmDelete={(id) =>
            dispatch({ type: "SET_CONFIRM_DELETE", payload: id })
          }
          onDelete={handleDelete}
          onEnrollAll={handleEnrollAll}
          enrolling={state.enrolling}
        />
      )}

      {state.activeTab === "create" && (
        <LeagueForm
          form={state.form}
          creating={state.creating}
          onFieldChange={(field, value) =>
            dispatch({
              type: "SET_FORM_FIELD",
              payload: { field, value },
            })
          }
          onSubmit={handleCreate}
          onCancel={() => dispatch({ type: "SET_TAB", payload: "list" })}
        />
      )}
    </div>
  );
}

export default function LeaguesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
        </div>
      }
    >
      <LeaguesPageInner />
    </Suspense>
  );
}
