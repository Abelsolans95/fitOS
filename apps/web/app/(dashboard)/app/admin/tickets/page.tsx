"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  trainer_id: string;
  trainer_name: string;
  client_id: string;
  client_name: string;
  category: string;
  subject: string;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "#FF9100",
  in_progress: "#00E5FF",
  resolved: "#00C853",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Abierto",
  in_progress: "En curso",
  resolved: "Resuelto",
};

const CATEGORY_LABELS: Record<string, string> = {
  nutricion: "Nutrición",
  rutina: "Rutina",
  lesion: "Lesión",
  general: "General",
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    params.set("page", String(page));
    params.set("limit", String(limit));

    try {
      const res = await fetch(`/api/admin/tickets?${params}`);
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, page]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Consultas</h1>
        <p className="text-sm text-[#8B8BA3]">{total} consultas en total (solo lectura)</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          {[
            { value: "", label: "Todos" },
            { value: "open", label: "Abiertos" },
            { value: "in_progress", label: "En curso" },
            { value: "resolved", label: "Resueltos" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                statusFilter === opt.value
                  ? "bg-[#7C3AED] text-white"
                  : "border border-white/[0.06] bg-[#12121A] text-[#8B8BA3] hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-white/[0.06] bg-[#12121A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/50"
        >
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#12121A]">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-[#5A5A72]">No se encontraron consultas</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                <th className="px-4 py-3">Asunto</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Entrenador</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                >
                  <td className="max-w-[250px] truncate px-4 py-3 font-semibold text-white">
                    {t.subject}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/admin/users/${t.client_id}`}
                      className="text-sm text-[#00E5FF] hover:underline"
                    >
                      {t.client_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/admin/users/${t.trainer_id}`}
                      className="text-sm text-[#7C3AED] hover:underline"
                    >
                      {t.trainer_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8B8BA3]">
                    {CATEGORY_LABELS[t.category] ?? t.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        color: STATUS_COLORS[t.status] ?? "#8B8BA3",
                        backgroundColor: (STATUS_COLORS[t.status] ?? "#8B8BA3") + "15",
                      }}
                    >
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5A5A72]">
                    {new Date(t.created_at).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-white/[0.06] bg-[#12121A] px-3 py-1.5 text-xs text-[#8B8BA3] transition-colors hover:text-white disabled:opacity-30"
          >
            Anterior
          </button>
          <span className="text-xs text-[#5A5A72]">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-white/[0.06] bg-[#12121A] px-3 py-1.5 text-xs text-[#8B8BA3] transition-colors hover:text-white disabled:opacity-30"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
