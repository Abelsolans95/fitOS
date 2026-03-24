"use client";

import { type RoutineRow, formatDate } from "../types";

/* ── ActiveBadge ── */

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00C853]/20 bg-[#00C853]/10 px-2.5 py-1 text-[10px] font-bold text-[#00C853]">
      Activa
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold text-[#5A5A72]">
      Inactiva
    </span>
  );
}

/* ── RoutineList ── */

interface RoutineListProps {
  routines: RoutineRow[];
  onNewRoutine: () => void;
}

export default function RoutineList({ routines, onNewRoutine }: RoutineListProps) {
  return (
    <>
      <style>{`
        @keyframes pg-in { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .pg-in { animation: pg-in 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .pg-1 { animation-delay: 0.04s; }
        .pg-2 { animation-delay: 0.14s; }
        .pg-3 { animation-delay: 0.24s; }
        .pg-4 { animation-delay: 0.34s; }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="pg-in pg-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72] mb-1">
              Entrenamiento
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-white">Rutinas</h1>
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#00E5FF]/10 px-2 text-[11px] font-bold text-[#00E5FF]">
                {routines.length}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onNewRoutine}
            className="flex items-center gap-2 bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Nuevo mesociclo
          </button>
        </div>

        {/* Routines list */}
        <div className="pg-in pg-2">
          {routines.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] text-[#3A3A52]">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  />
                </svg>
              </div>
              <p className="text-[14px] font-semibold text-white">
                Aún no tienes rutinas creadas
              </p>
              <p className="text-[12px] text-[#5A5A72] text-center max-w-[200px]">
                Crea tu primer mesociclo de entrenamiento
              </p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl">
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #00E5FF, transparent)" }} />
              <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-[#00E5FF] opacity-[0.04] blur-[40px]" />

              {/* Table header */}
              <div className="hidden border-b border-white/[0.06] px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
                <div className="col-span-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Título
                </div>
                <div className="col-span-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Cliente
                </div>
                <div className="col-span-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Objetivo
                </div>
                <div className="col-span-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Meses
                </div>
                <div className="col-span-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Estado
                </div>
                <div className="col-span-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">
                  Enviado
                </div>
                <div className="col-span-1" />
              </div>

              {routines.map((routine) => (
                <div
                  key={routine.id}
                  className="border-b border-white/[0.04] px-6 py-4 last:border-b-0 hover:bg-white/[0.025] transition-colors sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                >
                  <div className="col-span-3">
                    <p className="truncate text-[13px] font-medium text-white">
                      {routine.title}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:mt-0">
                    <p className="truncate text-[13px] text-[#8B8BA3]">
                      {routine.client_name ?? "Sin cliente"}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:mt-0">
                    <p className="text-[13px] text-[#8B8BA3]">
                      {routine.goal === "fuerza"
                        ? "Fuerza"
                        : routine.goal === "hipertrofia"
                        ? "Hipertrofia"
                        : routine.goal ?? "—"}
                    </p>
                  </div>
                  <div className="col-span-1 mt-1 sm:mt-0">
                    <p className="text-[13px] text-[#8B8BA3]">
                      {routine.duration_months ?? "—"}
                    </p>
                  </div>
                  <div className="col-span-1 mt-1 sm:mt-0">
                    <ActiveBadge active={routine.is_active} />
                  </div>
                  <div className="col-span-2 mt-1 sm:mt-0">
                    <p className="text-[13px] text-[#5A5A72]">
                      {routine.sent_at ? formatDate(routine.sent_at) : "No enviada"}
                    </p>
                  </div>
                  <div className="col-span-1" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
