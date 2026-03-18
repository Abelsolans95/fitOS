import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
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

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Inicio: "🏠",
    Calorías: "📸",
    Rutina: "💪",
    Comidas: "🍽️",
    Progreso: "📈",
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
        {icons[name] || "●"}
      </Text>
      {focused && (
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.cyan,
            marginTop: 2,
          }}
        />
      )}
    </View>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.logo}>
          Fit<Text style={{ color: colors.cyan }}>OS</Text>
        </Text>
        <ActivityIndicator size="large" color={colors.cyan} style={{ marginTop: 24 }} />
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
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.sidebar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: -4,
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
    fontSize: 48,
    fontWeight: "800",
    color: colors.white,
  },
});
