import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "./styles";

type Score = 1 | 2 | 3 | 4 | 5 | null;

interface WellnessSlidersProps {
  sleepQuality: Score;
  stressLevel: Score;
  energyLevel: Score;
  painLevel: Score;
  onChange: (field: string, value: Score) => void;
}

interface SliderProps {
  label: string;
  lowHint: string;
  highHint: string;
  value: Score;
  onChange: (value: Score) => void;
}

const Slider = React.memo(function Slider({
  label,
  lowHint,
  highHint,
  value,
  onChange,
}: SliderProps) {
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderLabel}>
        <Text style={styles.sliderLabelText}>{label}</Text>
        <Text style={styles.sliderValue}>
          {value !== null ? `${value}/5` : "—"}
        </Text>
      </View>
      <View style={styles.sliderButtons}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <TouchableOpacity
              key={n}
              onPress={() => onChange((value === n ? null : n) as Score)}
              style={[styles.sliderBtn, active && styles.sliderBtnActive]}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.sliderBtnText, active && styles.sliderBtnTextActive]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
        <Text style={{ fontSize: 9, color: "#6B6B7D" }}>{lowHint}</Text>
        <Text style={{ fontSize: 9, color: "#6B6B7D" }}>{highHint}</Text>
      </View>
    </View>
  );
});

export const WellnessSliders = React.memo(function WellnessSliders({
  sleepQuality,
  stressLevel,
  energyLevel,
  painLevel,
  onChange,
}: WellnessSlidersProps) {
  return (
    <>
      <Slider
        label="Sueño"
        lowHint="Pésimo"
        highHint="Excelente"
        value={sleepQuality}
        onChange={(v) => onChange("sleepQuality", v)}
      />
      <Slider
        label="Energía"
        lowHint="Agotado"
        highHint="Al 100%"
        value={energyLevel}
        onChange={(v) => onChange("energyLevel", v)}
      />
      <Slider
        label="Estrés"
        lowHint="Relajado"
        highHint="Al límite"
        value={stressLevel}
        onChange={(v) => onChange("stressLevel", v)}
      />
      <Slider
        label="Dolor"
        lowHint="Ninguno"
        highHint="Intenso"
        value={painLevel}
        onChange={(v) => onChange("painLevel", v)}
      />
    </>
  );
});
