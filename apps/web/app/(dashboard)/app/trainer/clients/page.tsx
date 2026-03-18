"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface ClientRow {
  id: string;
  client_id: string;
  status: string;
  joined_at: string;
  profile: {
    full_name: string | null;
    email: string | null;
    goal: string | null;
    avatar_url: string | null;
  } | null;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: {
      bg: "bg-[#00C853]/10",
      text: "text-[#00C853]",
      label: "Activo",
    },
    inactive: {
      bg: "bg-[#8B8BA3]/10",
      text: "text-[#8B8BA3]",
      label: "Inactivo",
    },
    pending: {
      bg: "bg-[#FF9100]/10",
      text: "text-[#FF9100]",
      label: "Confirmar email",
    },
  };

  const style = config[status] ?? config.inactive;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

export default function TrainerClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("No se pudo obtener la sesion del usuario.");
          setLoading(false);
          return;
        }

        // 1. Get trainer_clients rows
        const { data: tcRows, error: tcError } = await supabase
          .from("trainer_clients")
          .select("id, client_id, status, joined_at")
          .eq("trainer_id", user.id)
          .order("joined_at", { ascending: false });

        if (tcError) {
          setError(`Error al cargar clientes: ${tcError.message}`);
          setLoading(false);
          return;
        }

        if (!tcRows || tcRows.length === 0) {
          setClients([]);
          setLoading(false);
          return;
        }

        // 2. Get profiles for those client IDs
        const clientIds = tcRows.map((r) => r.client_id);
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, goal, avatar_url")
          .in("user_id", clientIds);

        const profileMap = new Map(
          (profileRows ?? []).map((p) => [p.user_id, p])
        );

        // 3. Merge
        const merged: ClientRow[] = tcRows.map((row) => {
          const p = profileMap.get(row.client_id) || null;
          return {
            ...row,
            joined_at: row.joined_at,
            profile: p
              ? {
                  full_name: p.full_name,
                  email: p.email,
                  goal: p.goal,
                  avatar_url: p.avatar_url,
                }
              : null,
          };
        });

        setClients(merged);
      } catch {
        setError("Error inesperado al cargar los clientes.");
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => {
      const name = c.profile?.full_name?.toLowerCase() ?? "";
      const email = c.profile?.email?.toLowerCase() ?? "";
      return name.includes(q) || email.includes(q);
    });
  }, [clients, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="rounded-2xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-6 py-4">
          <p className="text-sm text-[#FF1744]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Mis Clientes</h1>
          <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#00E5FF]/10 px-2 text-xs font-bold text-[#00E5FF]">
            {clients.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8BA3]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#12121A] pl-10 pr-4 text-sm text-white placeholder:text-[#8B8BA3] outline-none transition-colors focus:border-[#00E5FF]/50"
          />
        </div>
      </div>

      {/* Client list */}
      {filteredClients.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
              <svg
                className="h-7 w-7 text-[#8B8BA3]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">
              {search.trim()
                ? "No se encontraron clientes"
                : "Aun no tienes clientes"}
            </p>
            <p className="text-xs text-[#8B8BA3]">
              {search.trim()
                ? "Intenta con otro termino de busqueda"
                : "Comparte tu codigo promocional para empezar a recibir clientes"}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#12121A]">
          {/* Table header */}
          <div className="hidden border-b border-white/[0.06] px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
            <div className="col-span-4 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
              Cliente
            </div>
            <div className="col-span-3 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
              Objetivo
            </div>
            <div className="col-span-2 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
              Fecha
            </div>
            <div className="col-span-2 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
              Estado
            </div>
            <div className="col-span-1" />
          </div>

          {/* Rows */}
          {filteredClients.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() =>
                router.push(`/app/trainer/clients/${client.client_id}`)
              }
              className="w-full border-b border-white/[0.04] px-6 py-4 text-left transition-colors last:border-b-0 hover:bg-white/[0.02] sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
            >
              {/* Name + Avatar */}
              <div className="col-span-4 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7C3AED]/10 text-xs font-bold text-[#7C3AED]">
                  {getInitials(client.profile?.full_name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {client.profile?.full_name ?? "Sin nombre"}
                  </p>
                  <p className="truncate text-xs text-[#8B8BA3]">
                    {client.profile?.email ?? "Sin email"}
                  </p>
                </div>
              </div>

              {/* Goal */}
              <div className="col-span-3 mt-2 sm:mt-0">
                <p className="truncate text-sm text-[#E8E8ED]">
                  {client.profile?.goal ?? "No especificado"}
                </p>
              </div>

              {/* Date */}
              <div className="col-span-2 mt-1 sm:mt-0">
                <p className="text-sm text-[#8B8BA3]">
                  {formatDate(client.joined_at)}
                </p>
              </div>

              {/* Status */}
              <div className="col-span-2 mt-1 sm:mt-0">
                <StatusBadge status={client.status} />
              </div>

              {/* Arrow */}
              <div className="col-span-1 hidden justify-end sm:flex">
                <svg
                  className="h-4 w-4 text-[#8B8BA3]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
