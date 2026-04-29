"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface UserDetail {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  business_name?: string;
  specialty?: string;
  bio?: string;
  gender?: string;
  height?: number;
  weight?: number;
  food_preferences?: string;
  goal?: string;
  created_at: string;
  // Trainer fields
  active_clients_count?: number;
  total_clients?: number;
  routines_count?: number;
  meal_plans_count?: number;
  articles_count?: number;
  clients?: { client_id: string; status: string; joined_at: string }[];
  promo_codes?: { id: string; code: string; is_active: boolean; max_uses: number; current_uses: number; expires_at?: string }[];
  // Client fields
  trainer_id?: string;
  trainer_name?: string;
  trainer_client_status?: string;
  joined_at?: string;
  completed_sessions?: number;
  tickets_count?: number;
}

const ROLE_COLORS: Record<string, string> = {
  trainer: "#7C3AED",
  client: "#00E5FF",
  admin: "#FF9100",
};

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editBusiness, setEditBusiness] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editBio, setEditBio] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setUser(data);
        setEditName(data.full_name || "");
        setEditBusiness(data.business_name || "");
        setEditSpecialty(data.specialty || "");
        setEditBio(data.bio || "");
      })
      .catch(() => toast.error("Usuario no encontrado"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editName.trim(),
          business_name: editBusiness.trim() || undefined,
          specialty: editSpecialty.trim() || undefined,
          bio: editBio.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al guardar");
        setSaving(false);
        return;
      }

      toast.success("Usuario actualizado");
      setEditing(false);
      // Refresh data
      const fresh = await fetch(`/api/admin/users/${id}`).then((r) => r.json());
      setUser(fresh);
    } catch {
      toast.error("Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <p className="text-[#8B8BA3]">Usuario no encontrado</p>
        <Link href="/app/admin/users" className="text-sm text-[#7C3AED] hover:underline">
          Volver a usuarios
        </Link>
      </div>
    );
  }

  const accentColor = ROLE_COLORS[user.role] ?? "#8B8BA3";

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-xs font-semibold uppercase tracking-[0.15em] text-[#5A5A72] transition-colors hover:text-white"
      >
        ← Volver
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black"
            style={{ backgroundColor: accentColor + "15", color: accentColor }}
          >
            {(user.full_name || "?")[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">{user.full_name}</h1>
            <p className="text-sm text-[#8B8BA3]">{user.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
                style={{ color: accentColor, backgroundColor: accentColor + "15" }}
              >
                {user.role === "trainer" ? "Entrenador" : user.role === "client" ? "Cliente" : "Admin"}
              </span>
              {user.trainer_client_status && (
                <span className={`text-xs font-semibold ${
                  user.trainer_client_status === "active" ? "text-[#00C853]" :
                  user.trainer_client_status === "pending" ? "text-[#FF9100]" :
                  "text-[#8B8BA3]"
                }`}>
                  {user.trainer_client_status === "active" ? "Activo" :
                   user.trainer_client_status === "pending" ? "Pendiente" :
                   user.trainer_client_status}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setEditing(!editing)}
          className="rounded-xl border border-white/10 bg-[#12121A] px-4 py-2 text-xs font-semibold text-[#8B8BA3] transition-colors hover:text-white"
        >
          {editing ? "Cancelar" : "Editar"}
        </button>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="rounded-2xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[#7C3AED]">Editar perfil</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[#5A5A72]">Nombre</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={100}
                className="w-full rounded-xl border border-white/10 bg-[#0A0A0F] px-3 py-2 text-sm text-white outline-none focus:border-[#7C3AED]/50"
              />
            </div>
            {user.role === "trainer" && (
              <>
                <div>
                  <label className="mb-1 block text-xs text-[#5A5A72]">Negocio</label>
                  <input
                    type="text"
                    value={editBusiness}
                    onChange={(e) => setEditBusiness(e.target.value)}
                    maxLength={100}
                    className="w-full rounded-xl border border-white/10 bg-[#0A0A0F] px-3 py-2 text-sm text-white outline-none focus:border-[#7C3AED]/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#5A5A72]">Especialidad</label>
                  <input
                    type="text"
                    value={editSpecialty}
                    onChange={(e) => setEditSpecialty(e.target.value)}
                    maxLength={100}
                    className="w-full rounded-xl border border-white/10 bg-[#0A0A0F] px-3 py-2 text-sm text-white outline-none focus:border-[#7C3AED]/50"
                  />
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-[#5A5A72]">Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-[#0A0A0F] px-3 py-2 text-sm text-white outline-none focus:border-[#7C3AED]/50 resize-none"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-[#7C3AED] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7C3AED]/80 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Profile Info */}
        <div className="rounded-2xl border border-white/10 bg-[#12121A] p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Información</h3>
          <InfoRow label="Registrado" value={new Date(user.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })} />
          {user.gender && <InfoRow label="Género" value={user.gender === "male" ? "Masculino" : "Femenino"} />}
          {user.height && <InfoRow label="Altura" value={`${user.height} cm`} />}
          {user.weight && <InfoRow label="Peso" value={`${user.weight} kg`} />}
          {user.goal && <InfoRow label="Objetivo" value={user.goal} />}
          {user.business_name && <InfoRow label="Negocio" value={user.business_name} />}
          {user.specialty && <InfoRow label="Especialidad" value={user.specialty} />}
          {user.bio && <InfoRow label="Bio" value={user.bio} />}
        </div>

        {/* Stats */}
        <div className="rounded-2xl border border-white/10 bg-[#12121A] p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Estadísticas</h3>

          {user.role === "trainer" && (
            <>
              <InfoRow label="Clientes activos" value={String(user.active_clients_count ?? 0)} accent="#00C853" />
              <InfoRow label="Clientes totales" value={String(user.total_clients ?? 0)} />
              <InfoRow label="Rutinas creadas" value={String(user.routines_count ?? 0)} />
              <InfoRow label="Menús creados" value={String(user.meal_plans_count ?? 0)} />
              <InfoRow label="Artículos publicados" value={String(user.articles_count ?? 0)} />
            </>
          )}

          {user.role === "client" && (
            <>
              <InfoRow label="Entrenador" value={user.trainer_name ?? "Sin asignar"} accent="#7C3AED" />
              {user.joined_at && <InfoRow label="Fecha de unión" value={new Date(user.joined_at).toLocaleDateString("es-ES")} />}
              <InfoRow label="Sesiones completadas" value={String(user.completed_sessions ?? 0)} accent="#00C853" />
              <InfoRow label="Tickets" value={String(user.tickets_count ?? 0)} />
            </>
          )}

          {user.role === "admin" && (
            <p className="text-sm text-[#5A5A72]">Administrador del sistema</p>
          )}
        </div>
      </div>

      {/* Promo Codes (Trainer) */}
      {user.role === "trainer" && user.promo_codes && user.promo_codes.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#12121A] p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Códigos Promocionales</h3>
          <div className="space-y-2">
            {user.promo_codes.map((pc) => (
              <div key={pc.id} className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#0A0A0F] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-[#7C3AED]">{pc.code}</span>
                  <span className={`text-xs ${pc.is_active ? "text-[#00C853]" : "text-[#FF1744]"}`}>
                    {pc.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <span className="text-xs text-[#5A5A72]">
                  {pc.current_uses}{pc.max_uses ? `/${pc.max_uses}` : ""} usos
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client list (Trainer) */}
      {user.role === "trainer" && user.clients && user.clients.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#12121A] p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
            Clientes ({user.clients.length})
          </h3>
          <div className="space-y-1">
            {user.clients.map((c) => (
              <Link
                key={c.client_id}
                href={`/app/admin/users/${c.client_id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.03]"
              >
                <span className="text-sm text-white font-mono">{c.client_id.substring(0, 8)}...</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${
                    c.status === "active" ? "text-[#00C853]" : "text-[#8B8BA3]"
                  }`}>
                    {c.status}
                  </span>
                  <span className="text-xs text-[#5A5A72]">
                    {new Date(c.joined_at).toLocaleDateString("es-ES")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-[#5A5A72]">{label}</span>
      <span className="text-sm font-semibold" style={{ color: accent ?? "#E8E8ED" }}>
        {value}
      </span>
    </div>
  );
}
