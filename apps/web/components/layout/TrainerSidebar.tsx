"use client";

import {
  LayoutDashboard,
  CalendarClock,
  Users,
  Dumbbell,
  Salad,
  Settings2,
  MessagesSquare,
  Wrench,
} from "lucide-react";
import { AppSidebar, SidebarNavItem } from "./AppSidebar";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";
import { useMenusEnabled } from "@/hooks/useMenusEnabled";

/**
 * Top-level items are the primary product surface. Heuristic: if it doesn't
 * need a weekly touchpoint, it goes inside a group. 7 roots max.
 */
function buildNavItems(menusEnabled: boolean): SidebarNavItem[] {
  const items: SidebarNavItem[] = [
    {
      label: "Hoy",
      href: "/app/trainer/today",
      icon: <CalendarClock className="h-4 w-4" />,
    },
    {
      label: "Dashboard",
      href: "/app/trainer/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "Clientes",
      href: "/app/trainer/clients",
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Rutinas",
      href: "/app/trainer/routines",
      icon: <Dumbbell className="h-4 w-4" />,
    },
  ];

  if (menusEnabled) {
    items.push({
      label: "Nutrición",
      href: "/app/trainer/nutrition",
      icon: <Salad className="h-4 w-4" />,
    });
  }

  items.push(
    {
      label: "Comunicación",
      href: "/app/trainer/chat",
      icon: <MessagesSquare className="h-4 w-4" />,
      children: [
        { label: "Chat", href: "/app/trainer/chat" },
        { label: "Consultas", href: "/app/trainer/tickets" },
        { label: "Comunidad", href: "/app/trainer/community" },
        { label: "Citas", href: "/app/trainer/appointments" },
      ],
    },
    {
      label: "Herramientas",
      href: "/app/trainer/customize",
      icon: <Wrench className="h-4 w-4" />,
      children: [
        { label: "Personalizar ejercicios", href: "/app/trainer/import" },
        { label: "Personalizar menú", href: "/app/trainer/customize/menu" },
        { label: "Generación de rutinas", href: "/app/trainer/customize/routines" },
        { label: "Formularios", href: "/app/trainer/forms" },
        { label: "Contratos", href: "/app/trainer/contracts" },
        { label: "Leads", href: "/app/trainer/leads" },
        { label: "Conocimiento", href: "/app/trainer/knowledge" },
        { label: "Ligas", href: "/app/trainer/leagues" },
        { label: "Marketplace", href: "/app/trainer/marketplace" },
      ],
    },
    {
      label: "Ajustes",
      href: "/app/trainer/settings",
      icon: <Settings2 className="h-4 w-4" />,
    }
  );

  return items;
}

export function TrainerSidebar() {
  const { chatUnread, communityUnread, ticketUnread } = useSidebarBadges({
    role: "trainer",
    chatPath: "/app/trainer/chat",
    communityPath: "/app/trainer/community",
    ticketsPath: "/app/trainer/tickets",
  });
  const menusEnabled = useMenusEnabled();
  const base = buildNavItems(menusEnabled);

  // Communication group surfaces the combined unread count as the top-level badge.
  const commUnread = chatUnread + communityUnread + ticketUnread;
  const items = base.map((item) =>
    item.href === "/app/trainer/chat" && commUnread > 0
      ? { ...item, badge: commUnread }
      : item
  );

  return <AppSidebar items={items} defaultHref="/app/trainer/today" />;
}
