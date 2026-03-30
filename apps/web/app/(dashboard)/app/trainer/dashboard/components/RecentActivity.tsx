"use client";

function IcClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 6v6h4.5"/>
    </svg>
  );
}

export function RecentActivity() {
  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
        <div className="flex items-center gap-2">
          <IcClock />
          <span className="text-[13px] font-semibold text-[#8B8BA3]">Últimas acciones</span>
        </div>
        <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-[#5A5A72]">
          Hoy
        </span>
      </div>

      {/* Empty state */}
      <div className="empty-state">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] text-[#3A3A52]">
          <IcClock />
        </div>
        <p className="text-[13px] text-[#5A5A72]">No hay actividad reciente</p>
        <p className="text-[11px] text-[#3A3A52] text-center max-w-[200px]">
          Las acciones de tus clientes aparecerán aquí
        </p>
      </div>
    </div>
  );
}
