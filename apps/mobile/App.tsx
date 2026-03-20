import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import * as Sentry from "@sentry/react-native";

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { colors } from "./src/theme";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import CaloriesScreen from "./src/screens/CaloriesScreen";
import RoutineScreen from "./src/screens/RoutineScreen";
import MealsScreen from "./src/screens/MealsScreen";
import ProgressScreen from "./src/screens/ProgressScreen";

Sentry.init({
  dsn: "https://c8918d35c078388eb3680a7ac3fdbe2a@o4511044389240832.ingest.de.sentry.io/4511047824506960",
  sendDefaultPii: true,
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
          Fit<Text style={{ color: colors.cyan }}>OS</Text>
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
          fontWeight: "600" as const,
          letterSpacing: 0.3,
          marginTop: -2,
        },
      })}
    >
      <Tab.Screen name="Inicio" component={DashboardScreen} />
      <Tab.Screen name="Calorías" component={CaloriesScreen} />
      <Tab.Screen name="Rutina" component={RoutineScreen} />
      <Tab.Screen name="Comidas" component={MealsScreen} />
      <Tab.Screen name="Progreso" component={ProgressScreen} />
    </Tab.Navigator>
  );
}

export default Sentry.wrap(function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
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
    fontWeight: "900",
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
