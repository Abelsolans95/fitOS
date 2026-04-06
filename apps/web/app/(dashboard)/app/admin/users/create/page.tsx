"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface TrainerOption {
  user_id: string;
  full_name: string;
  business_name?: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Form state
  const [role, setRole] = useState<"trainer" | "client" | "admin">("trainer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [trainerId, setTrainerId] = useState("");

  // Trainer list for client assignment
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);

  useEffect(() => {
    if (role === "client") {
      setLoadingTrainers(true);
      fetch("/api/admin/users?role=trainer&limit=100")
        .then((r) => r.json())
        .then((data) => {
          setTrainers(
            (data.users ?? []).map((u: TrainerOption) => ({
              user_id: u.user_id,
              full_name: u.full_name,
              business_name: u.business_name,
            }))
          );
        })
        .catch(() => toast.error("Error al cargar entrenadores"))
        .finally(() => setLoadingTrainers(false));
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    if (role === "client" && !trainerId) {
      toast.error("Selecciona un entrenador para el cliente");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          trainer_id: role === "client" ? trainerId : undefined,
          business_name: role === "trainer" ? businessName.trim() || undefined : undefined,
          specialty: role === "trainer" ? specialty.trim() || undefined : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al crear usuario");
        setSaving(false);
        return;
      }

      toast.success(`${role === "trainer" ? "Entrenador" : role === "client" ? "Cliente" : "Admin"} creado correctamente`);
      router.push(`/app/admin/users/${data.user_id}`);
    } catch {
      toast.error("Error inesperado");
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#5A5A72] transition-colors hover:text-white"
        >
          ← Volver
        </button>
        <h1 className="text-2xl font-black tracking-tight text-white">Crear usuario</h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">
          Crea un nuevo entrenador, cliente o administrador
        </p>
      </div>

      {/* Role selector */}
      <div className="flex gap-2">
        {(["trainer", "client", "admin"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 rounded-xl py-3 text-sm font-bold uppercase tracking-wider transition-all ${
              role === r
                ? r === "trainer"
                  ? "bg-[#7C3AED] text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                  : r === "client"
                  ? "bg-[#00E5FF] text-[#0A0A0F] shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                  : "bg-[#FF9100] text-[#0A0A0F] shadow-[0_0_20px_rgba(255,145,0,0.3)]"
                : "border border-white/[0.06] bg-[#12121A] text-[#8B8BA3] hover:text-white"
            }`}
          >
            {r === "trainer" ? "Entrenador" : r === "client" ? "Cliente" : "Admin"}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              Nombre completo *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
              required
              className="w-full rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#7C3AED]/50"
              placeholder="Nombre y apellidos"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#7C3AED]/50"
              placeholder="email@ejemplo.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
              Contraseña *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              className="w-full rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#7C3AED]/50"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {/* Trainer-specific fields */}
          {role === "trainer" && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                  Nombre del negocio
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#7C3AED]/50"
                  placeholder="Ej: FitStudio Madrid"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                  Especialidad
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-2.5 text-sm text-white placeholder-[#5A5A72] outline-none focus:border-[#7C3AED]/50"
                  placeholder="Ej: Hipertrofia, Pérdida de peso"
                />
              </div>
            </>
          )}

          {/* Client: trainer assignment */}
          {role === "client" && (
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">
                Entrenador asignado *
              </label>
              {loadingTrainers ? (
                <div className="flex h-10 items-center text-xs text-[#5A5A72]">Cargando entrenadores...</div>
              ) : (
                <select
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-2.5 text-sm text-white outline-none focus:border-[#7C3AED]/50"
                >
                  <option value="">Seleccionar entrenador...</option>
                  {trainers.map((t) => (
                    <option key={t.user_id} value={t.user_id}>
                      {t.full_name}{t.business_name ? ` (${t.business_name})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-[#7C3AED] py-3 text-sm font-bold text-white transition-all hover:bg-[#7C3AED]/80 disabled:opacity-50"
        >
          {saving ? "Creando..." : `Crear ${role === "trainer" ? "entrenador" : role === "client" ? "cliente" : "administrador"}`}
        </button>
      </form>
    </div>
  );
}
