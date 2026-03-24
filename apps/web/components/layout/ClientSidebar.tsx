"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar, SidebarNavItem } from "./AppSidebar";
import { createClient } from "@/lib/supabase";

const CHAT_HREF = "/app/client/chat";

const BASE_NAV: Omit<SidebarNavItem, "badge">[] = [
  {
    label: "Inicio",
    href: "/app/client/dashboard",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: "Calorías",
    href: "/app/client/calories",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
      </svg>
    ),
  },
  {
    label: "Rutina",
    href: "/app/client/routine",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    label: "Comidas",
    href: "/app/client/meals",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5" />
      </svg>
    ),
  },
  {
    label: "Progreso",
    href: "/app/client/progress",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    label: "Citas",
    href: "/app/client/appointments",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
  {
    label: "Chat",
    href: CHAT_HREF,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
  },
];

export function ClientSidebar() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let trainerId = "";
    let clientId = "";
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      clientId = user.id;

      const { data: rel } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .single();
      if (!rel) return;
      trainerId = rel.trainer_id as string;

      // Initial unread count
      const fetchUnread = async () => {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("trainer_id", trainerId)
          .eq("client_id", clientId)
          .eq("sender_id", trainerId)
          .is("read_at", null);
        setUnread(count ?? 0);
      };

      await fetchUnread();

      // Realtime: listen for new trainer messages
      channel = supabase
        .channel(`sidebar-unread-${clientId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `client_id=eq.${clientId}`,
          },
          (payload) => {
            const msg = payload.new as { sender_id: string; read_at: string | null };
            if (msg.sender_id === trainerId && !msg.read_at) {
              setUnread((n) => n + 1);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `client_id=eq.${clientId}`,
          },
          () => {
            // Re-fetch on any update (e.g. read_at set)
            fetchUnread();
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Reset badge when entering the chat page
  useEffect(() => {
    if (pathname === CHAT_HREF) {
      setUnread(0);
    }
  }, [pathname]);

  const navItems: SidebarNavItem[] = BASE_NAV.map((item) =>
    item.href === CHAT_HREF
      ? { ...item, badge: unread > 0 ? unread : undefined }
      : item
  );

  return <AppSidebar items={navItems} defaultHref="/app/client/dashboard" />;
}
