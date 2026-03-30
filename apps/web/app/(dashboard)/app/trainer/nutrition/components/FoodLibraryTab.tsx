"use client";

import type { useNutritionPage } from "../useNutritionPage";
import { DarkSelect } from "@/components/ui/DarkSelect";
import { EmptyState } from "./EmptyState";

const CATEGORIES = ["Todos", "Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"] as const;

type NutritionHook = ReturnType<typeof useNutritionPage>;

export function FoodLibraryTab({ n }: { n: NutritionHook }) {
  const { state, dispatch, filteredFoods, handleSaveFood, handleDeleteFood } = n;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8BA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar alimento..."
            value={state.libSearch}
            onChange={(e) => dispatch({ type: "LIB_SET_SEARCH", search: e.target.value })}
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl pl-10 pr-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
          />
        </div>
        <button
          type="button"
          onClick={() => { dispatch({ type: "LIB_RESET_FORM" }); dispatch({ type: "LIB_SHOW_ADD_FORM" }); }}
          className="flex items-center gap-2 rounded-xl bg-[#00C853] px-5 py-2.5 text-[13px] font-bold text-[#0A0A0F] transition-all hover:bg-[#00C853]/90 hover:shadow-[0_0_20px_rgba(0,200,83,0.3)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Anadir alimento
        </button>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => dispatch({ type: "LIB_SET_CATEGORY", category: cat })}
            className={`rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-all ${
              state.libActiveCategory === cat
                ? "border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF]"
                : "border-transparent bg-white/[0.04] text-[#8B8BA3] hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add/Edit form */}
      {state.libShowForm && (
        <div className="relative overflow-hidden rounded-[18px] border border-[#00C853]/20 bg-[#00C853]/5 p-6 space-y-4">
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #00C853, transparent)" }} />
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-white">{state.libEditingFood ? "Editar alimento" : "Nuevo alimento"}</h3>
            <button type="button" onClick={() => dispatch({ type: "LIB_RESET_FORM" })} className="text-[#8B8BA3] hover:text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Nombre</label>
              <input type="text" value={state.libFormName} onChange={(e) => dispatch({ type: "LIB_SET_FORM_NAME", value: e.target.value })} placeholder="Ej: Pechuga de pollo a la plancha" className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors" />
            </div>
            {([
              ["Kcal (por 100g)", state.libFormKcal, "LIB_SET_FORM_KCAL"],
              ["Proteina (g)", state.libFormProtein, "LIB_SET_FORM_PROTEIN"],
              ["Carbohidratos (g)", state.libFormCarbs, "LIB_SET_FORM_CARBS"],
              ["Grasa (g)", state.libFormFat, "LIB_SET_FORM_FAT"],
              ["Fibra (g)", state.libFormFiber, "LIB_SET_FORM_FIBER"],
            ] as [string, number | "", string][]).map(([lbl, val, act]) => (
              <div key={act} className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">{lbl}</label>
                <input type="number" value={val} onChange={(e) => dispatch({ type: act as never, value: e.target.value ? Number(e.target.value) : "" })} className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none focus:border-[#00E5FF]/40 transition-colors" />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Categoria</label>
              <DarkSelect
                value={state.libFormCategory}
                onChange={(val) => dispatch({ type: "LIB_SET_FORM_CATEGORY", value: val })}
                options={CATEGORIES.filter((c) => c !== "Todos").map((cat) => ({ value: cat, label: cat }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => dispatch({ type: "LIB_RESET_FORM" })} className="rounded-xl border border-white/[0.1] px-5 py-2.5 text-[13px] font-medium text-[#8B8BA3] hover:border-white/[0.18] hover:text-white transition-all">Cancelar</button>
            <button type="button" onClick={handleSaveFood} disabled={state.libSaving} className="flex items-center gap-2 rounded-xl bg-[#00C853] px-5 py-2.5 text-[13px] font-bold text-[#0A0A0F] hover:bg-[#00C853]/90 disabled:opacity-50 transition-all">
              {state.libSaving ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />Guardando...</> : state.libEditingFood ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* Food table */}
      {filteredFoods.length === 0 ? (
        <EmptyState
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12" /></svg>}
          title="Sin alimentos"
          description={state.libSearch.trim() ? "No se encontraron alimentos" : "Añade alimentos a tu biblioteca"}
        />
      ) : (
        <div className="overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl">
          <div className="hidden border-b border-white/[0.06] px-6 py-3 lg:grid lg:grid-cols-12 lg:gap-3">
            {["Nombre", "Kcal", "Prot.", "Carbs", "Grasa", "Fibra", "Cat.", "Tipo"].map((h, i) => (
              <div key={h} className={`${i === 0 ? "col-span-3" : "col-span-1"} text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]`}>{h}</div>
            ))}
            <div className="col-span-2" />
          </div>
          {filteredFoods.map((food) => {
            const isOwn = food.trainer_id === state.trainerId;
            return (
              <div key={food.id} className="border-b border-white/[0.04] px-6 py-3.5 last:border-b-0 hover:bg-white/[0.025] transition-colors lg:grid lg:grid-cols-12 lg:items-center lg:gap-3">
                <div className="col-span-3"><p className="truncate text-[13px] font-medium text-white">{food.name}</p></div>
                <div className="col-span-1"><p className="text-[13px] text-[#E8E8ED]">{food.kcal}</p></div>
                <div className="col-span-1"><p className="text-[13px] text-[#E8E8ED]">{food.protein}g</p></div>
                <div className="col-span-1"><p className="text-[13px] text-[#E8E8ED]">{food.carbs}g</p></div>
                <div className="col-span-1"><p className="text-[13px] text-[#E8E8ED]">{food.fat}g</p></div>
                <div className="col-span-1"><p className="text-[13px] text-[#E8E8ED]">{food.fiber}g</p></div>
                <div className="col-span-1"><p className="text-[11px] text-[#8B8BA3]">{food.category}</p></div>
                <div className="col-span-1">
                  {isOwn
                    ? <span className="inline-flex rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-2.5 py-1 text-[10px] font-bold text-[#7C3AED]">Propio</span>
                    : <span className="inline-flex rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/10 px-2.5 py-1 text-[10px] font-bold text-[#00E5FF]">Global</span>
                  }
                </div>
                <div className="col-span-2 flex justify-end gap-2 mt-2 lg:mt-0">
                  {isOwn && (
                    <>
                      <button type="button" onClick={() => dispatch({ type: "LIB_START_EDIT", food })} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B8BA3] hover:bg-white/[0.06] hover:text-white transition-colors">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                      </button>
                      <button type="button" onClick={() => handleDeleteFood(food.id)} disabled={state.libDeleting === food.id} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B8BA3] hover:bg-[#FF1744]/10 hover:text-[#FF1744] disabled:opacity-50 transition-colors">
                        {state.libDeleting === food.id
                          ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#FF1744] border-t-transparent" />
                          : <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                        }
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
