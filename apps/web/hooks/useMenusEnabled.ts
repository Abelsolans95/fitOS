"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

/**
 * Returns whether the current user has menus/nutrition enabled.
 * Defaults to true (feature visible) until profile is loaded.
 */
export function useMenusEnabled(): boolean {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("menus_enabled")
        .eq("user_id", session.user.id)
        .single();

      if (!error && data) {
        setEnabled(data.menus_enabled ?? true);
      }
    };

    check();
  }, []);

  return enabled;
}
