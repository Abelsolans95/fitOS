import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, radius, shadows, fonts } from "../theme";

interface MoreItem {
  label: string;
  subtitle: string;
  tab: string; // Tab name in AppNavigator
  color: string;
  icon: React.ReactNode;
}

const ITEMS: MoreItem[] = [
  {
    label: "Progreso",
    subtitle: "Evolución de peso, medidas y fuerza",
    tab: "Progreso",
    color: colors.green,
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941"
          stroke={colors.green}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    label: "Salud",
    subtitle: "Apple Health / Google Health Connect",
    tab: "Salud",
    color: colors.red,
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          stroke={colors.red}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    label: "Citas",
    subtitle: "Calendario con tu entrenador",
    tab: "Citas",
    color: colors.violet,
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          stroke={colors.violet}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    label: "Consultas",
    subtitle: "Resuelve dudas con tu entrenador",
    tab: "Consultas",
    color: colors.orange,
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          stroke={colors.orange}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    label: "Conocimiento",
    subtitle: "Artículos y guías de tu entrenador",
    tab: "Conocimiento",
    color: colors.cyan,
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          stroke={colors.cyan}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    label: "Ligas",
    subtitle: "Compite con otros clientes",
    tab: "Ligas",
    color: colors.violet,
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516"
          stroke={colors.violet}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    label: "Comidas",
    subtitle: "Plan de nutrición semanal",
    tab: "Comidas",
    color: colors.green,
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513"
          stroke={colors.green}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    label: "Inicio",
    subtitle: "Vista general rápida",
    tab: "Inicio",
    color: colors.cyan,
    icon: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15"
          stroke={colors.cyan}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
];

export default function MoreScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Más</Text>
        <Text style={styles.subtitle}>Todas las secciones disponibles</Text>
      </View>

      <View style={styles.grid}>
        {ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => {
              // The parent Tab.Navigator owns these screens as regular tabs.
              const nav = navigation as unknown as { navigate: (name: string) => void };
              nav.navigate(item.tab);
            }}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: `${item.color}22` },
              ]}
            >
              {item.icon}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
                stroke={colors.muted}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 120 },
  header: {
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.extraBold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.dimmed,
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  grid: { gap: spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
    padding: spacing.lg,
    ...shadows.subtle,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    fontFamily: fonts.regular,
  },
});
