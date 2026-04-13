/**
 * OfflineContext — Provides offline state to the entire app.
 *
 * Wraps useOffline hook into a context so any component can access
 * sync state, connectivity status, and trigger manual syncs.
 *
 * Shows an offline banner at the top of the screen when disconnected.
 */

import React, { createContext, useContext } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors } from "../theme";
import { useOffline, type OfflineState } from "../hooks/useOffline";

// ─── Context ────────────────────────────────────────────────────────────────

const OfflineContext = createContext<OfflineState>({
  isOnline: true,
  isSyncing: false,
  lastSyncAt: null,
  pendingChanges: 0,
  dbAvailable: false,
  syncNow: async () => {},
});

// ─── Provider ───────────────────────────────────────────────────────────────

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const offlineState = useOffline();

  return (
    <OfflineContext.Provider value={offlineState}>
      {!offlineState.isOnline && <OfflineBanner pendingChanges={offlineState.pendingChanges} />}
      {offlineState.isSyncing && offlineState.isOnline && <SyncingBanner />}
      {children}
    </OfflineContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useOfflineContext(): OfflineState {
  return useContext(OfflineContext);
}

// ─── Offline Banner ─────────────────────────────────────────────────────────

function OfflineBanner({ pendingChanges }: { pendingChanges: number }) {
  return (
    <View style={styles.offlineBanner}>
      <View style={styles.bannerContent}>
        <View style={styles.dotOffline} />
        <Text style={styles.bannerText}>
          Sin conexion
        </Text>
        {pendingChanges > 0 && (
          <Text style={styles.pendingText}>
            {pendingChanges} {pendingChanges === 1 ? "cambio pendiente" : "cambios pendientes"}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Syncing Banner ─────────────────────────────────────────────────────────

function SyncingBanner() {
  return (
    <View style={styles.syncingBanner}>
      <View style={styles.bannerContent}>
        <ActivityIndicator size="small" color={colors.bg} />
        <Text style={styles.syncingText}>Sincronizando...</Text>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: "#FF9100",
    paddingVertical: 6,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  syncingBanner: {
    backgroundColor: colors.cyan,
    paddingVertical: 4,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dotOffline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF1744",
  },
  bannerText: {
    color: colors.bg,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    letterSpacing: 0.3,
  },
  pendingText: {
    color: colors.bg,
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    opacity: 0.85,
  },
  syncingText: {
    color: colors.bg,
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
    marginLeft: 4,
  },
});
