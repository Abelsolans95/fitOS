import { useState, useEffect, useCallback } from "react";

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic hook for Supabase async data fetching.
 * Eliminates the repeated useState/useEffect + try/catch/finally pattern
 * found across every mobile screen.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useSupabaseQuery(
 *     async () => {
 *       const { data } = await supabase.from("table").select("*");
 *       return data;
 *     },
 *     [dependency]
 *   );
 */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<T | null>,
  deps: unknown[] = []
): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    queryFn()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Error al cargar los datos.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, loading, error, refetch };
}
