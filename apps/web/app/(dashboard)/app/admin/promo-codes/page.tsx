"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface PromoCode {
  id: string;
  trainer_id: string;
  trainer_name: string;
  code: string;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_expired: boolean;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
  { value: "expired", label: "Expirados" },
];

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const limit = 50;

  const loadCodes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());
    params.set("page", String(page));
    params.set("limit", String(limit));

    try {
      const res = await fetch(`/api/admin/promo-codes?${params}`);
      const data = await res.json();
      setCodes(data.codes ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setCodes([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  const toggleActive = async (code: PromoCode) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/promo-codes/${code.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !code.is_active }),
      });

      if (!res.ok) {
        toast.error("Error al actualizar");
        return;
      }

      toast.success(code.is_active ? "Código desactivado" : "Código activado");
      loadCodes();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Códigos Promocionales</h1>
        <p className="text-sm text-[#8B8BA3]">{total} códigos en total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Buscar por código..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 rounded-xl border border-white/[0.06] bg-[#12121A] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#7C3AED]/50"
        />
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#12121A]">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
          </div>
        ) : codes.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-[#5A5A72]">No se encontraron códigos</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Entrenador</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Usos</th>
                <th className="px-4 py-3">Expira</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-bold text-[#7C3AED]">{c.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/admin/users/${c.trainer_id}`}
                      className="text-sm text-white hover:text-[#00E5FF]"
                    >
                      {c.trainer_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {c.is_expired ? (
                      <span className="inline-flex rounded-full bg-[#FF1744]/10 px-2 py-0.5 text-xs font-semibold text-[#FF1744]">
                        Expirado
                      </span>
                    ) : c.is_active ? (
                      <span className="inline-flex rounded-full bg-[#00C853]/10 px-2 py-0.5 text-xs font-semibold text-[#00C853]">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-[#8B8BA3]/10 px-2 py-0.5 text-xs font-semibold text-[#8B8BA3]">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-semibold text-white">{c.current_uses}</span>
                    <span className="text-[#5A5A72]">{c.max_uses ? ` / ${c.max_uses}` : " / ∞"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5A5A72]">
                    {c.expires_at
                      ? new Date(c.expires_at).toLocaleDateString("es-ES")
                      : "Sin expiración"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5A5A72]">
                    {new Date(c.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === c.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleActive(c)}
                          disabled={saving}
                          className="rounded-lg bg-[#FF9100] px-2 py-1 text-xs font-semibold text-[#0A0A0F] disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-[#5A5A72] hover:text-white"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingId(c.id)}
                        className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                          c.is_active
                            ? "text-[#FF1744] hover:bg-[#FF1744]/10"
                            : "text-[#00C853] hover:bg-[#00C853]/10"
                        }`}
                      >
                        {c.is_active ? "Desactivar" : "Activar"}
                      </button>
                    )}
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
