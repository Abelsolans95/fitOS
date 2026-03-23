"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface ClientRow {
  id: string;
  client_id: string;
  status: string;
  joined_at: string;
  profile: { full_name: string | null; email: string | null; goal: string | null; avatar_url: string | null } | null;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_CONFIG: Record<string, { dot: string; label: string; color: string }> = {
  active:   { dot: "#00C853", label: "Activo",         color: "#00C853" },
  inactive: { dot: "#5A5A72", label: "Inactivo",       color: "#5A5A72" },
  pending:  { dot: "#FF9100", label: "Confirmar email", color: "#FF9100" },
};

const AVATAR_GRADIENTS = [
  "from-[#00E5FF]/30 to-[#7C3AED]/30",
  "from-[#7C3AED]/30 to-[#FF9100]/30",
  "from-[#FF9100]/30 to-[#00E5FF]/30",
  "from-[#00C853]/30 to-[#7C3AED]/30",
];

export default function TrainerClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { setError("No se pudo obtener la sesión."); setLoading(false); return; }

        const { data: tcRows, error: tcError } = await supabase
          .from("trainer_clients").select("id, client_id, status, joined_at")
          .eq("trainer_id", user.id).order("joined_at", { ascending: false });

        if (tcError) { setError(`Error al cargar clientes: ${tcError.message}`); setLoading(false); return; }
        if (!tcRows || tcRows.length === 0) { setClients([]); setLoading(false); return; }

        const clientIds = tcRows.map(r => r.client_id);
        const { data: profileRows } = await supabase
          .from("profiles").select("user_id, full_name, email, goal, avatar_url").in("user_id", clientIds);

        const profileMap = new Map((profileRows ?? []).map(p => [p.user_id, p]));
        setClients(tcRows.map(row => {
          const p = profileMap.get(row.client_id) || null;
          return { ...row, profile: p ? { full_name: p.full_name, email: p.email, goal: p.goal, avatar_url: p.avatar_url } : null };
        }));
      } catch { setError("Error inesperado al cargar los clientes."); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(c => (c.profile?.full_name?.toLowerCase() ?? "").includes(q) || (c.profile?.email?.toLowerCase() ?? "").includes(q));
  }, [clients, search]);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-32">
      <div className="rounded-2xl border border-[#FF1744]/20 bg-[#FF1744]/05 px-6 py-4">
        <p className="text-sm text-[#FF1744]">{error}</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes cl-in { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .cl-in { animation: cl-in 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .cl-1 { animation-delay: 0.04s; } .cl-2 { animation-delay: 0.14s; }

        .client-row { transition: background 0.2s ease; }
        .client-row:hover { background: rgba(255,255,255,0.025); }
        .client-row:hover .row-arrow { opacity: 1; transform: translateX(2px); }
        .row-arrow { opacity: 0; transition: opacity 0.2s ease, transform 0.2s ease; }

        .search-input { transition: border-color 0.2s ease; }
        .search-input:focus { border-color: rgba(0,229,255,0.4); outline: none; }
        .search-input::placeholder { color: #5A5A72; }
      `}</style>

      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="cl-in cl-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Gestión</p>
            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-white">Mis Clientes</h1>
              <span className="flex h-6 min-w-[28px] items-center justify-center rounded-full bg-[#00E5FF]/10 px-2 text-[11px] font-bold text-[#00E5FF]">
                {clients.length}
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full max-w-xs">
            <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A5A72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input h-10 w-full rounded-xl border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl pl-10 pr-4 text-[13px] text-white"
            />
          </div>
        </div>

        {/* ── List ── */}
        <div className="cl-in cl-2">
          {filtered.length === 0 ? (
            <div className="rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-16">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] text-[#3A3A52]">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
                  </svg>
                </div>
                <p className="text-[14px] font-semibold text-white">
                  {search.trim() ? "Sin resultados" : "Aún no tienes clientes"}
                </p>
                <p className="text-[12px] text-[#5A5A72] text-center max-w-[220px]">
                  {search.trim() ? "Prueba con otro término de búsqueda" : "Comparte tu código promocional para empezar a recibir clientes"}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl">
              {/* Table header */}
              <div className="hidden border-b border-white/[0.05] px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
                {["Cliente", "Objetivo", "Fecha", "Estado", ""].map((h, i) => (
                  <div key={i} className={`text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72] ${i === 0 ? "col-span-4" : i === 1 ? "col-span-3" : i === 2 ? "col-span-2" : i === 3 ? "col-span-2" : "col-span-1"}`}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {filtered.map((client, idx) => {
                const cfg = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.inactive;
                const grad = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => router.push(`/app/trainer/clients/${client.client_id}`)}
                    className="client-row w-full border-b border-white/[0.04] px-6 py-4 text-left last:border-b-0 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                  >
                    {/* Avatar + Name */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${grad} text-[11px] font-bold text-white`}>
                        {getInitials(client.profile?.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-white">{client.profile?.full_name ?? "Sin nombre"}</p>
                        <p className="truncate text-[11px] text-[#5A5A72]">{client.profile?.email ?? "Sin email"}</p>
                      </div>
                    </div>

                    {/* Goal */}
                    <div className="col-span-3 mt-2 sm:mt-0">
                      <p className="truncate text-[13px] text-[#8B8BA3]">{client.profile?.goal ?? "—"}</p>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 mt-1 sm:mt-0">
                      <p className="text-[12px] text-[#5A5A72]">{formatDate(client.joined_at)}</p>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 mt-1 sm:mt-0">
                      <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
                        style={{ borderColor: `${cfg.color}25`, color: cfg.color, background: `${cfg.color}08` }}>
                        <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="col-span-1 hidden justify-end sm:flex">
                      <svg className="row-arrow h-4 w-4 text-[#8B8BA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
