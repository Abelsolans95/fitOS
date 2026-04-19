import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, fonts } from "../../theme";
import { Message, getInitials, formatTime } from "./types";

interface MessageBubbleProps {
  message: Message;
  isClient: boolean;
  trainerName: string | null;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isClient,
  trainerName,
}: MessageBubbleProps) {
  return (
    <View
      style={[
        styles.msgRow,
        isClient ? styles.msgRowRight : styles.msgRowLeft,
      ]}
    >
      {!isClient && (
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarSmallText}>
            {getInitials(trainerName)}
          </Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isClient ? styles.bubbleClient : styles.bubbleTrainer,
        ]}
      >
        <Text style={styles.bubbleText}>{message.content}</Text>
        <View
          style={[
            styles.bubbleMeta,
            isClient
              ? { justifyContent: "flex-end" }
              : { justifyContent: "flex-start" },
          ]}
        >
          <Text style={styles.bubbleTime}>
            {formatTime(message.created_at)}
          </Text>
          {isClient && (
            <Svg
              width={12}
              height={12}
              viewBox="0 0 24 24"
              style={{ marginLeft: 3 }}
            >
              <Path
                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                fill={message.read_at ? colors.violet : colors.dimmed}
              />
            </Svg>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  msgRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-end",
  },
  msgRowLeft: {
    justifyContent: "flex-start",
  },
  msgRowRight: {
    justifyContent: "flex-end",
  },
  avatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,229,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    marginBottom: 2,
  },
  avatarSmallText: {
    color: colors.cyan,
    fontSize: 9,
    fontFamily: fonts.bold,
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleTrainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
    borderBottomLeftRadius: 4,
  },
  bubbleClient: {
    backgroundColor: "rgba(124,58,237,0.15)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.25)",
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  bubbleTime: {
    color: colors.dimmed,
    fontSize: 10,
  },
});
