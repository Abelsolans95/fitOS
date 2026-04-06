import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "./AuthContext";
import {
  registerForPushNotificationsAsync,
  savePushTokenToProfile,
  schedulePushNotification,
  type PushNotificationData,
  type LocalNotificationRequest,
} from "../lib/notifications";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationContextValue {
  /** The Expo push token (null if not registered or denied) */
  expoPushToken: string | null;
  /** The last received foreground notification */
  notification: Notifications.Notification | null;
  /** Schedule a local notification */
  sendLocalNotification: (request: LocalNotificationRequest) => Promise<string | null>;
}

// ─── Screen mapping ──────────────────────────────────────────────────────────

/**
 * Maps notification data.screen values to tab navigator screen names.
 * This allows the backend to send a screen identifier that maps to
 * the correct tab in the bottom navigator.
 */
const SCREEN_MAP: Record<string, string> = {
  dashboard: "Inicio",
  calories: "Calorías",
  routine: "Rutina",
  meals: "Comidas",
  progress: "Progreso",
  health: "Salud",
  knowledge: "Conocimiento",
  tickets: "Consultas",
  chat: "Chat",
  appointments: "Citas",
};

// ─── Context ─────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue>({
  expoPushToken: null,
  notification: null,
  sendLocalNotification: async () => null,
});

// ─── Provider ────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null);
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);

  // ── Register & save token when user is authenticated ───────────────────────
  useEffect(() => {
    if (!user) {
      setExpoPushToken(null);
      return;
    }

    let cancelled = false;

    const register = async () => {
      const token = await registerForPushNotificationsAsync();
      if (cancelled) return;

      if (token) {
        setExpoPushToken(token);
        await savePushTokenToProfile(user.id, token);
      }
    };

    register();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // ── Notification listeners ─────────────────────────────────────────────────
  useEffect(() => {
    // Foreground notification received
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (incoming) => {
        setNotification(incoming);
      }
    );

    // User tapped on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | PushNotificationData
          | undefined;

        if (data?.screen) {
          const screenName = SCREEN_MAP[data.screen] ?? null;
          if (screenName) {
            try {
              navigation.navigate(screenName, data.params ?? {});
            } catch (error) {
              console.error("[NotificationContext] Navigation failed:", error);
            }
          }
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [navigation]);

  // ── Local notification helper ──────────────────────────────────────────────
  const sendLocalNotification = async (
    request: LocalNotificationRequest
  ): Promise<string | null> => {
    return schedulePushNotification(request);
  };

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, sendLocalNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
