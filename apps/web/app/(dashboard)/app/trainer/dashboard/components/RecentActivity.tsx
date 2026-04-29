"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock, ArrowRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useUser } from "@/lib/hooks/useUser";

interface ActivityItem {
  kind: "client_joined" | "session_completed";
  who: string;
  when: string; // ISO
  detail?: string;
  href: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

/**
 * Fetches the trainer's recent client + session activity. When empty, shows a
 * contextual CTA pointing to the most likely next action (add a client / open
 * Today panel) — empty states without a path forward feel like dead ends.
 */
export function RecentActivity() {
  const { user } = useUser();
  const [items, setItems] = useState<ActivityItem[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const supabase = createClient();
      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

      // Two parallel windows: clients joined recently + workout sessions completed.
      const [clientsRes, sessionsRes] = await Promise.all([
        supabase
          .from("trainer_clients")
          .select("client_id, joined_at")
          .eq("trainer_id", user.id)
          .eq("status", "active")
          .gte("joined_at", sevenDaysAgo)
          .order("joined_at", { ascending: false })
          .limit(8),
        supabase
          .from("workout_sessions")
          .select("client_id, completed_at, day_label")
          .gte("completed_at", sevenDaysAgo)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(8),
      ]);

      const clientIds = new Set<string>();
      (clientsRes.data ?? []).forEach((r) => clientIds.add(r.client_id));
      (sessionsRes.data ?? []).forEach((r) => clientIds.add(r.client_id));
      let nameById = new Map<string, string>();
      if (clientIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", Array.from(clientIds));
        nameById = new Map(
          (profiles ?? []).map((p) => [p.user_id, p.full_name ?? "Sin nombre"])
        );
      }

      const merged: ActivityItem[] = [
        ...(clientsRes.data ?? []).map<ActivityItem>((r) => ({
          kind: "client_joined",
          who: nameById.get(r.client_id) ?? "Nuevo cliente",
          when: r.joined_at,
          href: `/app/trainer/clients/${r.client_id}`,
        })),
        ...(sessionsRes.data ?? []).map<ActivityItem>((r) => ({
          kind: "session_completed",
          who: nameById.get(r.client_id) ?? "Cliente",
          when: r.completed_at,
          detail: r.day_label ?? undefined,
          href: `/app/trainer/clients/${r.client_id}`,
        })),
      ]
        .sort((a, b) => +new Date(b.when) - +new Date(a.when))
        .slice(0, 6);

      setItems(merged);
    };
    load();
  }, [user]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
        <div className="flex items-center gap-2 text-[#8B8BA3]">
          <Clock className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-[13px] font-semibold">Últimas acciones</span>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-[#5A5A72]">
          Últimos 7 días
        </span>
      </div>

      {items === null ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y divide-white/[0.04]">
          {items.map((item, i) => (
            <li key={`${item.kind}-${item.when}-${i}`}>
              <Link
                href={item.href}
                className="group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      item.kind === "client_joined" ? "bg-[#00E5FF]" : "bg-[#00C853]"
                    }`}
                  />
                  <p className="truncate text-[13px] text-white">
                    <span className="font-semibold">{item.who}</span>{" "}
                    <span className="text-[#8B8BA3]">
                      {item.kind === "client_joined"
                        ? "se unió como cliente"
                        : item.detail
                        ? `completó ${item.detail}`
                        : "completó un entreno"}
                    </span>
                  </p>
                </div>
                <span className="ml-3 shrink-0 text-[11px] text-[#5A5A72] tabular-nums">
                  {timeAgo(item.when)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] text-[#3A3A52] ring-1 ring-white/[0.06]">
        <Clock className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-[#8B8BA3]">
          Aún no hay actividad
        </p>
        <p className="max-w-[260px] text-[11px] text-[#5A5A72]">
          Cuando un cliente se una o complete un entreno, lo verás aquí en tiempo
          real.
        </p>
      </div>
      <Link
        href="/app/trainer/clients"
        className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-[#00E5FF]/25 bg-[#00E5FF]/[0.06] px-4 py-2 text-[12px] font-bold text-[#00E5FF] transition-all hover:border-[#00E5FF]/50 hover:bg-[#00E5FF]/[0.12]"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        Añadir tu primer cliente
        <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
      </Link>
    </div>
  );
}
