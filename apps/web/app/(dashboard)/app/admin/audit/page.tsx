"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  target_user_id: string | null;
  target_user_name: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: "#00C853",
  update: "#FF9100",
  delete: "#FF1744",
  login: "#00E5FF",
  view: "#8B8BA3",
  import: "#7C3AED",
};

const RESOURCE_LABELS: Record<string, string> = {
  trainer: "Entrenador",
  client: "Cliente",
  promo_code: "Código promo",
  routine: "Rutina",
  meal_plan: "Menú",
  article: "Artículo",
  ticket: "Consulta",
  appointment: "Cita",
  exercise: "Ejercicio",
  profile: "Perfil",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    if (resourceFilter) params.set("resource_type", resourceFilter);
    params.set("page", String(page));
    params.set("limit", String(limit));

    try {
      const res = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, resourceFilter, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Logs de Auditoría</h1>
        <p className="text-sm text-[#8B8BA3]">{total} eventos registrados</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-white/[0.06] bg-[#12121A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/50"
        >
          <option value="">Todas las acciones</option>
          <option value="create">Crear</option>
          <option value="update">Actualizar</option>
          <option value="delete">Eliminar</option>
          <option value="login">Login</option>
          <option value="view">Ver</option>
          <option value="import">Import</option>
        </select>

        <select
          value={resourceFilter}
          onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-white/[0.06] bg-[#12121A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/50"
        >
          <option value="">Todos los recursos</option>
          {Object.entries(RESOURCE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Logs */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-white/[0.06] bg-[#12121A]">
            <p className="text-sm text-[#5A5A72]">No se encontraron eventos</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-white/[0.06] bg-[#12121A] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action badge */}
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
                      style={{
                        color: ACTION_COLORS[log.action] ?? "#8B8BA3",
                        backgroundColor: (ACTION_COLORS[log.action] ?? "#8B8BA3") + "15",
                      }}
                    >
                      {log.action}
                    </span>

                    {/* Resource type */}
                    <span className="text-xs font-semibold text-[#5A5A72]">
                      {RESOURCE_LABELS[log.resource_type] ?? log.resource_type}
                    </span>

                    {/* Resource ID */}
                    {log.resource_id && (
                      <span className="font-mono text-xs text-[#5A5A72]">
                        {log.resource_id.substring(0, 8)}
                      </span>
                    )}
                  </div>

                  {/* Who did it */}
                  <div className="flex flex-wrap items-center gap-1 text-sm">
                    <Link
                      href={`/app/admin/users/${log.user_id}`}
                      className="font-semibold text-white hover:text-[#00E5FF]"
                    >
                      {log.user_name}
                    </Link>
                    {log.user_role && (
                      <span className="text-xs text-[#5A5A72]">({log.user_role})</span>
                    )}
                    {log.target_user_name && (
                      <>
                        <span className="text-[#5A5A72]">→</span>
                        <Link
                          href={`/app/admin/users/${log.target_user_id}`}
                          className="font-semibold text-white hover:text-[#00E5FF]"
                        >
                          {log.target_user_name}
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Metadata */}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-1 text-xs text-[#5A5A72]">
                      {Object.entries(log.metadata).slice(0, 3).map(([key, val]) => (
                        <span key={key} className="mr-3">
                          <span className="text-[#8B8BA3]">{key}:</span>{" "}
                          {String(val)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Timestamp + IP */}
                <div className="shrink-0 text-right">
                  <p className="text-xs text-[#5A5A72]">
                    {new Date(log.created_at).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {log.ip_address && (
                    <p className="mt-0.5 font-mono text-xs text-[#5A5A72]/50">{log.ip_address}</p>
                  )}
                </div>
              </div>
            </div>
          ))
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
