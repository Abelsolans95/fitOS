"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  business_name?: string;
  specialty?: string;
  created_at: string;
  trainer_client_status?: string;
  trainer_id?: string;
  active_clients_count?: number;
}

const ROLE_LABELS: Record<string, string> = {
  trainer: "Entrenador",
  client: "Cliente",
  admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  trainer: "#7C3AED",
  client: "#00E5FF",
  admin: "#FF9100",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  pending: "Pendiente",
  paused: "Pausado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#00C853",
  pending: "#FF9100",
  paused: "#8B8BA3",
  cancelled: "#FF1744",
};

function UsersPageInner() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") || "";

  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [page, setPage] = useState(1);
  const limit = 50;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    if (search.trim()) params.set("search", search.trim());
    params.set("page", String(page));
    params.set("limit", String(limit));

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Usuarios</h1>
          <p className="text-sm text-[#8B8BA3]">{total} usuarios en total</p>
        </div>
        <Link
          href="/app/admin/users/create"
          className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7C3AED]/80"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Crear usuario
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 rounded-xl border border-white/10 bg-[#12121A] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#7C3AED]/50"
        />
        <div className="flex gap-2">
          {[
            { value: "", label: "Todos" },
            { value: "trainer", label: "Entrenadores" },
            { value: "client", label: "Clientes" },
            { value: "admin", label: "Admins" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setRoleFilter(opt.value); setPage(1); }}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                roleFilter === opt.value
                  ? "bg-[#7C3AED] text-white"
                  : "border border-white/10 bg-[#12121A] text-[#8B8BA3] hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12121A]">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-[#5A5A72]">No se encontraron usuarios</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Info</th>
                <th className="px-4 py-3">Registro</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.user_id}
                  className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/admin/users/${u.user_id}`}
                      className="font-semibold text-white hover:text-[#00E5FF]"
                    >
                      {u.full_name || "Sin nombre"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#8B8BA3]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
                      style={{
                        color: ROLE_COLORS[u.role] ?? "#8B8BA3",
                        backgroundColor: (ROLE_COLORS[u.role] ?? "#8B8BA3") + "15",
                      }}
                    >
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "client" && u.trainer_client_status ? (
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{
                          color: STATUS_COLORS[u.trainer_client_status] ?? "#8B8BA3",
                          backgroundColor: (STATUS_COLORS[u.trainer_client_status] ?? "#8B8BA3") + "15",
                        }}
                      >
                        {STATUS_LABELS[u.trainer_client_status] ?? u.trainer_client_status}
                      </span>
                    ) : u.role === "trainer" ? (
                      <span className="text-xs text-[#5A5A72]">—</span>
                    ) : (
                      <span className="text-xs text-[#5A5A72]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8B8BA3]">
                    {u.role === "trainer" && u.active_clients_count !== undefined && (
                      <span>{u.active_clients_count} clientes</span>
                    )}
                    {u.role === "trainer" && u.business_name && (
                      <span className="ml-2 text-[#5A5A72]">· {u.business_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5A5A72]">
                    {new Date(u.created_at).toLocaleDateString("es-ES")}
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
            className="rounded-lg border border-white/10 bg-[#12121A] px-3 py-1.5 text-xs text-[#8B8BA3] transition-colors hover:text-white disabled:opacity-30"
          >
            Anterior
          </button>
          <span className="text-xs text-[#5A5A72]">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-white/10 bg-[#12121A] px-3 py-1.5 text-xs text-[#8B8BA3] transition-colors hover:text-white disabled:opacity-30"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
        </div>
      }
    >
      <UsersPageInner />
    </Suspense>
  );
}
