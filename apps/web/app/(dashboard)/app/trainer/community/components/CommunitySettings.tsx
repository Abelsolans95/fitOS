"use client";

interface CommunitySettingsProps {
  name: string;
  description: string;
  mode: "OPEN" | "READ_ONLY_CLIENTS";
  isActive: boolean;
  saving: boolean;
  onSetName: (v: string) => void;
  onSetDescription: (v: string) => void;
  onSetMode: (v: "OPEN" | "READ_ONLY_CLIENTS") => void;
  onSetActive: (v: boolean) => void;
  onSave: () => void;
}

export function CommunitySettings({
  name,
  description,
  mode,
  isActive,
  saving,
  onSetName,
  onSetDescription,
  onSetMode,
  onSetActive,
  onSave,
}: CommunitySettingsProps) {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Community info */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#8B8BA3]">Informacion de la comunidad</h3>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#8B8BA3]">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onSetName(e.target.value)}
            placeholder="Mi Comunidad"
            className="w-full rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-3 text-sm text-white placeholder-[#5A5A72] focus:border-[#00E5FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#8B8BA3]">Descripcion</label>
          <textarea
            value={description}
            onChange={(e) => onSetDescription(e.target.value)}
            placeholder="Descripcion para tus clientes..."
            rows={3}
            className="w-full resize-none rounded-xl border border-white/[0.06] bg-[#0A0A0F] px-4 py-3 text-sm text-white placeholder-[#5A5A72] focus:border-[#00E5FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/20"
          />
        </div>
      </div>

      {/* Privacy mode */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#8B8BA3]">Privacidad y permisos</h3>

        {/* Mode switch */}
        <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-4">
          <div>
            <p className="text-sm font-semibold text-white">Permitir publicaciones de clientes</p>
            <p className="mt-1 text-xs text-[#5A5A72]">
              Si se desactiva, los clientes solo podran interactuar con tus publicaciones
            </p>
          </div>
          <button
            onClick={() => onSetMode(mode === "OPEN" ? "READ_ONLY_CLIENTS" : "OPEN")}
            className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
              mode === "OPEN" ? "bg-[#00E5FF]" : "bg-[#5A5A72]/40"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                mode === "OPEN" ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
          <p className="text-xs text-[#8B8BA3]">
            {mode === "OPEN" ? (
              <>
                <span className="font-semibold text-[#00E5FF]">Modo abierto:</span> Los clientes pueden publicar contenido, comentar y dar likes.
              </>
            ) : (
              <>
                <span className="font-semibold text-[#FF9100]">Solo coach publica:</span> Los clientes solo pueden comentar y dar likes en tus publicaciones.
              </>
            )}
          </p>
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-4">
          <div>
            <p className="text-sm font-semibold text-white">Comunidad activa</p>
            <p className="mt-1 text-xs text-[#5A5A72]">
              Desactivar oculta la comunidad para los clientes
            </p>
          </div>
          <button
            onClick={() => onSetActive(!isActive)}
            className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
              isActive ? "bg-[#00C853]" : "bg-[#5A5A72]/40"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                isActive ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full rounded-xl bg-[#00E5FF] py-3 text-sm font-bold text-[#0A0A0F] transition-all hover:bg-[#00E5FF]/90 disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar ajustes"}
      </button>
    </div>
  );
}
