import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FlatList, Alert } from "react-native";
import { supabase } from "../../lib/supabase";
import { QUERY_LIMITS } from "../../lib/constants";
import { Message, TrainerInfo, ListItem, formatDay } from "./types";

interface UseChatParams {
  userId: string | undefined;
}

interface UseChatReturn {
  messages: Message[];
  trainer: TrainerInfo | null;
  input: string;
  setInput: (text: string) => void;
  sending: boolean;
  loading: boolean;
  error: string | null;
  listItems: ListItem[];
  flatListRef: React.RefObject<FlatList | null>;
  scrollToBottom: () => void;
  handleSend: () => Promise<void>;
}

export function useChat({ userId }: UseChatParams): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [trainer, setTrainer] = useState<TrainerInfo | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Load data + Realtime subscription (Rule 95: sync cleanup)
  useEffect(() => {
    if (!userId) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      // Find trainer
      const { data: rel, error: relErr } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", userId)
        .eq("status", "active")
        .single();

      if (relErr || !rel) {
        setError("No tienes un entrenador asignado.");
        setLoading(false);
        return;
      }

      const tid = rel.trainer_id as string;
      setTrainerId(tid);

      // Load trainer profile + messages in parallel (Rule 103)
      const [profileRes, msgsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").eq("user_id", tid).single(),
        supabase.from("messages").select("id, trainer_id, client_id, sender_id, content, read_at, created_at").eq("trainer_id", tid).eq("client_id", userId).order("created_at", { ascending: true }).limit(QUERY_LIMITS.MESSAGES),
      ]);

      if (profileRes.error) {
        console.error("[useChat] Error cargando perfil trainer:", profileRes.error);
        Alert.alert("Error", "No se pudo cargar el perfil del entrenador");
        setLoading(false);
        return;
      }
      setTrainer(profileRes.data as TrainerInfo | null);

      if (msgsRes.error) {
        console.error("[useChat] Error cargando mensajes:", msgsRes.error);
        Alert.alert("Error", "No se pudieron cargar los mensajes");
      }
      setMessages((msgsRes.data as Message[]) ?? []);
      setLoading(false);

      // Mark trainer messages as read (non-blocking)
      const { error: markErr } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("trainer_id", tid)
        .eq("client_id", userId)
        .eq("sender_id", tid)
        .is("read_at", null);
      if (markErr) {
        console.error("[useChat] Error marcando como leido:", markErr);
      } // Non-blocking

      // Realtime subscription with filter (Rule 172)
      channel = supabase
        .channel(`chat:${tid}:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `client_id=eq.${userId}`,
          },
          (payload) => {
            const msg = payload.new as Message;
            setMessages((prev) => {
              if (prev.find((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            // Mark incoming trainer messages as read. Supabase PostgrestBuilder
            // returns a PromiseLike (no .catch), so wrap with Promise.resolve().
            if (msg.sender_id === tid) {
              Promise.resolve(
                supabase
                  .from("messages")
                  .update({ read_at: new Date().toISOString() })
                  .eq("id", msg.id)
              )
                .then(({ error: readErr }) => {
                  if (readErr) {
                    console.error(
                      "[useChat] Error marcando mensaje como leido:",
                      readErr
                    );
                  }
                })
                .catch((err: unknown) =>
                  console.error("[useChat] Error marking as read:", err)
                );
            }
          }
        )
        .subscribe();
    };

    init();

    // Sync cleanup (Rule 95)
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  // Scroll to bottom when messages change (Rule 166: setTimeout cleanup)
  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [scrollToBottom]);

  // Send message (Rule 167: Alert.alert on error)
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !trainerId || !userId) return;
    setSending(true);
    setInput("");
    const { error: sendError } = await supabase.from("messages").insert({
      trainer_id: trainerId,
      client_id: userId,
      sender_id: userId,
      content: text,
    });
    if (sendError) {
      console.error("[useChat] Error enviando mensaje:", sendError);
      Alert.alert("Error", "No se pudo enviar el mensaje");
    }
    setSending(false);
  }, [input, sending, trainerId, userId]);

  // Group messages by day for separators
  const listItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    let lastDay = "";
    for (const msg of messages) {
      const day = new Date(msg.created_at).toDateString();
      if (day !== lastDay) {
        items.push({
          type: "separator",
          day,
          label: formatDay(msg.created_at),
        });
        lastDay = day;
      }
      items.push({ type: "message", data: msg });
    }
    return items;
  }, [messages]);

  return {
    messages,
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
  };
}
