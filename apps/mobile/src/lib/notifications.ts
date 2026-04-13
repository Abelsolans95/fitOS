import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushNotificationData {
  screen?: string;
  params?: Record<string, string>;
}

export interface LocalNotificationRequest {
  title: string;
  body: string;
  data?: PushNotificationData;
  /** Seconds from now (default: 1) */
  delaySeconds?: number;
}

// ─── Register for push notifications ─────────────────────────────────────────

/**
 * Requests push notification permissions and returns the Expo push token.
 * Returns null if permissions are denied or the device is a simulator.
 * Never throws — all errors are caught and logged.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      console.warn("[Notifications] Push notifications require a physical device");
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request if not already granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("[Notifications] Permission not granted");
      return null;
    }

    // Android requires a notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Kuvox",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#00E5FF",
      });
    }

    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn("[Notifications] No projectId found — push token cannot be obtained");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (error) {
    console.error("[Notifications] Registration failed:", error);
    return null;
  }
}

// ─── Save token to Supabase ──────────────────────────────────────────────────

/**
 * Persists the Expo push token to the user's profile.
 * Uses upsert to handle both new and existing profiles.
 */
export async function savePushTokenToProfile(
  userId: string,
  token: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ expo_push_token: token })
      .eq("user_id", userId);

    if (error) {
      console.error("[Notifications] Failed to save push token:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Notifications] Unexpected error saving push token:", error);
    return false;
  }
}

/**
 * Clears the push token from the user's profile (e.g., on sign out).
 */
export async function clearPushTokenFromProfile(
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ expo_push_token: null })
      .eq("user_id", userId);

    if (error) {
      console.error("[Notifications] Failed to clear push token:", error);
    }
  } catch {
    // Non-blocking — don't crash on cleanup
  }
}

// ─── Local notifications ─────────────────────────────────────────────────────

/**
 * Schedules a local push notification.
 * Useful for reminders (workout, meals, appointments).
 */
export async function schedulePushNotification(
  request: LocalNotificationRequest
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: request.title,
        body: request.body,
        data: (request.data ?? {}) as Record<string, unknown>,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: request.delaySeconds ?? 1,
      },
    });
    return id;
  } catch (error) {
    console.error("[Notifications] Failed to schedule notification:", error);
    return null;
  }
}

/**
 * Cancels all scheduled local notifications.
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Non-blocking
  }
}
