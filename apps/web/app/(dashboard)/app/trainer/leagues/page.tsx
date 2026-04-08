"use client";

import { Suspense, useCallback, useEffect, useReducer } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import type { League, LeagueStatus } from "@fitos/shared";
import { LeagueList } from "./components/LeagueList";
import { LeagueForm } from "./components/LeagueForm";
import { Leaderboard } from "./components/Leaderboard";
import {
  leaguesReducer,
  INITIAL_STATE,
  type LeagueFormData,
  type LeaguesTab,
} from "./components/types";

const TABS: { key: LeaguesTab; label: string }[] = [
  { key: "list", label: "Ligas" },
  { key: "create", label: "Crear" },
];

function LeaguesPageInner() {
  const [state, dispatch] = useReducer(leaguesReducer, INITIAL_STATE);

  // ── Load data ──
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      const trainerId = session.user.id;

      const [leaguesRes, communityRes] = await Promise.all([
        supabase
          .from("leagues")
          .select(
            "id, trainer_id, title, description, metric, custom_metric_name, starts_at, ends_at, prize, status, created_at"
          )
          .eq("trainer_id", trainerId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("communities")
          .select("gamification_enabled")
          .eq("coach_id", trainerId)
          .single(),
      ]);

      if (leaguesRes.error) {
        console.error("[LeaguesPage] Error loading leagues");
        toast.error("Error al cargar ligas");
      }

      dispatch({
        type: "SET_LEAGUES",
        payload: (leaguesRes.data as League[]) ?? [],
      });
      dispatch({
        type: "SET_GAMIFICATION_ENABLED",
        payload: communityRes.data?.gamification_enabled ?? false,
      });
      dispatch({ type: "SET_LOADING", payload: false });
    };

    load();
  }, []);

  // ── Toggle gamification ──
  const handleToggleGamification = useCallback(async () => {
    dispatch({ type: "SET_TOGGLING_GAMIFICATION", payload: true });
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      dispatch({ type: "SET_TOGGLING_GAMIFICATION", payload: false });
      return;
    }

    const newVal = !state.gamificationEnabled;
    const { error } = await supabase
      .from("communities")
      .update({ gamification_enabled: newVal })
      .eq("coach_id", session.user.id);

    if (error) {
      console.error("[LeaguesPage] Error toggling gamification");
      toast.error("Error al cambiar gamificacion");
    } else {
      dispatch({ type: "SET_GAMIFICATION_ENABLED", payload: newVal });
      toast.success(
        newVal ? "Gamificacion activada" : "Gamificacion desactivada"
      );
    }
    dispatch({ type: "SET_TOGGLING_GAMIFICATION", payload: false });
  }, [state.gamificationEnabled]);

  // ── Create league ──
  const handleCreate = useCallback(async () => {
    const { title, metric, starts_at, ends_at, custom_metric_name } =
      state.form;

    if (!title.trim()) {
      toast.error("El titulo es obligatorio");
      return;
    }
    if (!starts_at || !ends_at) {
      toast.error("Las fechas son obligatorias");
      return;
    }
    if (new Date(ends_at) <= new Date(starts_at)) {
      toast.error("La fecha de fin debe ser posterior a la de inicio");
      return;
    }
    if (metric === "custom" && !custom_metric_name.trim()) {
      toast.error("Indica el nombre de la metrica personalizada");
      return;
    }

    dispatch({ type: "SET_CREATING", payload: true });

    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: state.form.title,
          description: state.form.description,
          metric: state.form.metric,
          custom_metric_name: state.form.custom_metric_name,
          starts_at: new Date(state.form.starts_at).toISOString(),
          ends_at: new Date(state.form.ends_at).toISOString(),
          prize: state.form.prize,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Error al crear la liga");
        dispatch({ type: "SET_CREATING", payload: false });
        return;
      }

      dispatch({ type: "ADD_LEAGUE", payload: json.league });
      dispatch({ type: "RESET_FORM" });
      dispatch({ type: "SET_TAB", payload: "list" });
      toast.success("Liga creada correctamente");
    } catch {
      toast.error("Error inesperado al crear la liga");
      dispatch({ type: "SET_CREATING", payload: false });
    }
  }, [state.form]);

  // ── Update league status ──
  const handleUpdateStatus = useCallback(
    async (leagueId: string, newStatus: LeagueStatus) => {
      try {
        const res = await fetch("/api/leagues", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: leagueId, status: newStatus }),
        });

        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? "Error al actualizar la liga");
          return;
        }

        dispatch({ type: "UPDATE_LEAGUE", payload: json.league });
        toast.success("Estado de la liga actualizado");
      } catch {
        toast.error("Error inesperado al actualizar");
      }
    },
    []
  );

  // ── Delete league ──
  const handleDelete = useCallback(async (leagueId: string) => {
    dispatch({ type: "SET_DELETING", payload: true });
    try {
      const res = await fetch("/api/leagues", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leagueId }),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Error al eliminar la liga");
        dispatch({ type: "SET_DELETING", payload: false });
        return;
      }

      dispatch({ type: "REMOVE_LEAGUE", payload: leagueId });
      toast.success("Liga eliminada");
    } catch {
      toast.error("Error inesperado al eliminar");
    }
    dispatch({ type: "SET_DELETING", payload: false });
  }, []);

  // ── View leaderboard ──
  const handleViewLeaderboard = useCallback(async (leagueId: string) => {
    dispatch({ type: "SET_SELECTED_LEAGUE", payload: leagueId });
    dispatch({ type: "SET_LOADING_LEADERBOARD", payload: true });

    try {
      const res = await fetch(`/api/leagues/${leagueId}/leaderboard`);
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Error al cargar clasificacion");
        dispatch({ type: "SET_LOADING_LEADERBOARD", payload: false });
        return;
      }

      dispatch({ type: "SET_LEADERBOARD", payload: json.participants ?? [] });
    } catch {
      toast.error("Error al cargar clasificacion");
      dispatch({ type: "SET_LOADING_LEADERBOARD", payload: false });
    }
  }, []);

  // ── Enroll all clients ──
  const handleEnrollAll = useCallback(async (leagueId: string) => {
    dispatch({ type: "SET_ENROLLING", payload: true });
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      dispatch({ type: "SET_ENROLLING", payload: false });
      return;
    }

    // Get all active clients
    const { data: clients, error: clientsErr } = await supabase
      .from("trainer_clients")
      .select("client_id")
      .eq("trainer_id", session.user.id)
      .eq("status", "active");

    if (clientsErr || !clients) {
      toast.error("Error al cargar clientes");
      dispatch({ type: "SET_ENROLLING", payload: false });
      return;
    }

    if (clients.length === 0) {
      toast.error("No tienes clientes activos");
      dispatch({ type: "SET_ENROLLING", payload: false });
      return;
    }

    // Batch insert — unique constraint silently skips duplicates with upsert
    const rows = clients.map((c) => ({
      league_id: leagueId,
      client_id: c.client_id,
      score: 0,
    }));

    const { error: insertErr } = await supabase
      .from("league_participants")
      .upsert(rows, { onConflict: "league_id,client_id", ignoreDuplicates: true });

    if (insertErr) {
      console.error("[LeaguesPage] Error enrolling all clients");
      toast.error("Error al inscribir clientes");
    } else {
      toast.success(`${clients.length} clientes inscritos`);
    }

    dispatch({ type: "SET_ENROLLING", payload: false });
  }, []);

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
