"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { QUERY_LIMITS } from "@/lib/constants";
import type { Message } from "@fitos/shared";

export type { Message };

export interface TrainerInfo {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

/** Pure helper: add a new message only if not already present (deduplication for Realtime). */
export function deduplicateMessage(prev: Message[], incoming: Message): Message[] {
  return prev.find((m) => m.id === incoming.id) ? prev : [...prev, incoming];
}

/** Pure helper: build an optimistic message for instant UI feedback before DB confirmation. */
export function buildOptimisticMessage(trainerId: string, clientId: string, content: string): Message {
  return {
    id: `opt-${Date.now()}`,
    trainer_id: trainerId,
    client_id: clientId,
    sender_id: clientId,
    content,
    read_at: null,
    created_at: new Date().toISOString(),
  };
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [trainer, setTrainer] = useState<TrainerInfo | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const trainerIdRef = useRef<string>("");
  const clientIdRef = useRef<string>("");

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      if (authErr || !session?.user) { setError("No se pudo obtener la sesión."); setLoading(false); return; }
      const user = session.user;

      setClientId(user.id);
      clientIdRef.current = user.id;

      const { data: rel, error: relErr } = await supabase
        .from("trainer_clients").select("trainer_id")
        .eq("client_id", user.id).eq("status", "active").single();
      if (relErr || !rel) { setError("No tienes un entrenador asignado."); setLoading(false); return; }

      const tid = rel.trainer_id as string;
      trainerIdRef.current = tid;

      const [trainerRes, msgsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").eq("user_id", tid).single(),
        supabase.from("messages")
          .select("id, trainer_id, client_id, sender_id, content, read_at, created_at")
          .eq("trainer_id", tid).eq("client_id", user.id)
          .order("created_at", { ascending: true }).limit(QUERY_LIMITS.MESSAGES),
      ]);

      if (trainerRes.error) {
        toast.error("Error al cargar el perfil del entrenador");
        console.error("[useChat] Error perfil trainer:", trainerRes.error);
      }
      if (msgsRes.error) {
        toast.error("Error al cargar los mensajes");
        console.error("[useChat] Error mensajes:", msgsRes.error);
      }

      setTrainer(trainerRes.data as TrainerInfo | null);
      setMessages((msgsRes.data as Message[]) ?? []);
      setLoading(false);

      // Mark trainer messages as read (fire-and-forget)
      Promise.resolve(
        supabase.from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("trainer_id", tid).eq("client_id", user.id)
          .eq("sender_id", tid).is("read_at", null)
      ).catch(() => console.error("[useChat] Error marking as read"));

      channel = supabase.channel(`chat-client-${user.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `client_id=eq.${user.id}` },
          (payload) => {
            const msg = payload.new as Message;
            if (msg.sender_id === clientIdRef.current) return;
            setMessages((prev) => deduplicateMessage(prev, msg));
            Promise.resolve(supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", msg.id)).catch(() => console.error("[useChat] Error marking as read"));
          }
        ).subscribe();
    };

    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !trainerIdRef.current || !clientIdRef.current) return;

    setSending(true);
    setInput("");

    const optimistic = buildOptimisticMessage(trainerIdRef.current, clientIdRef.current, text);
    setMessages((prev) => [...prev, optimistic]);

    const supabase = createClient();
    const { error: insertErr } = await supabase.from("messages").insert({
      trainer_id: trainerIdRef.current,
      client_id: clientIdRef.current,
      sender_id: clientIdRef.current,
      content: text,
    });
    if (insertErr) { console.error("[useChat] Error al enviar:", insertErr); }

    const { data: fresh, error: freshErr } = await supabase
      .from("messages").select("id,trainer_id,client_id,sender_id,content,read_at,created_at")
      .eq("trainer_id", trainerIdRef.current).eq("client_id", clientIdRef.current)
      .order("created_at", { ascending: true }).limit(QUERY_LIMITS.MESSAGES);
    if (freshErr) { console.error("[useChat] Error refrescando:", freshErr); } // No bloqueante

    if (fresh) setMessages(fresh as Message[]);
    setSending(false);
  }, [input, sending]);

  return { messages, trainer, clientId, clientIdRef, input, setInput, sending, loading, error, handleSend };
}
