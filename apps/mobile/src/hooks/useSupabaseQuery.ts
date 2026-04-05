import { useState, useEffect, useCallback, useRef } from "react";

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
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  // Stable key derived from deps — avoids spreading dynamic arrays in the dep list
  const depsKey = JSON.stringify(deps);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    queryFnRef.current()
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
  }, [tick, depsKey]);

  return { data, loading, error, refetch };
}
