"use client";

import { useNutritionPage } from "./useNutritionPage";
import { EmptyState } from "./components/EmptyState";
import { FoodLibraryTab } from "./components/FoodLibraryTab";
import { MenuCreator } from "./components/MenuCreator";

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/* ────────────────────────────────────────────
   Main Page
   ──────────────────────────────────────────── */

export default function TrainerNutritionPage() {
  const n = useNutritionPage();
  const { state, dispatch } = n;

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="rounded-xl border border-[#FF1744]/20 px-4 py-3">
          <p className="text-[13px] text-[#FF1744]">{state.error}</p>
        </div>
      </div>
    );
  }

  if (state.showCreator) return <MenuCreator n={n} />;

  return (
    <>
      <style>{`
        @keyframes pg-in { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .pg-in { animation: pg-in 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .pg-1 { animation-delay: 0.04s; } .pg-2 { animation-delay: 0.14s; }
        .pg-3 { animation-delay: 0.24s; } .pg-4 { animation-delay: 0.34s; }
      `}</style>
      <div className="space-y-6">
        <div className="pg-in pg-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72] mb-1">Salud & Alimentacion</p>
          <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-white">Nutricion</h1>
        </div>

        {/* Tabs */}
        <div className="pg-in pg-2 flex gap-1 rounded-[14px] border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-1">
          {(["menus", "biblioteca"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => dispatch({ type: "SET_TAB", tab })}
              className={`flex-1 flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition-all ${state.activeTab === tab
                  ? tab === "menus" ? "bg-[#00C853]/10 text-[#00C853]" : "bg-[#7C3AED]/10 text-[#7C3AED]"
                  : "text-[#8B8BA3] hover:text-white"
                }`}
            >
              {tab === "menus" ? (
                <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12" /></svg>Menus</>
              ) : (
                <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>Mi Biblioteca de Alimentos</>
              )}
            </button>
          ))}
        </div>

        {state.activeTab === "menus" && (
          <div className="pg-in pg-3 space-y-5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => dispatch({ type: "SHOW_CREATOR" })}
                className="flex items-center gap-2 rounded-xl bg-[#00C853] px-5 py-2.5 text-[13px] font-bold text-[#0A0A0F] transition-all hover:bg-[#00C853]/90 hover:shadow-[0_0_20px_rgba(0,200,83,0.3)]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Nuevo menu
              </button>
            </div>

            {state.savedMenus.length === 0 ? (
              <EmptyState
                icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53 0L12 2.845l.265.265Z" /></svg>}
                title="Aun no tienes menus guardados"
                description="Crea un menu y guardalo con el botón 'Guardar menu'"
              />
            ) : (
              <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl">
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #00C853, transparent)" }} />
                <div className="hidden border-b border-white/10 px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
                  {["Nombre", "Dias", "Semanas", "Kcal obj.", "Creado"].map((h, i) => (
                    <div key={h} className={`col-span-${[4, 3, 2, 2, 1][i]} text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]`}>{h}</div>
                  ))}
                </div>
                {state.savedMenus.map((menu) => (
                  <div key={menu.id} className="border-b border-white/[0.04] px-6 py-4 last:border-b-0 hover:bg-white/[0.025] transition-colors sm:grid sm:grid-cols-12 sm:items-center sm:gap-4">
                    <div className="col-span-4"><p className="truncate text-[13px] font-medium text-white">{menu.name}</p></div>
                    <div className="col-span-3 mt-1 sm:mt-0"><p className="text-[13px] text-[#8B8BA3]">{(menu.config.selectedDays ?? []).length} días</p></div>
                    <div className="col-span-2 mt-1 sm:mt-0"><p className="text-[13px] text-[#8B8BA3]">{menu.config.mesocycleWeeks ?? 1} sem.</p></div>
                    <div className="col-span-2 mt-1 sm:mt-0"><p className="text-[13px] text-[#8B8BA3]">{menu.config.targetKcal ? `${menu.config.targetKcal} kcal` : "—"}</p></div>
                    <div className="col-span-1 mt-1 sm:mt-0"><p className="text-[13px] text-[#5A5A72]">{formatDate(menu.created_at)}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {state.activeTab === "biblioteca" && (
          <div className="pg-in pg-3"><FoodLibraryTab n={n} /></div>
        )}
      </div>
    </>
  );
}
