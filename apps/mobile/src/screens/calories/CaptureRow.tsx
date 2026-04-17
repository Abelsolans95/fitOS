import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { colors } from "../../theme";
import { styles } from "./styles";

interface CaptureRowProps {
  analyzing: boolean;
  onTakePhoto: () => void;
  onPickImage: () => void;
}

export const CaptureRow = React.memo(function CaptureRow({
  analyzing,
  onTakePhoto,
  onPickImage,
}: CaptureRowProps) {
  return (
    <View style={styles.captureRow}>
      <TouchableOpacity
        style={styles.captureMain}
        onPress={onTakePhoto}
        disabled={analyzing}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#00E5FF", "#00B8D4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.captureGradient}
        >
          {analyzing ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                  stroke={colors.bg}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.captureMainText}>Escanear</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.captureSecondary}
        onPress={onPickImage}
        disabled={analyzing}
        activeOpacity={0.8}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            stroke={colors.white}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={styles.captureSecondaryText}>Galeria</Text>
      </TouchableOpacity>
    </View>
  );
});
