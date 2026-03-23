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
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.04] bg-[#0A0A0F]/80 backdrop-blur-xl px-4 lg:hidden">
        <Link href={defaultHref} className="text-base font-extrabold tracking-tight text-white">
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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300
          ${collapsed ? "lg:w-[80px]" : "lg:w-[240px]"} w-[240px]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          lg:bg-transparent bg-[#0A0A0F] lg:border-none border-r border-white/[0.06]
          lg:p-4
        `}
      >
        <div className="flex h-full flex-col overflow-hidden bg-[#0A0A0F] lg:rounded-2xl lg:border lg:border-white/[0.06] lg:bg-[#12121A]/70 lg:backdrop-blur-xl lg:shadow-2xl">
        {/* Logo — desktop only */}
        <div
          className={`hidden h-16 shrink-0 items-center border-b border-white/[0.04] lg:flex ${
            collapsed ? "justify-center px-0" : "justify-between px-6"
          }`}
        >
          {!collapsed && (
            <Link href={defaultHref} className="text-[17px] font-extrabold tracking-tight text-white transition-opacity hover:opacity-80">
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
          className="flex-1 overflow-y-auto py-5 pt-16 lg:pt-5 custom-scrollbar"
          aria-label="Navegación principal"
        >
          <div className="flex flex-col gap-1 px-3">
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
                <div key={item.href} className="flex flex-col">
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                      isParentActive 
                        ? "bg-[#00E5FF]/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-[#00E5FF]/20" 
                        : "text-[#8B8BA3] hover:bg-white/[0.04] hover:text-white"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    {isParentActive && (
                      <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#00E5FF] shadow-[0_0_12px_#00E5FF]" />
                    )}
                    <span className={`flex-shrink-0 transition-colors ${isParentActive ? "text-[#00E5FF]" : "text-[#5A5A72] group-hover:text-[#00E5FF]"}`}>
                      {item.icon}
                    </span>
                    {!collapsed && <span className="block truncate">{item.label}</span>}
                  </Link>
                  {!collapsed && (
                    <div className="ml-5 mt-1 border-l border-white/[0.06] flex flex-col gap-0.5 pl-3">
                      {item.children!.map((child) => {
                        const childActive =
                          pathname === child.href || pathname.startsWith(child.href + "/");
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={`block rounded-lg px-3 py-2 text-[12px] font-medium transition-all duration-200 ${
                              childActive 
                                ? "bg-white/[0.04] text-[#00E5FF]" 
                                : "text-[#5A5A72] hover:bg-white/[0.02] hover:text-[#8B8BA3]"
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
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-[#00E5FF]/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-[#00E5FF]/20" 
                    : "text-[#8B8BA3] hover:bg-white/[0.04] hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
              >
                {isActive && (
                  <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#00E5FF] shadow-[0_0_12px_#00E5FF]" />
                )}
                <span className={`flex-shrink-0 transition-colors ${isActive ? "text-[#00E5FF]" : "text-[#5A5A72] group-hover:text-[#00E5FF]"}`}>
                  {item.icon}
                </span>
                {!collapsed && <span className="block truncate">{item.label}</span>}
              </Link>
            );
          })}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-white/[0.04] p-3">
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Cerrar sesión" : undefined}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#5A5A72] transition-colors hover:bg-[#FF1744]/10 hover:text-[#FF1744] ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <svg
              className="h-4 w-4 shrink-0 transition-colors group-hover:text-[#FF1744]/80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            {!collapsed && <span className="block truncate">Cerrar sesión</span>}
          </button>
        </div>
        </div>
      </aside>
    </>
  );
}
