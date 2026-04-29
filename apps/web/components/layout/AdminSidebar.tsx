"use client";

import {
  LayoutDashboard,
  Users,
  Ticket,
  Salad,
  LineChart,
  ShieldCheck,
  Settings2,
  MessageCircle,
} from "lucide-react";
import { AppSidebar, SidebarNavItem } from "./AppSidebar";

const ADMIN_NAV_ITEMS: SidebarNavItem[] = [
  {
    label: "Dashboard",
    href: "/app/admin/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "Usuarios",
    href: "/app/admin/users",
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: "Códigos Promo",
    href: "/app/admin/promo-codes",
    icon: <Ticket className="h-4 w-4" />,
  },
  {
    label: "Gestión de menús",
    href: "/app/admin/menus",
    icon: <Salad className="h-4 w-4" />,
  },
  {
    label: "Consultas",
    href: "/app/admin/tickets",
    icon: <MessageCircle className="h-4 w-4" />,
  },
  {
    label: "Analíticas",
    href: "/app/admin/analytics",
    icon: <LineChart className="h-4 w-4" />,
  },
  {
    label: "Auditoría",
    href: "/app/admin/audit",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    label: "Configuración",
    href: "/app/admin/settings",
    icon: <Settings2 className="h-4 w-4" />,
  },
];

export function AdminSidebar() {
  return <AppSidebar items={ADMIN_NAV_ITEMS} defaultHref="/app/admin/dashboard" />;
}
