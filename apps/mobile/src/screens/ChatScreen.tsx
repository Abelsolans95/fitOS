import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing, radius } from "../theme";

interface Message {
  id: string;
  trainer_id: string;
  client_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface TrainerInfo {
  user_id: string;
  full_name: string | null;
}

function getInitials(name: string | null): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [trainer, setTrainer] = useState<TrainerInfo | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      // Find trainer
      const { data: rel, error: relErr } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .single();

      if (relErr || !rel) {
        setError("No tienes un entrenador asignado.");
        setLoading(false);
        return;
      }

      const tid = rel.trainer_id as string;
      setTrainerId(tid);

      // Get trainer profile
      const { data: tp } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("user_id", tid)
        .single();
      setTrainer(tp as TrainerInfo | null);

      // Load messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("trainer_id", tid)
        .eq("client_id", user.id)
        .order("created_at", { ascending: true })
        .limit(100);
      setMessages((msgs as Message[]) ?? []);
      setLoading(false);

      // Mark trainer messages as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("trainer_id", tid)
        .eq("client_id", user.id)
        .eq("sender_id", tid)
        .is("read_at", null);

      // Realtime subscription
      const channel = supabase
        .channel(`chat:${tid}:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `client_id=eq.${user.id}`,
          },
          (payload) => {
            const msg = payload.new as Message;
            setMessages((prev) => {
              if (prev.find((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            if (msg.sender_id === tid) {
              supabase
                .from("messages")
                .update({ read_at: new Date().toISOString() })
                .eq("id", msg.id)
                .then(() => {});
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    const cleanup = init();
    return () => { cleanup.then((fn) => fn?.()).catch(() => {}); };
  }, [user]);

  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !trainerId || !user) return;
    setSending(true);
    setInput("");
    await supabase.from("messages").insert({
      trainer_id: trainerId,
      client_id: user.id,
      sender_id: user.id,
      content: text,
    });
    setSending(false);
  };

  // Group messages by day for separators
  type ListItem =
    | { type: "separator"; day: string; label: string }
    | { type: "message"; data: Message };

  const listItems: ListItem[] = [];
  let lastDay = "";
  for (const msg of messages) {
    const day = new Date(msg.created_at).toDateString();
    if (day !== lastDay) {
      listItems.push({ type: "separator", day, label: formatDay(msg.created_at) });
      lastDay = day;
    }
    listItems.push({ type: "message", data: msg });
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "separator") {
      return (
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>{item.label}</Text>
          <View style={styles.separatorLine} />
        </View>
      );
    }

    const msg = item.data;
    const isClient = msg.sender_id === user?.id;
    return (
      <View style={[styles.msgRow, isClient ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isClient && (
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{getInitials(trainer?.full_name ?? null)}</Text>
          </View>
        )}
        <View style={[styles.bubble, isClient ? styles.bubbleClient : styles.bubbleTrainer]}>
          <Text style={styles.bubbleText}>{msg.content}</Text>
          <View style={[styles.bubbleMeta, isClient ? { justifyContent: "flex-end" } : { justifyContent: "flex-start" }]}>
            <Text style={styles.bubbleTime}>{formatTime(msg.created_at)}</Text>
            {isClient && (
              <Svg width={12} height={12} viewBox="0 0 24 24" style={{ marginLeft: 3 }}>
                <Path
                  d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                  fill={msg.read_at ? colors.violet : colors.dimmed}
                />
              </Svg>
            )}
          </View>
        </View>
      </View>
    );
  };

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
          <Text style={styles.headerAvatarText}>{getInitials(trainer?.full_name ?? null)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{trainer?.full_name ?? "Tu entrenador"}</Text>
          <Text style={styles.headerSub}>Conversación privada</Text>
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
          keyExtractor={(item, index) =>
            item.type === "separator" ? `sep-${item.day}` : item.data.id ?? String(index)
          }
          renderItem={renderItem}
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
              <Text style={styles.emptyTitle}>Sin mensajes aún</Text>
              <Text style={styles.emptySubtitle}>Empieza la conversación con tu entrenador</Text>
            </View>
          }
          onContentSizeChange={scrollToBottom}
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe un mensaje…"
            placeholderTextColor={colors.dimmed}
            multiline
            maxLength={2000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            activeOpacity={0.7}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12zm0 0h7.5"
                stroke={colors.bg}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
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
    color: colors.error,
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
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
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
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
    backgroundColor: colors.success,
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
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  separatorText: {
    color: colors.dimmed,
    fontSize: 11,
    textTransform: "capitalize",
  },

  // Message bubble
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
    fontWeight: "700",
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
    borderColor: "rgba(255,255,255,0.06)",
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
    fontWeight: "700",
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },

  // Input bar
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: colors.sidebar,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    color: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.violet,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.3,
  },
});
