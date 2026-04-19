/**
 * Health Sync — Apple HealthKit (iOS) + Google Health Connect (Android)
 *
 * Uses @kingstinct/react-native-healthkit for iOS
 * and react-native-health-connect for Android.
 *
 * All reads are wrapped in try/catch — the app must NEVER crash
 * if health APIs are unavailable (simulator, old devices, denied perms).
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HealthData {
  steps: number | null;
  sleepHours: number | null;
  weightKg: number | null;
  heartRate: number | null;
  lastSyncedAt: string | null;
}

const EMPTY_HEALTH: HealthData = {
  steps: null,
  sleepHours: null,
  weightKg: null,
  heartRate: null,
  lastSyncedAt: null,
};

const STORAGE_KEY_LAST_SYNC = "@kuvox/health_last_sync";
const STORAGE_KEY_CACHED_DATA = "@kuvox/health_cached_data";
const MIN_SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// ─── Platform availability ───────────────────────────────────────────────────

/**
 * Check if health APIs are available on this device/platform.
 * Returns false on web, simulators without HealthKit, or old Android.
 */
export async function isHealthAvailable(): Promise<boolean> {
  try {
    if (Platform.OS === "ios") {
      const HealthKit = await importHealthKit();
      if (!HealthKit) return false;
      const available = await HealthKit.isHealthDataAvailable();
      return available;
    }

    if (Platform.OS === "android") {
      const HC = await importHealthConnect();
      if (!HC) return false;
      const available = await HC.getSdkStatus();
      return available === HC.SdkAvailabilityStatus.SDK_AVAILABLE;
    }

    return false;
  } catch {
    return false;
  }
}

// ─── Dynamic imports (safe for platforms where native modules are missing) ───

async function importHealthKit(): Promise<typeof import("@kingstinct/react-native-healthkit") | null> {
  if (Platform.OS !== "ios") return null;
  try {
    return await import("@kingstinct/react-native-healthkit");
  } catch {
    console.warn("[HealthSync] HealthKit module not available");
    return null;
  }
}

async function importHealthConnect(): Promise<typeof import("react-native-health-connect") | null> {
  if (Platform.OS !== "android") return null;
  try {
    return await import("react-native-health-connect");
  } catch {
    console.warn("[HealthSync] Health Connect module not available");
    return null;
  }
}

// ─── Permission requests ─────────────────────────────────────────────────────

/**
 * Request read permissions for health data.
 * Returns true if permissions were granted (or already granted).
 */
export async function requestHealthPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === "ios") {
      return await requestIOSPermissions();
    }
    if (Platform.OS === "android") {
      return await requestAndroidPermissions();
    }
    return false;
  } catch (err) {
    console.error("[HealthSync] Error requesting permissions:", err);
    return false;
  }
}

async function requestIOSPermissions(): Promise<boolean> {
  const HealthKit = await importHealthKit();
  if (!HealthKit) return false;

  try {
    await HealthKit.requestAuthorization([
      HealthKit.HKQuantityTypeIdentifier.stepCount,
      HealthKit.HKQuantityTypeIdentifier.bodyMass,
      HealthKit.HKQuantityTypeIdentifier.heartRate,
    ], {
      read: [
        HealthKit.HKQuantityTypeIdentifier.stepCount,
        HealthKit.HKQuantityTypeIdentifier.bodyMass,
        HealthKit.HKQuantityTypeIdentifier.heartRate,
        HealthKit.HKCategoryTypeIdentifier.sleepAnalysis,
      ],
    });
    return true;
  } catch {
    return false;
  }
}

async function requestAndroidPermissions(): Promise<boolean> {
  const HC = await importHealthConnect();
  if (!HC) return false;

  try {
    await HC.initialize();
    const granted = await HC.requestPermission([
      { accessType: "read", recordType: "Steps" },
      { accessType: "read", recordType: "Weight" },
      { accessType: "read", recordType: "HeartRate" },
      { accessType: "read", recordType: "SleepSession" },
    ]);
    return (granted ?? []).length > 0;
  } catch {
    return false;
  }
}

// ─── Data reading ────────────────────────────────────────────────────────────

/**
 * Read all available health data for today.
 * Returns cached data if called within MIN_SYNC_INTERVAL_MS.
 */
export async function readHealthData(forceRefresh = false): Promise<HealthData> {
  try {
    // Check cache to avoid excessive reads
    if (!forceRefresh) {
      const cached = await getCachedHealthData();
      if (cached) return cached;
    }

    if (Platform.OS === "ios") {
      return await readIOSHealthData();
    }
    if (Platform.OS === "android") {
      return await readAndroidHealthData();
    }
    return EMPTY_HEALTH;
  } catch (err) {
    console.error("[HealthSync] Error reading health data:", err);
    return EMPTY_HEALTH;
  }
}

async function readIOSHealthData(): Promise<HealthData> {
  const HealthKit = await importHealthKit();
  if (!HealthKit) return EMPTY_HEALTH;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [steps, weight, heartRate, sleep] = await Promise.all([
    readIOSSteps(HealthKit, startOfDay, now),
    readIOSWeight(HealthKit),
    readIOSHeartRate(HealthKit),
    readIOSSleep(HealthKit, startOfDay, now),
  ]);

  const data: HealthData = {
    steps,
    weightKg: weight,
    heartRate,
    sleepHours: sleep,
    lastSyncedAt: now.toISOString(),
  };

  await cacheHealthData(data);
  return data;
}

async function readIOSSteps(
  HK: typeof import("@kingstinct/react-native-healthkit"),
  start: Date,
  end: Date
): Promise<number | null> {
  try {
    const result = await HK.queryStatisticsForQuantity(
      HK.HKQuantityTypeIdentifier.stepCount,
      { from: start, to: end },
      HK.HKStatisticsOptions.cumulativeSum
    );
    return result?.sumQuantity?.quantity ?? null;
  } catch {
    return null;
  }
}

async function readIOSWeight(
  HK: typeof import("@kingstinct/react-native-healthkit")
): Promise<number | null> {
  try {
    const samples = await HK.queryQuantitySamples(
      HK.HKQuantityTypeIdentifier.bodyMass,
      {
        limit: 1,
        ascending: false,
      }
    );
    if (samples.length === 0) return null;
    return Math.round(samples[0].quantity * 10) / 10; // 1 decimal
  } catch {
    return null;
  }
}

async function readIOSHeartRate(
  HK: typeof import("@kingstinct/react-native-healthkit")
): Promise<number | null> {
  try {
    const samples = await HK.queryQuantitySamples(
      HK.HKQuantityTypeIdentifier.heartRate,
      {
        limit: 1,
        ascending: false,
      }
    );
    if (samples.length === 0) return null;
    return Math.round(samples[0].quantity);
  } catch {
    return null;
  }
}

async function readIOSSleep(
  HK: typeof import("@kingstinct/react-native-healthkit"),
  start: Date,
  end: Date
): Promise<number | null> {
  try {
    const samples = await HK.queryCategorySamples(
      HK.HKCategoryTypeIdentifier.sleepAnalysis,
      { from: new Date(start.getTime() - 24 * 60 * 60 * 1000), to: end }
    );
    if (samples.length === 0) return null;

    // Sum sleep durations (asleep categories, not "inBed")
    let totalMs = 0;
    for (const sample of samples) {
      // value 1 = asleep, 2 = awake (filter only asleep)
      if (sample.value !== 2) {
        const sStart = new Date(sample.startDate).getTime();
        const sEnd = new Date(sample.endDate).getTime();
        totalMs += sEnd - sStart;
      }
    }
    return totalMs > 0 ? Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10 : null;
  } catch {
    return null;
  }
}

async function readAndroidHealthData(): Promise<HealthData> {
  const HC = await importHealthConnect();
  if (!HC) return EMPTY_HEALTH;

  try {
    await HC.initialize();
  } catch {
    return EMPTY_HEALTH;
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [steps, weight, heartRate, sleep] = await Promise.all([
    readAndroidSteps(HC, startOfDay, now),
    readAndroidWeight(HC),
    readAndroidHeartRate(HC),
    readAndroidSleep(HC, startOfDay, now),
  ]);

  const data: HealthData = {
    steps,
    weightKg: weight,
    heartRate,
    sleepHours: sleep,
    lastSyncedAt: now.toISOString(),
  };

  await cacheHealthData(data);
  return data;
}

async function readAndroidSteps(
  HC: typeof import("react-native-health-connect"),
  start: Date,
  end: Date
): Promise<number | null> {
  try {
    const result = await HC.readRecords("Steps", {
      timeRangeFilter: {
        operator: "between",
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    });
    const records = result.records ?? result ?? [];
    if (!Array.isArray(records) || records.length === 0) return null;
    const total = records.reduce((sum: number, r: { count?: number }) => sum + (r.count ?? 0), 0);
    return total > 0 ? total : null;
  } catch {
    return null;
  }
}

async function readAndroidWeight(
  HC: typeof import("react-native-health-connect")
): Promise<number | null> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const result = await HC.readRecords("Weight", {
      timeRangeFilter: {
        operator: "between",
        startTime: thirtyDaysAgo.toISOString(),
        endTime: now.toISOString(),
      },
    });
    const records = result.records ?? result ?? [];
    if (!Array.isArray(records) || records.length === 0) return null;
    // Latest record
    const latest = records[records.length - 1];
    const kg = latest?.weight?.inKilograms ?? latest?.weight ?? null;
    return kg != null ? Math.round(kg * 10) / 10 : null;
  } catch {
    return null;
  }
}

async function readAndroidHeartRate(
  HC: typeof import("react-native-health-connect")
): Promise<number | null> {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const result = await HC.readRecords("HeartRate", {
      timeRangeFilter: {
        operator: "between",
        startTime: oneHourAgo.toISOString(),
        endTime: now.toISOString(),
      },
    });
    const records = result.records ?? result ?? [];
    if (!Array.isArray(records) || records.length === 0) return null;
    const latest = records[records.length - 1];
    const samples = latest?.samples ?? [];
    if (samples.length === 0) return null;
    return Math.round(samples[samples.length - 1].beatsPerMinute ?? 0);
  } catch {
    return null;
  }
}

async function readAndroidSleep(
  HC: typeof import("react-native-health-connect"),
  start: Date,
  _end: Date
): Promise<number | null> {
  try {
    // Look at last 24h for sleep data
    const twentyFourHoursAgo = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    const result = await HC.readRecords("SleepSession", {
      timeRangeFilter: {
        operator: "between",
        startTime: twentyFourHoursAgo.toISOString(),
        endTime: start.toISOString(),
      },
    });
    const records = result.records ?? result ?? [];
    if (!Array.isArray(records) || records.length === 0) return null;

    let totalMs = 0;
    for (const session of records) {
      const sStart = new Date(session.startTime).getTime();
      const sEnd = new Date(session.endTime).getTime();
      totalMs += sEnd - sStart;
    }
    return totalMs > 0 ? Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10 : null;
  } catch {
    return null;
  }
}

// ─── Sync to Supabase ────────────────────────────────────────────────────────

/**
 * Sync weight from health data to body_metrics if it has changed.
 * Only inserts a new row if weight differs from the last recorded value.
 */
export async function syncWeightToSupabase(
  userId: string,
  weightKg: number
): Promise<boolean> {
  try {
    // Check last recorded weight to avoid duplicate entries
    const { data: latest, error: fetchErr } = await supabase
      .from("body_metrics")
      .select("id, body_weight_kg")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.error("[HealthSync] Error fetching latest metric:", fetchErr);
      return false;
    }

    // Only sync if weight actually changed (0.1 kg tolerance)
    if (latest?.body_weight_kg != null) {
      const diff = Math.abs(latest.body_weight_kg - weightKg);
      if (diff < 0.1) return false; // No meaningful change
    }

    const { error: insertErr } = await supabase.from("body_metrics").insert({
      user_id: userId,
      recorded_at: new Date().toISOString(),
      body_weight_kg: weightKg,
      notes: Platform.OS === "ios" ? "Sincronizado desde Apple Salud" : "Sincronizado desde Health Connect",
    });

    if (insertErr) {
      console.error("[HealthSync] Error saving weight:", insertErr);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[HealthSync] Error syncing weight:", err);
    return false;
  }
}

// ─── Cache helpers ───────────────────────────────────────────────────────────

async function getCachedHealthData(): Promise<HealthData | null> {
  try {
    const [lastSyncStr, cachedStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_LAST_SYNC),
      AsyncStorage.getItem(STORAGE_KEY_CACHED_DATA),
    ]);

    if (!lastSyncStr || !cachedStr) return null;

    const lastSync = new Date(lastSyncStr).getTime();
    const now = Date.now();

    if (now - lastSync < MIN_SYNC_INTERVAL_MS) {
      return JSON.parse(cachedStr) as HealthData;
    }

    return null; // Cache expired
  } catch {
    return null;
  }
}

async function cacheHealthData(data: HealthData): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString()),
      AsyncStorage.setItem(STORAGE_KEY_CACHED_DATA, JSON.stringify(data)),
    ]);
  } catch {
    // Non-blocking
  }
}
