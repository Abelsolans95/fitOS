import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from "react-native";
import { colors, fonts } from "../../theme";
import type { FormField } from "./types";

interface DynamicFieldProps {
  field: FormField;
  value: string | number | boolean | string[] | undefined;
  onChange: (val: string | number | boolean | string[]) => void;
}

export function DynamicField({ field, value, onChange }: DynamicFieldProps) {
  switch (field.type) {
    case "text":
      return (
        <TextInput
          style={styles.input}
          placeholder={field.placeholder || ""}
          placeholderTextColor={colors.muted + "80"}
          value={(value as string) ?? ""}
          onChangeText={(t) => onChange(t)}
        />
      );

    case "textarea":
      return (
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          placeholder={field.placeholder || ""}
          placeholderTextColor={colors.muted + "80"}
          value={(value as string) ?? ""}
          onChangeText={(t) => onChange(t)}
          multiline
        />
      );

    case "number":
      return (
        <TextInput
          style={styles.input}
          placeholder={field.placeholder || ""}
          placeholderTextColor={colors.muted + "80"}
          value={value !== undefined && value !== "" ? String(value) : ""}
          onChangeText={(t) => onChange(t === "" ? "" : Number(t))}
          keyboardType="decimal-pad"
        />
      );

    case "date":
      return (
        <TextInput
          style={styles.input}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={colors.muted + "80"}
          value={(value as string) ?? ""}
          onChangeText={(t) => onChange(t)}
        />
      );

    case "select":
      return (
        <View style={styles.optionsGrid}>
          {(field.options ?? []).map((option) => {
            const isSelected = value === option;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => onChange(option)}
                style={[styles.optionButton, isSelected && styles.optionButtonActive]}
                activeOpacity={0.7}
              >
                <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );

    case "multiselect": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <View style={styles.pillsWrap}>
          {(field.options ?? []).map((option) => {
            const isSelected = selected.includes(option);
            return (
              <TouchableOpacity
                key={option}
                onPress={() =>
                  onChange(
                    isSelected ? selected.filter((s) => s !== option) : [...selected, option]
                  )
                }
                style={[styles.pill, isSelected && styles.pillActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    case "boolean":
      return (
        <View style={styles.switchRow}>
          <Switch
            value={!!value}
            onValueChange={(val) => onChange(val)}
            trackColor={{ false: colors.border, true: colors.cyan + "60" }}
            thumbColor={value ? colors.cyan : colors.muted}
          />
          <Text style={styles.switchLabel}>{value ? "Si" : "No"}</Text>
        </View>
      );

    case "scale":
      return (
        <View style={styles.scaleRow}>
          {Array.from({ length: 10 }, (_, i) => {
            const n = i + 1;
            const isSelected = value === n;
            return (
              <TouchableOpacity
                key={n}
                onPress={() => onChange(n)}
                style={[styles.scaleButton, isSelected && styles.scaleButtonActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.scaleText, isSelected && styles.scaleTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.white,
  },

  // Options (select)
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionButton: {
    flexBasis: "47%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionButtonActive: { borderColor: colors.cyan, backgroundColor: colors.cyan + "15" },
  optionText: { fontSize: 14, color: colors.muted },
  optionTextActive: { color: colors.cyan },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.border, justifyContent: "center", alignItems: "center" },
  radioOuterActive: { borderColor: colors.cyan, backgroundColor: colors.cyan },
  radioInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.bg },

  // Pills (multiselect)
  pillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  pillActive: { borderColor: colors.violet, backgroundColor: colors.violet + "20" },
  pillText: { fontSize: 13, color: colors.muted },
  pillTextActive: { color: colors.violet },

  // Switch
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  switchLabel: { fontSize: 14, color: colors.muted },

  // Scale
  scaleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  scaleButton: {
    width: 36, height: 36, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
    justifyContent: "center", alignItems: "center",
  },
  scaleButtonActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  scaleText: { fontSize: 14, fontFamily: fonts.medium, color: colors.muted },
  scaleTextActive: { color: colors.bg },
});
