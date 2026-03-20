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
 * Handles the auth check + loading/error state in one place
 * so pages don't need to repeat this pattern.
 */
export function useUser(): UserState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user }, error: authError }) => {
      if (authError || !user) {
        setError("No se pudo obtener la sesión del usuario.");
      } else {
        setUser(user);
      }
      setLoading(false);
    });
  }, []);

  return { user, loading, error };
}
