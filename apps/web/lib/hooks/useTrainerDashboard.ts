import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

export interface TrainerKPIs {
  activeClients: number;
  pendingForms: number;
  activeRoutines: number;
  activeMealPlans: number;
}

interface TrainerDashboardState {
  trainerName: string;
  kpis: TrainerKPIs;
  loading: boolean;
  error: string | null;
}

const DEFAULT_KPIS: TrainerKPIs = {
  activeClients: 0,
  pendingForms: 0,
  activeRoutines: 0,
  activeMealPlans: 0,
};

export function useTrainerDashboard(user: User | null): TrainerDashboardState {
  const [trainerName, setTrainerName] = useState("");
  const [kpis, setKpis] = useState<TrainerKPIs>(DEFAULT_KPIS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const supabase = createClient();
        const [profileRes, clientsRes, formsRes, routinesRes, mealsRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
          supabase.from("trainer_clients").select("id", { count: "exact", head: true }).eq("trainer_id", user.id).eq("status", "active"),
          supabase.from("onboarding_responses").select("id", { count: "exact", head: true }).eq("trainer_id", user.id),
          supabase.from("user_routines").select("id", { count: "exact", head: true }).eq("trainer_id", user.id).eq("is_active", true),
          supabase.from("meal_plans").select("id", { count: "exact", head: true }).eq("trainer_id", user.id).eq("is_active", true),
        ]);
        setTrainerName(
          profileRes.data?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Entrenador"
        );
        setKpis({
          activeClients: clientsRes.count ?? 0,
          pendingForms: formsRes.count ?? 0,
          activeRoutines: routinesRes.count ?? 0,
          activeMealPlans: mealsRes.count ?? 0,
        });
      } catch {
        setError("Error al cargar el dashboard.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return { trainerName, kpis, loading, error };
}
