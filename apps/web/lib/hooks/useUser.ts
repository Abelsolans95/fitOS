import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Returns the current Supabase user.
 * Uses getSession() (local JWT parse, no network call) instead of getUser()
 * because middleware + layout already verified the JWT server-side.
 * This avoids an extra ~1s round-trip on every page load.
 */
export function useUser(): UserState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError || !session?.user) {
        setError("No se pudo obtener la sesión del usuario.");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });
  }, []);

  return { user, loading, error };
}
