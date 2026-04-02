"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface UseSidebarBadgesParams {
  role: "trainer" | "client";
  chatPath: string;
  communityPath: string;
  ticketsPath: string;
}

interface SidebarBadges {
  chatUnread: number;
  communityUnread: number;
  ticketUnread: number;
}

/**
 * Shared hook for sidebar badge counts (chat, community, tickets).
 * Handles initial fetch, Realtime subscriptions, and pathname-based reset.
 */
export function useSidebarBadges({
  role,
  chatPath,
  communityPath,
  ticketsPath,
}: UseSidebarBadgesParams): SidebarBadges {
  const pathname = usePathname();
  const [chatUnread, setChatUnread] = useState(0);
  const [communityUnread, setCommunityUnread] = useState(0);
  const [ticketUnread, setTicketUnread] = useState(0);

  // Reset badges when visiting the relevant page
  useEffect(() => {
    if (pathname === chatPath) setChatUnread(0);
    if (pathname === communityPath) setCommunityUnread(0);
    if (pathname === ticketsPath) setTicketUnread(0);
  }, [pathname, chatPath, communityPath, ticketsPath]);

  useEffect(() => {
    const supabase = createClient();
    let userId = "";
    let trainerId = "";
    let communityId = "";
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // --- Chat unread ---
    const fetchChatUnread = async () => {
      if (role === "trainer") {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("trainer_id", userId)
          .neq("sender_id", userId)
          .is("read_at", null);
        setChatUnread(count ?? 0);
      } else {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("trainer_id", trainerId)
          .eq("client_id", userId)
          .eq("sender_id", trainerId)
          .is("read_at", null);
        setChatUnread(count ?? 0);
      }
    };

    // --- Community unread ---
    const fetchCommunityUnread = async () => {
      if (!communityId) {
        setCommunityUnread(0);
        return;
      }

      const { data: readStatus } = await supabase
        .from("community_read_status")
        .select("last_seen_at")
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .single();

      let query = supabase
        .from("community_posts")
        .select("id", { count: "exact", head: true })
        .eq("community_id", communityId);

      // Trainer only counts posts by others; client counts all posts
      if (role === "trainer") {
        query = query.neq("author_id", userId);
      }

      if (readStatus?.last_seen_at) {
        query = query.gt("created_at", readStatus.last_seen_at);
      }

      const { count } = await query;
      setCommunityUnread(count ?? 0);
    };

    // --- Ticket unread ---
    const fetchTicketUnread = async () => {
      if (role === "trainer") {
        // New tickets never opened by trainer
        const { count: newTickets, error: ticketsErr } = await supabase
          .from("support_tickets")
          .select("id", { count: "exact", head: true })
          .eq("trainer_id", userId)
          .is("trainer_read_at", null);
        if (ticketsErr) console.error("[useSidebarBadges] Error counting unread tickets:", ticketsErr);

        // Unread client replies
        const { count: unreadReplies, error: repliesErr } = await supabase
          .from("ticket_replies")
          .select("id", { count: "exact", head: true })
          .neq("sender_id", userId)
          .is("read_at", null);
        if (repliesErr) console.error("[useSidebarBadges] Error counting unread replies:", repliesErr);

        setTicketUnread((newTickets ?? 0) + (unreadReplies ?? 0));
      } else {
        // Client: only unread replies from trainer
        const { count, error } = await supabase
          .from("ticket_replies")
          .select("id", { count: "exact", head: true })
          .neq("sender_id", userId)
          .is("read_at", null);
        if (error) console.error("[useSidebarBadges] Error counting unread replies:", error);
        setTicketUnread(count ?? 0);
      }
    };

    // --- Init & subscribe ---
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      // Client needs to look up trainer
      if (role === "client") {
        const { data: rel } = await supabase
          .from("trainer_clients")
          .select("trainer_id")
          .eq("client_id", user.id)
          .eq("status", "active")
          .single();
        if (!rel) return;
        trainerId = rel.trainer_id as string;

        // Client community: trainer must have an active one
        const { data: comm } = await supabase
          .from("communities")
          .select("id")
          .eq("coach_id", trainerId)
          .eq("is_active", true)
          .single();
        if (comm) communityId = comm.id;
      } else {
        // Trainer community: own
        const { data: community } = await supabase
          .from("communities")
          .select("id")
          .eq("coach_id", userId)
          .single();
        if (community) communityId = community.id;
      }

      // Initial fetch
      await Promise.all([fetchChatUnread(), fetchCommunityUnread(), fetchTicketUnread()]);

      // --- Realtime subscriptions ---
      if (role === "trainer") {
        channel = supabase
          .channel("trainer-sidebar-unread")
          .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetchChatUnread)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_posts" }, fetchCommunityUnread)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_tickets" }, fetchTicketUnread)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_replies" }, fetchTicketUnread)
          .subscribe();
      } else {
        channel = supabase
          .channel(`sidebar-unread-${userId}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages", filter: `client_id=eq.${userId}` },
            (payload) => {
              const msg = payload.new as { sender_id: string; read_at: string | null };
              if (msg.sender_id === trainerId && !msg.read_at) {
                setChatUnread((n) => n + 1);
              }
            }
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "messages", filter: `client_id=eq.${userId}` },
            () => { fetchChatUnread(); }
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "community_posts" },
            (payload) => {
              if (communityId && payload.new.community_id === communityId && payload.new.author_id !== userId) {
                setCommunityUnread((n) => n + 1);
              }
            }
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "ticket_replies" },
            (payload) => {
              const reply = payload.new as { sender_id: string };
              if (reply.sender_id !== userId) {
                setTicketUnread((n) => n + 1);
              }
            }
          )
          .subscribe();
      }
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [role]);

  return { chatUnread, communityUnread, ticketUnread };
}
