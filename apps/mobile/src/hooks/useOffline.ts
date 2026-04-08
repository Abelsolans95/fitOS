/**
 * useOffline — Hook for offline state and sync controls.
 *
 * Provides: { isOnline, isSyncing, lastSyncAt, syncNow, pendingChanges, dbAvailable }
 *
 * Uses @react-native-community/netinfo via dynamic import to avoid
 * crashes in environments where the native module is absent.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import {
  syncWithSupabase,
  getLastSyncAt,
  getCachedPendingCount,
  countPendingChanges,
} from "../lib/offline/sync";
import { getDatabase } from "../lib/offline/database";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OfflineState {
  /** Whether the device currently has network connectivity */
  isOnline: boolean;
  /** Whether a sync operation is in progress */
  isSyncing: boolean;
  /** ISO timestamp of last successful sync, or null */
  lastSyncAt: string | null;
  /** Number of records waiting to be pushed to server */
  pendingChanges: number;
  /** Whether the WatermelonDB database is available */
  dbAvailable: boolean;
  /** Trigger a manual sync */
  syncNow: () => Promise<void>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useOffline(): OfflineState {
  const { user } = useAuth();

  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [dbAvailable, setDbAvailable] = useState(false);

  const isSyncingRef = useRef(false);
  const netInfoUnsubRef = useRef<(() => void) | null>(null);

  // ── Initialize DB + load cached state ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Check database availability
      const dbState = await getDatabase();
      if (cancelled) return;
      setDbAvailable(dbState.available);

      // Load cached sync state
      const [cachedLastSync, cachedPending] = await Promise.all([
        getLastSyncAt(),
        getCachedPendingCount(),
      ]);
      if (cancelled) return;
      setLastSyncAt(cachedLastSync);
      setPendingChanges(cachedPending);
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── NetInfo subscription (dynamic import) ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const setupNetInfo = async () => {
      try {
        const NetInfo = await import("@react-native-community/netinfo");
        if (cancelled) return;

        const unsubscribe = NetInfo.default.addEventListener((state) => {
          const online = state.isConnected ?? true;
          setIsOnline(online);

          // Auto-sync when connection returns
          if (online && user?.id && !isSyncingRef.current) {
            performSync(user.id);
          }
        });

        netInfoUnsubRef.current = unsubscribe;
      } catch {
        // NetInfo not available — assume online
        console.warn("[useOffline] NetInfo not available, assuming online");
        setIsOnline(true);
      }
    };

    setupNetInfo();

    return () => {
      cancelled = true;
      netInfoUnsubRef.current?.();
      netInfoUnsubRef.current = null;
    };
  }, [user?.id]);

  // ── Auto-sync on app focus ────────────────────────────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && isOnline && user?.id && !isSyncingRef.current) {
        performSync(user.id);
      }
    });

    return () => subscription.remove();
  }, [isOnline, user?.id]);

  // ── Initial sync on mount (when online + authenticated) ───────────────────
  useEffect(() => {
    if (user?.id && isOnline && dbAvailable) {
      performSync(user.id);
    }
  }, [user?.id, dbAvailable]);

  // ── Sync implementation ───────────────────────────────────────────────────
  const performSync = useCallback(
    async (userId: string) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      setIsSyncing(true);

      try {
        const result = await syncWithSupabase(userId);

        if (result.success) {
          setLastSyncAt(new Date().toISOString());
        }

        if (result.errors.length > 0) {
          console.warn("[useOffline] Sync completed with errors:", result.errors);
        }

        // Refresh pending count
        const pending = await countPendingChanges();
        setPendingChanges(pending);
      } catch (err) {
        console.error("[useOffline] Sync failed:", err);
      } finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    },
    []
  );

  // ── Public sync trigger ───────────────────────────────────────────────────
  const syncNow = useCallback(async () => {
    if (!user?.id) return;
    await performSync(user.id);
  }, [user?.id, performSync]);

  return {
    isOnline,
    isSyncing,
    lastSyncAt,
    pendingChanges,
    dbAvailable,
    syncNow,
  };
}
