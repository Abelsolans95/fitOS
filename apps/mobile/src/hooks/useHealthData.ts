/**
 * useHealthData — Hook for Apple HealthKit / Google Health Connect integration.
 *
 * Reads health data on mount, caches results, and optionally syncs
 * weight changes to Supabase body_metrics.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import {
  isHealthAvailable,
  requestHealthPermissions,
  readHealthData,
  syncWeightToSupabase,
  type HealthData,
} from "../lib/health-sync";

interface UseHealthDataResult {
  /** Today's step count */
  steps: number | null;
  /** Last night's sleep in hours */
  sleepHours: number | null;
  /** Latest weight in kg from health source */
  weightKg: number | null;
  /** Latest heart rate in bpm */
  heartRate: number | null;
  /** Whether the hook is still loading data */
  loading: boolean;
  /** Error message (Spanish) if something went wrong */
  error: string | null;
  /** Whether health APIs are available on this device */
  available: boolean;
  /** Whether the user has granted health permissions */
  permissionGranted: boolean;
  /** Request permissions and load data */
  connectHealth: () => Promise<void>;
  /** Force refresh health data */
  refresh: () => Promise<void>;
}

const EMPTY: UseHealthDataResult = {
  steps: null,
  sleepHours: null,
  weightKg: null,
  heartRate: null,
  loading: false,
  error: null,
  available: false,
  permissionGranted: false,
  connectHealth: async () => {},
  refresh: async () => {},
};

export function useHealthData(user: User | null): UseHealthDataResult {
  const [data, setData] = useState<HealthData>({
    steps: null,
    sleepHours: null,
    weightKg: null,
    heartRate: null,
    lastSyncedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check availability and load data on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        const healthAvailable = await isHealthAvailable();
        if (cancelled) return;
        setAvailable(healthAvailable);

        if (!healthAvailable) {
          setLoading(false);
          return;
        }

        // Try reading data — will succeed if permissions were previously granted
        const healthData = await readHealthData();
        if (cancelled) return;

        const hasData =
          healthData.steps != null ||
          healthData.weightKg != null ||
          healthData.heartRate != null ||
          healthData.sleepHours != null;

        setPermissionGranted(hasData);
        setData(healthData);

        // Auto-sync weight if available
        if (healthData.weightKg != null && user.id) {
          syncWeightToSupabase(user.id, healthData.weightKg).catch(() => {});
        }
      } catch {
        if (!cancelled) {
          setError("No se pudieron leer los datos de salud");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const connectHealth = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const granted = await requestHealthPermissions();
      if (!mountedRef.current) return;

      if (!granted) {
        setError("Permisos de salud no concedidos");
        setPermissionGranted(false);
        setLoading(false);
        return;
      }

      setPermissionGranted(true);

      const healthData = await readHealthData(true);
      if (!mountedRef.current) return;
      setData(healthData);

      // Sync weight in background
      if (healthData.weightKg != null && user.id) {
        syncWeightToSupabase(user.id, healthData.weightKg).catch(() => {});
      }
    } catch {
      if (mountedRef.current) {
        setError("Error al conectar con la app de salud");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user || !permissionGranted) return;
    setLoading(true);
    setError(null);

    try {
      const healthData = await readHealthData(true);
      if (!mountedRef.current) return;
      setData(healthData);

      if (healthData.weightKg != null && user.id) {
        syncWeightToSupabase(user.id, healthData.weightKg).catch(() => {});
      }
    } catch {
      if (mountedRef.current) {
        setError("Error al actualizar datos de salud");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, permissionGranted]);

  if (!user) return EMPTY;

  return {
    steps: data.steps,
    sleepHours: data.sleepHours,
    weightKg: data.weightKg,
    heartRate: data.heartRate,
    loading,
    error,
    available,
    permissionGranted,
    connectHealth,
    refresh,
  };
}
