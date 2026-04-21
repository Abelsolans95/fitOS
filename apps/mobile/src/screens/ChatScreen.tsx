import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, radius, fonts } from "../theme";
import { useChat } from "./chat/useChat";
import { MessageBubble } from "./chat/MessageBubble";
import { ChatInput } from "./chat/ChatInput";
import { ListItem, getInitials } from "./chat/types";

export default function ChatScreen() {
  const { user } = useAuth();
  const {
    trainer,
    input,
    setInput,
    sending,
    loading,
    error,
    listItems,
    flatListRef,
    scrollToBottom,
    handleSend,
  } = useChat({ userId: user?.id });

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === "separator") {
        return (
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>{item.label}</Text>
            <View style={styles.separatorLine} />
          </View>
        );
      }

      return (
        <MessageBubble
          message={item.data}
          isClient={item.data.sender_id === user?.id}
          trainerName={trainer?.full_name ?? null}
        />
      );
    },
    [user?.id, trainer?.full_name]
  );

  const keyExtractor = useCallback(
    (item: ListItem, index: number) =>
      item.type === "separator"
        ? `sep-${item.day}`
        : item.data.id ?? String(index),
    []
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {getInitials(trainer?.full_name ?? null)}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {trainer?.full_name ?? "Tu entrenador"}
          </Text>
          <Text style={styles.headerSub}>Conversacion privada</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={listItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          maxToRenderPerBatch={15}
          windowSize={10}
          removeClippedSubviews={Platform.OS === "android"}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                    stroke={colors.muted}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.emptyTitle}>Sin mensajes aun</Text>
              <Text style={styles.emptySubtitle}>
                Empieza la conversacion con tu entrenador
              </Text>
            </View>
          }
          onContentSizeChange={scrollToBottom}
        />

        {/* Input */}
        <ChatInput
          value={input}
          onChangeText={setInput}
          onSend={handleSend}
          sending={sending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  errorBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,23,68,0.2)",
    backgroundColor: "rgba(255,23,68,0.05)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorText: {
    color: colors.red,
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.10)",
    backgroundColor: colors.sidebar,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,229,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  headerAvatarText: {
    color: colors.cyan,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  headerSub: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 1,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },

  // Messages list
  listContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexGrow: 1,
  },

  // Day separator
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },
  separatorText: {
    color: colors.dimmed,
    fontSize: 11,
    textTransform: "capitalize",
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
