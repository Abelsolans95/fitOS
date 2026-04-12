"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface MenuUser {
  user_id: string;
  full_name: string | null;
  business_name: string | null;
  role: string;
  menus_enabled: boolean;
}

type RoleFilter = "all" | "trainer" | "client";

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  trainer: { label: "Entrenador", color: "text-[#7C3AED]", bg: "bg-[#7C3AED]/10" },
  client: { label: "Cliente", color: "text-[#00E5FF]", bg: "bg-[#00E5FF]/10" },
};

function MenusPageInner() {
  const [users, setUsers] = useState<MenuUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      role: roleFilter,
      page: String(page),
      limit: "50",
    });
    if (search) params.set("search", search);

    const res = await fetch(`/api/admin/menus?${params}`);
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "Error al cargar usuarios");
      setLoading(false);
      return;
    }

    setUsers(data.users ?? []);
    setTotalPages(data.totalPages ?? 1);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [roleFilter, page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [roleFilter, search]);

  const handleToggle = useCallback(async (userId: string, currentValue: boolean) => {
    setTogglingId(userId);
    const newValue = !currentValue;

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, menus_enabled: newValue } : u))
    );

    const res = await fetch("/api/admin/menus", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, menus_enabled: newValue }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Error al actualizar");
      // Revert
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, menus_enabled: currentValue } : u))
      );
    } else {
      toast.success(newValue ? "Menus activados" : "Menus desactivados");
    }

    setTogglingId(null);
  }, []);

  const enabledCount = users.filter((u) => u.menus_enabled).length;
  const disabledCount = users.filter((u) => !u.menus_enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Gestion de menus</h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">
          Activa o desactiva el acceso a nutricion para entrenadores y clientes — {total} usuario{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Total</p>
          <p className="mt-1 text-2xl font-black text-white">{total}</p>
        </div>
        <div className="rounded-2xl border border-[#00C853]/10 bg-[#00C853]/[0.03] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#00C853]">Activados</p>
          <p className="mt-1 text-2xl font-black text-[#00C853]">{enabledCount}</p>
        </div>
        <div className="rounded-2xl border border-[#FF1744]/10 bg-[#FF1744]/[0.03] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#FF1744]">Desactivados</p>
          <p className="mt-1 text-2xl font-black text-[#FF1744]">{disabledCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#00E5FF]/30"
        />
        <div className="flex gap-2">
          {(["all", "trainer", "client"] as RoleFilter[]).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                roleFilter === role
                  ? "bg-[#00E5FF]/10 text-[#00E5FF]"
                  : "text-[#5A5A72] hover:text-white"
              }`}
            >
              {role === "all" ? "Todos" : role === "trainer" ? "Entrenadores" : "Clientes"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="mb-4 h-12 w-12 text-[#5A5A72]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          <p className="text-sm text-[#5A5A72]">No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#12121A]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                  Usuario
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                  Rol
                </th>
                <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                  Menus
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const roleCfg = ROLE_LABELS[user.role] ?? { label: user.role, color: "text-[#8B8BA3]", bg: "bg-[#8B8BA3]/10" };
                const displayName = user.business_name ?? user.full_name ?? "Sin nombre";

                return (
                  <tr key={user.user_id} className="border-b border-white/[0.03] last:border-0 transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{displayName}</p>
                        {user.business_name && user.full_name && user.business_name !== user.full_name && (
                          <p className="text-xs text-[#5A5A72]">{user.full_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${roleCfg.color} ${roleCfg.bg}`}>
                        {roleCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleToggle(user.user_id, user.menus_enabled)}
                          disabled={togglingId === user.user_id}
                          className="group relative h-6 w-11 rounded-full transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: user.menus_enabled ? "#00C853" : "#5A5A72",
                          }}
                          aria-label={user.menus_enabled ? "Desactivar menus" : "Activar menus"}
                        >
                          <span
                            className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                            style={{
                              transform: user.menus_enabled ? "translateX(20px)" : "translateX(0)",
                            }}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-[#8B8BA3] transition-colors hover:text-white disabled:opacity-30"
          >
            Anterior
          </button>
          <span className="text-xs text-[#5A5A72]">
            {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-[#8B8BA3] transition-colors hover:text-white disabled:opacity-30"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminMenusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF]" />
        </div>
      }
    >
      <MenusPageInner />
    </Suspense>
  );
}
