import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { colors, spacing } from "../../theme";
import { st } from "./styles";

interface Props {
  rpeGlobal: number;
  onRpeChange: (val: number) => void;
  onFinish: () => void;
}

export function RpeScreen({ rpeGlobal, onRpeChange, onFinish }: Props) {
  const rpeColor = rpeGlobal <= 4 ? colors.green : rpeGlobal <= 7 ? colors.orange : colors.red;

  return (
    <View style={st.rpeContainer}>
      <Text style={st.rpeLabel}>ESFUERZO PERCIBIDO</Text>
      <Text style={st.rpeQuestion}>¿Cómo fue la sesión?</Text>
      <Text style={[st.rpeValue, { color: rpeColor }]}>{rpeGlobal}</Text>

      <View style={st.rpeSliderRow}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
          const c = val <= 4 ? colors.green : val <= 7 ? colors.orange : colors.red;
          return (
            <TouchableOpacity
              key={val}
              onPress={() => onRpeChange(val)}
              style={[st.rpeDot, val === rpeGlobal && { backgroundColor: c, borderColor: c }]}
              activeOpacity={0.7}
            >
              <Text style={[st.rpeDotText, val === rpeGlobal && { color: colors.bg }]}>{val}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={st.rpeHints}>
        <Text style={st.rpeHintText}>Fácil</Text>
        <Text style={st.rpeHintText}>Máximo</Text>
      </View>

      <TouchableOpacity style={[st.primaryBtn, { marginTop: spacing.xxl }]} activeOpacity={0.8} onPress={onFinish}>
        <Text style={st.primaryBtnText}>Finalizar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
