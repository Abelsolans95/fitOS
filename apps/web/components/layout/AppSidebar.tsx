"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

interface AppSidebarProps {
  items: SidebarNavItem[];
  defaultHref: string;
}

export function AppSidebar({ items, defaultHref }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace("/login");
  };

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0A0A0F] px-4 lg:hidden">
        <Link href={defaultHref} className="text-base font-bold tracking-tight text-white">
          Fit<span className="text-[#00E5FF]">OS</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-lg p-1.5 text-[#5A5A72] transition-colors hover:text-white"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Backdrop (mobile only) ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[#0A0A0F] transition-all duration-300
          ${collapsed ? "lg:w-[60px]" : "lg:w-[220px]"} w-[220px]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo — desktop only */}
        <div
          className={`hidden h-14 items-center border-b border-white/[0.06] lg:flex ${
            collapsed ? "justify-center px-0" : "justify-between px-5"
          }`}
        >
          {!collapsed && (
            <Link href={defaultHref} className="text-base font-bold tracking-tight text-white">
              Fit<span className="text-[#00E5FF]">OS</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-[#5A5A72] transition-colors hover:text-white"
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto py-4 pt-16 lg:pt-4"
          aria-label="Navegación principal"
        >
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const hasChildren = item.children && item.children.length > 0;
            const isChildActive = hasChildren && item.children!.some(
              (child) => pathname === child.href || pathname.startsWith(child.href + "/")
            );
            const isParentActive = isActive || isChildActive;

            if (hasChildren) {
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 py-2.5 text-[13px] font-medium transition-colors duration-150 ${
                      isParentActive ? "text-white" : "text-[#5A5A72] hover:text-[#8B8BA3]"
                    } ${collapsed ? "lg:justify-center lg:px-0 px-5" : "px-5"}`}
                  >
                    {isParentActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-[#00E5FF]" />
                    )}
                    <span className={isParentActive ? "text-[#00E5FF]" : ""}>{item.icon}</span>
                    <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
                  </Link>
                  {!collapsed && (
                    <div className="ml-[2.15rem] border-l border-white/[0.06] pl-3">
                      {item.children!.map((child) => {
                        const childActive =
                          pathname === child.href || pathname.startsWith(child.href + "/");
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={`block py-1.5 text-[12px] font-medium transition-colors duration-150 ${
                              childActive ? "text-[#00E5FF]" : "text-[#5A5A72] hover:text-[#8B8BA3]"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`relative flex items-center gap-3 py-2.5 text-[13px] font-medium transition-colors duration-150 ${
                  isActive ? "text-white" : "text-[#5A5A72] hover:text-[#8B8BA3]"
                } ${collapsed ? "lg:justify-center lg:px-0 px-5" : "px-5"}`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-[#00E5FF]" />
                )}
                <span className={isActive ? "text-[#00E5FF]" : ""}>{item.icon}</span>
                <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/[0.06] py-3">
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Cerrar sesión" : undefined}
            className={`flex w-full items-center gap-3 py-2.5 text-[13px] font-medium text-[#5A5A72] transition-colors hover:text-[#FF1744] ${
              collapsed ? "lg:justify-center lg:px-0 px-5" : "px-5"
            }`}
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
              />
            </svg>
            <span className={collapsed ? "lg:hidden" : ""}>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
