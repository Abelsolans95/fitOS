"use client";

import {
  Home,
  Dumbbell,
  Salad,
  LineChart,
  MessagesSquare,
  Wrench,
} from "lucide-react";
import { AppSidebar, SidebarNavItem } from "./AppSidebar";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";
import { useMenusEnabled } from "@/hooks/useMenusEnabled";

const CHAT_HREF = "/app/client/chat";
const COMMUNITY_HREF = "/app/client/community";

/**
 * Client top-level is deliberately narrow — a client opens the app, ideally
 * hits "Mi día" equivalent (Inicio), Rutina, and Chat. Everything else goes
 * under groups so the surface feels focused.
 */
function buildNavItems(menusEnabled: boolean): SidebarNavItem[] {
  const items: SidebarNavItem[] = [
    {
      label: "Inicio",
      href: "/app/client/dashboard",
      icon: <Home className="h-4 w-4" />,
    },
    {
      label: "Rutina",
      href: "/app/client/routine",
      icon: <Dumbbell className="h-4 w-4" />,
    },
  ];

  if (menusEnabled) {
    items.push({
      label: "Nutrición",
      href: "/app/client/meals",
      icon: <Salad className="h-4 w-4" />,
      children: [
        { label: "Comidas", href: "/app/client/meals" },
        { label: "Calorías", href: "/app/client/calories" },
      ],
    });
  }

  items.push(
    {
      label: "Progreso",
      href: "/app/client/progress",
      icon: <LineChart className="h-4 w-4" />,
      children: [
        { label: "Progreso", href: "/app/client/progress" },
        { label: "Salud", href: "/app/client/health" },
        { label: "Ligas", href: "/app/client/leagues" },
      ],
    },
    {
      label: "Comunicación",
      href: CHAT_HREF,
      icon: <MessagesSquare className="h-4 w-4" />,
      children: [
        { label: "Chat", href: CHAT_HREF },
        { label: "Consultas", href: "/app/client/tickets" },
        { label: "Comunidad", href: COMMUNITY_HREF },
        { label: "Citas", href: "/app/client/appointments" },
      ],
    },
    {
      label: "Más",
      href: "/app/client/knowledge",
      icon: <Wrench className="h-4 w-4" />,
      children: [
        { label: "Conocimiento", href: "/app/client/knowledge" },
        { label: "Contratos", href: "/app/client/contracts" },
      ],
    }
  );

  return items;
}

export function ClientSidebar() {
  const { chatUnread, communityUnread, ticketUnread } = useSidebarBadges({
    role: "client",
    chatPath: CHAT_HREF,
    communityPath: COMMUNITY_HREF,
    ticketsPath: "/app/client/tickets",
  });
  const menusEnabled = useMenusEnabled();

  const base = buildNavItems(menusEnabled);
  const commUnread = chatUnread + communityUnread + ticketUnread;
  const items = base.map((item) =>
    item.href === CHAT_HREF && commUnread > 0 ? { ...item, badge: commUnread } : item
  );

  return <AppSidebar items={items} defaultHref="/app/client/dashboard" />;
}
