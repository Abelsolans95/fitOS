import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { TICKET_CATEGORIES } from "@fitos/shared";
import { colors, spacing, radius, fonts } from "../../theme";
import { CATEGORY_COLORS } from "./types";
import type { TicketCategory } from "./types";

interface CreateTicketProps {
  onBack: () => void;
  onSubmit: (category: TicketCategory, subject: string, description: string) => Promise<void>;
}

export default function CreateTicket({ onBack, onSubmit }: CreateTicketProps) {
  const [formCategory, setFormCategory] = useState<TicketCategory>("general");
  const [formSubject, setFormSubject] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = formSubject.trim().length > 0 && formDescription.trim().length > 0;

  const handleCreate = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit(formCategory, formSubject.trim(), formDescription.trim());
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, onSubmit, formCategory, formSubject, formDescription]);

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Nueva consulta</Text>
      </View>

      <ScrollView style={s.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Category */}
        <Text style={s.label}>CATEGORÍA</Text>
        <View style={s.categoryGrid}>
          {TICKET_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[
                s.categoryCard,
                formCategory === c.value && {
                  borderColor: CATEGORY_COLORS[c.value],
                  backgroundColor: `${CATEGORY_COLORS[c.value]}15`,
                },
              ]}
              onPress={() => setFormCategory(c.value)}
            >
              <Text
                style={[
                  s.categoryLabel,
                  formCategory === c.value && { color: CATEGORY_COLORS[c.value] },
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subject */}
        <Text style={s.label}>ASUNTO</Text>
        <TextInput
          style={s.input}
          value={formSubject}
          onChangeText={setFormSubject}
          placeholder="¿Sobre qué es tu consulta?"
          placeholderTextColor={colors.dimmed}
          maxLength={200}
        />

        {/* Description */}
        <Text style={s.label}>DESCRIPCIÓN</Text>
        <TextInput
          style={[s.input, { height: 140, textAlignVertical: "top" }]}
          value={formDescription}
          onChangeText={setFormDescription}
          placeholder="Describe tu duda o problema..."
          placeholderTextColor={colors.dimmed}
          multiline
        />

        {/* Submit */}
        <TouchableOpacity
          style={[s.primaryBtn, !canSubmit && { opacity: 0.4 }]}
          onPress={handleCreate}
          disabled={submitting || !canSubmit}
        >
          <Text style={s.primaryBtnText}>
            {submitting ? "Enviando..." : "Enviar consulta al coach"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 20, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  backBtn: { marginRight: 12 },
  backText: { color: colors.cyan, fontSize: 14, fontFamily: fonts.semibold },
  title: { color: "#fff", fontSize: 20, fontFamily: fonts.extrabold, letterSpacing: -0.5 },
  content: { flex: 1, padding: spacing.md },
  label: {
    color: colors.dimmed, fontSize: 10, fontFamily: fonts.bold,
    letterSpacing: 2, marginTop: spacing.md, marginBottom: spacing.sm,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryCard: {
    flex: 1, minWidth: "45%", borderRadius: radius.lg, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)", backgroundColor: colors.card,
    paddingVertical: spacing.md, alignItems: "center",
  },
  categoryLabel: { color: colors.muted, fontSize: 14, fontFamily: fonts.semibold },
  input: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14,
    fontFamily: fonts.regular, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
  },
  primaryBtn: {
    backgroundColor: colors.cyan, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.lg,
  },
  primaryBtnText: { color: "#0A0A0F", fontSize: 14, fontFamily: fonts.bold },
});
