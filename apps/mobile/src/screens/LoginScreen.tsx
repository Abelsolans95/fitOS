import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius, shadows } from "../theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos"
          : authError.message
      );
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Background gradient accent */}
      <LinearGradient
        colors={["rgba(0, 229, 255, 0.06)", "transparent", "rgba(124, 58, 237, 0.04)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.inner}>
        {/* Brand mark */}
        <View style={styles.brandContainer}>
          <Text style={styles.logo}>
            Fit<Text style={styles.logoAccent}>OS</Text>
          </Text>
          <View style={styles.brandLine} />
          <Text style={styles.tagline}>ENTRENAMIENTO INTELIGENTE</Text>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Inicia sesión</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor={colors.dimmed}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CONTRASEÑA</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.dimmed}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <View style={styles.errorIndicator} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#00E5FF", "#00B8D4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.buttonText}>Acceder</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.version}>v1.0 — FitOS</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xxxl,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    fontSize: 56,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: -3,
  },
  logoAccent: {
    color: colors.cyan,
  },
  brandLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.cyan,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 1,
  },
  tagline: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.dimmed,
    letterSpacing: 4,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    gap: spacing.lg,
    ...shadows.card,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
    marginBottom: spacing.xs,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.dimmed,
    letterSpacing: 2,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    overflow: "hidden",
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 15,
    fontSize: 15,
    color: colors.white,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.redDim,
    borderWidth: 1,
    borderColor: "rgba(255, 23, 68, 0.2)",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorIndicator: {
    width: 3,
    height: 20,
    borderRadius: 2,
    backgroundColor: colors.red,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.red,
    lineHeight: 18,
  },
  button: {
    borderRadius: radius.md,
    overflow: "hidden",
    marginTop: spacing.sm,
    ...shadows.glow(colors.cyan),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.bg,
    letterSpacing: 0.5,
  },
  version: {
    textAlign: "center",
    fontSize: 11,
    color: colors.dimmed,
    marginTop: 32,
    letterSpacing: 1,
  },
});
