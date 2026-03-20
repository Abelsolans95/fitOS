import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

interface TrainerKPIs {
  totalClients: number;
  activeClients: number;
  pendingOnboarding: number;
  recentActivity: Array<{
    id: string;
    client_id: string;
    activity_type: string;
    date: string;
    completed: boolean;
  }>;
}

interface TrainerDashboardState {
  trainerName: string;
  kpis: TrainerKPIs;
  loading: boolean;
  error: string | null;
}

const DEFAULT_KPIS: TrainerKPIs = {
  totalClients: 0,
  activeClients: 0,
  pendingOnboarding: 0,
  recentActivity: [],
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

        const [profileRes, clientsRes, activityRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
          supabase.from("trainer_clients").select("id, status, client_id").eq("trainer_id", user.id),
          supabase
            .from("user_calendar")
            .select("id, client_id, activity_type, date, completed")
            .order("date", { ascending: false })
            .limit(10),
        ]);

        const fullName =
          profileRes.data?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Entrenador";
        setTrainerName(fullName);

        const clients = clientsRes.data ?? [];
        setKpis({
          totalClients: clients.length,
          activeClients: clients.filter((c) => c.status === "active").length,
          pendingOnboarding: clients.filter((c) => c.status === "pending").length,
          recentActivity: activityRes.data ?? [],
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
