import React, { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure how notifications are handled when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import * as Sentry from "@sentry/react-native";

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { NotificationProvider } from "./src/contexts/NotificationContext";
import { OfflineProvider } from "./src/contexts/OfflineContext";
import { colors } from "./src/theme";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import MyDayScreen from "./src/screens/MyDayScreen";
import MoreScreen from "./src/screens/MoreScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import CaloriesScreen from "./src/screens/CaloriesScreen";
import RoutineScreen from "./src/screens/RoutineScreen";
import MealsScreen from "./src/screens/MealsScreen";
import ProgressScreen from "./src/screens/ProgressScreen";
import ChatScreen from "./src/screens/ChatScreen";
import AppointmentsScreen from "./src/screens/AppointmentsScreen";
import HealthScreen from "./src/screens/HealthScreen";
import TicketsScreen from "./src/screens/TicketsScreen";
import KnowledgeScreen from "./src/screens/KnowledgeScreen";
import LeaguesScreen from "./src/screens/LeaguesScreen";

Sentry.init({
  dsn: "https://c8918d35c078388eb3680a7ac3fdbe2a@o4511044389240832.ingest.de.sentry.io/4511047824506960",
  sendDefaultPii: false, // Disabled for GDPR compliance — no PII sent to Sentry
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

const Tab = createBottomTabNavigator();

// SVG Icon components for tab bar
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const color = focused ? colors.cyan : colors.dimmed;
  const size = 22;

  const icons: Record<string, React.ReactNode> = {
    "Mi día": (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    Más: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    Inicio: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    Calorías: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    Rutina: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3.75 13.5L14.25 2.25 12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    Comidas: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    Progreso: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    Chat: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    Salud: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    Conocimiento: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    Consultas: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    Citas: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
    Ligas: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-3.52 1.122 6.023 6.023 0 01-3.52-1.122"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  };

  return (
    <View style={tabStyles.iconContainer}>
      {icons[name] || <Text>●</Text>}
      {focused && <View style={tabStyles.activeIndicator} />}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 32,
  },
  activeIndicator: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.cyan,
    marginTop: 4,
  },
});

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.logo}>
          Kuv<Text style={{ color: colors.cyan }}>ox</Text>
        </Text>
        <View style={styles.loadingBar}>
          <View style={styles.loadingBarFill} />
        </View>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Show onboarding if not completed
  if (!user.user_metadata?.onboarding_completed) {
    return <OnboardingScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.dimmed,
        tabBarStyle: {
          backgroundColor: colors.sidebar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: 10,
          height: 72,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "PlusJakartaSans_600SemiBold",
          letterSpacing: 0.3,
          marginTop: -2,
        },
      })}
    >
      {/* Primary 5 tabs — visible in bottom bar. */}
      <Tab.Screen name="Mi día" component={MyDayScreen} />
      <Tab.Screen name="Rutina" component={RoutineScreen} />
      <Tab.Screen name="Calorías" component={CaloriesScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Más" component={MoreScreen} />
      {/* Secondary screens — hidden from the bar, reachable only via "Más". */}
      <Tab.Screen
        name="Inicio"
        component={DashboardScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
      />
      <Tab.Screen
        name="Comidas"
        component={MealsScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
      />
      <Tab.Screen
        name="Progreso"
        component={ProgressScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
      />
      <Tab.Screen
        name="Salud"
        component={HealthScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
      />
      <Tab.Screen
        name="Conocimiento"
        component={KnowledgeScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
      />
      <Tab.Screen
        name="Ligas"
        component={LeaguesScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
      />
      <Tab.Screen
        name="Consultas"
        component={TicketsScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
      />
      <Tab.Screen
        name="Citas"
        component={AppointmentsScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: "none" } }}
      />
    </Tab.Navigator>
  );
}

export default Sentry.wrap(function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <NotificationProvider>
          <OfflineProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </OfflineProvider>
        </NotificationProvider>
      </NavigationContainer>
    </AuthProvider>
  );
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: 52,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    color: colors.white,
    letterSpacing: -2,
  },
  loadingBar: {
    width: 120,
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 24,
    overflow: "hidden",
  },
  loadingBarFill: {
    width: "40%",
    height: "100%",
    backgroundColor: colors.cyan,
    borderRadius: 2,
  },
});
