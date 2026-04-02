import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import Svg from "react-native-svg";
import { SvgCircle } from "./icons";
import { colors } from "../../theme";
import { formatTime } from "./constants";
import { st } from "./styles";

interface Props {
  restTime: number;
  restTotal: number;
  currentExName: string | undefined;
  nextExName: string | undefined;
  exerciseNote: string;
  onNoteChange: (val: string) => void;
  onSkip: () => void;
}

export function RestTimer({ restTime, restTotal, currentExName, nextExName, exerciseNote, onNoteChange, onSkip }: Props) {
  const progress = restTotal > 0 ? restTime / restTotal : 0;
  const circ = 2 * Math.PI * 100;
  const offset = circ * (1 - progress);

  return (
    <View style={st.timerContainer}>
      <Text style={st.timerLabel}>DESCANSO</Text>

      <View style={st.timerRing}>
        <Svg width={240} height={240} style={{ transform: [{ rotate: "-90deg" }] }}>
          <SvgCircle cx={120} cy={120} r={100} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={5} />
          <SvgCircle
            cx={120} cy={120} r={100} fill="none"
            stroke={colors.cyan} strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            strokeDashoffset={offset}
          />
        </Svg>
        <View style={st.timerCenter}>
          <Text style={st.timerValue}>{formatTime(restTime)}</Text>
          <Text style={st.timerExName}>{currentExName}</Text>
        </View>
      </View>

      <TextInput
        style={st.restNotesInput}
        placeholder="Notas sobre este ejercicio... (opcional)"
        placeholderTextColor="rgba(90,90,114,0.4)"
        value={exerciseNote}
        onChangeText={onNoteChange}
        multiline
      />

      <TouchableOpacity style={st.skipBtn} activeOpacity={0.7} onPress={onSkip}>
        <Text style={st.skipText}>Saltar descanso</Text>
      </TouchableOpacity>

      {nextExName && (
        <View style={st.nextPreview}>
          <Text style={st.nextLabel}>SIGUIENTE</Text>
          <Text style={st.nextName}>{nextExName}</Text>
        </View>
      )}
    </View>
  );
}
