"use client";

import { Suspense, useCallback, useEffect, useReducer } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import type { League, Badge, UserBadge } from "@fitos/shared";
import { ClientLeagueList } from "./components/ClientLeagueList";
import { BadgeCollection } from "./components/BadgeCollection";
import {
  clientLeaguesReducer,
  CLIENT_INITIAL_STATE,
  type ClientLeaguesTab,
} from "./components/types";

const TABS: { key: ClientLeaguesTab; label: string }[] = [
  { key: "leagues", label: "Ligas" },
  { key: "badges", label: "Insignias" },
];

function ClientLeaguesInner() {
  const [state, dispatch] = useReducer(clientLeaguesReducer, CLIENT_INITIAL_STATE);

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

      const userId = session.user.id;

      // Get trainer_id to check gamification status
      const { data: rel } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", userId)
        .eq("status", "active")
        .single();

      if (!rel) {
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      const [communityRes, leaguesRes, badgesRes, userBadgesRes] =
        await Promise.all([
          supabase
            .from("communities")
            .select("gamification_enabled")
            .eq("coach_id", rel.trainer_id)
            .single(),
          supabase
            .from("leagues")
            .select(
              "id, trainer_id, title, description, metric, custom_metric_name, starts_at, ends_at, prize, status, created_at"
            )
            .order("created_at", { ascending: false })
            .limit(100),
          supabase.from("badges").select("id, name, description, icon, condition"),
          supabase
            .from("user_badges")
            .select("id, user_id, badge_id, earned_at")
            .eq("user_id", userId),
        ]);

      const gamEnabled = communityRes.data?.gamification_enabled ?? false;
      dispatch({ type: "SET_GAMIFICATION_ENABLED", payload: gamEnabled });
      dispatch({
        type: "SET_LEAGUES",
        payload: (leaguesRes.data as League[]) ?? [],
      });
      dispatch({
        type: "SET_BADGES",
        payload: (badgesRes.data as Badge[]) ?? [],
      });
      dispatch({
        type: "SET_USER_BADGES",
        payload: (userBadgesRes.data as UserBadge[]) ?? [],
      });
      dispatch({ type: "SET_LOADING", payload: false });
    };

    load();
  }, []);

  // ── View leaderboard ──
  const handleSelectLeague = useCallback(
    async (leagueId: string | null) => {
      if (!leagueId) {
        dispatch({ type: "SET_SELECTED_LEAGUE", payload: null });
        return;
      }

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
    },
    []
  );

  // ── Join league ──
  const handleJoin = useCallback(async (leagueId: string) => {
    dispatch({ type: "SET_JOINING", payload: true });

    try {
      const res = await fetch(`/api/leagues/${leagueId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          toast.info("Ya participas en esta liga");
        } else {
          toast.error(json.error ?? "Error al unirse a la liga");
        }
        dispatch({ type: "SET_JOINING", payload: false });
        return;
      }

      toast.success("Te has unido a la liga");
    } catch {
      toast.error("Error inesperado al unirse");
    }

    dispatch({ type: "SET_JOINING", payload: false });
  }, []);

  if (state.loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
      </div>
    );
  }

  if (!state.gamificationEnabled) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#7C3AED]/10">
          <svg className="h-7 w-7 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-3.52 1.122 6.023 6.023 0 0 1-3.52-1.122" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white">
          Ligas no disponibles
        </h2>
        <p className="mt-2 max-w-xs text-sm text-[#5A5A72]">
          Tu entrenador aun no ha activado el sistema de gamificacion
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Ligas y Logros
        </h1>
        <p className="mt-1 text-sm text-[#5A5A72]">
          Compite con otros clientes y gana insignias
        </p>
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

      {/* Content */}
      {state.activeTab === "leagues" && (
        <ClientLeagueList
          leagues={state.leagues}
          selectedLeagueId={state.selectedLeagueId}
          leaderboard={state.leaderboard}
          loadingLeaderboard={state.loadingLeaderboard}
          joining={state.joining}
          onSelectLeague={handleSelectLeague}
          onJoin={handleJoin}
        />
      )}

      {state.activeTab === "badges" && (
        <BadgeCollection badges={state.badges} userBadges={state.userBadges} />
      )}
    </div>
  );
}

export default function ClientLeaguesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
        </div>
      }
    >
      <ClientLeaguesInner />
    </Suspense>
  );
}
