"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  useNutritionPage,
  getMealTotals,
  type FoodItem,
  type MealFood,
} from "./useNutritionPage";

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const CATEGORIES = [
  "Todos",
  "Desayuno",
  "Almuerzo",
  "Comida",
  "Merienda",
  "Cena",
] as const;

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00C853]/20 bg-[#00C853]/10 px-2.5 py-1 text-[10px] font-bold text-[#00C853]">
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold text-[#5A5A72]">
      Inactivo
    </span>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] text-[#3A3A52]">
        {icon}
      </div>
      <p className="text-[14px] font-semibold text-white">{title}</p>
      <p className="text-[12px] text-[#5A5A72] text-center max-w-[200px]">{description}</p>
    </div>
  );
}

/* ────────────────────────────────────────────
   Food Search Combobox (self-contained state)
   ──────────────────────────────────────────── */

function FoodSearchCombobox({
  foods,
  onSelect,
}: {
  foods: FoodItem[];
  onSelect: (food: FoodItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return foods.slice(0, 20);
    const q = query.toLowerCase();
    return foods.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 20);
  }, [foods, query]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Buscar alimento..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="h-9 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 text-[13px] text-white placeholder:text-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl shadow-lg">
          {filtered.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => {
                onSelect(food);
                setQuery("");
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] text-[#E8E8ED] transition-colors hover:bg-white/[0.04]"
            >
              <span className="truncate">{food.name}</span>
              <span className="ml-2 shrink-0 text-[11px] text-[#8B8BA3]">
                {food.kcal} kcal/100g
              </span>
            </button>
          ))}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Menu Creator
   ──────────────────────────────────────────── */

type NutritionHook = ReturnType<typeof useNutritionPage>;

function MenuCreator({ n }: { n: NutritionHook }) {
  const { state, dispatch, selectedClient, addFoodToMeal, handleSendMenu } = n;

  const handleGenerateAI = () => {
    toast.info("Generacion IA disponible proximamente");
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => dispatch({ type: "HIDE_CREATOR" })}
        className="flex items-center gap-2 text-[13px] text-[#8B8BA3] transition-colors hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Volver a menus
      </button>

      <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-white">Nuevo Menu</h2>

      {/* Client selection */}
      <div className="rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Cliente
          </label>
          <select
            value={state.crSelectedClientId}
            onChange={(e) => dispatch({ type: "CR_SET_CLIENT", clientId: e.target.value })}
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none transition-colors focus:border-[#00E5FF]/40"
          >
            <option value="">Seleccionar cliente...</option>
            {state.clients.map((c) => (
              <option key={c.client_id} value={c.client_id}>
                {c.full_name ?? c.email ?? "Sin nombre"}
              </option>
            ))}
          </select>
        </div>

        {/* Client preferences */}
        {selectedClient?.food_preferences && (
          <div className="rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-4 w-4 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <p className="text-[11px] font-bold text-[#00E5FF]">Preferencias alimentarias</p>
            </div>
            <p className="text-[13px] text-[#E8E8ED]">
              {typeof selectedClient.food_preferences === "string"
                ? selectedClient.food_preferences
                : JSON.stringify(selectedClient.food_preferences)}
            </p>
          </div>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Titulo del menu
          </label>
          <input
            type="text"
            value={state.crTitle}
            onChange={(e) => dispatch({ type: "CR_SET_TITLE", title: e.target.value })}
            placeholder="Ej: Menu de definicion - Semana 1"
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
          />
        </div>

        {/* Period */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Periodo
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => dispatch({ type: "CR_SET_PERIOD", period: p })}
                className={`flex items-center justify-center rounded-xl border px-4 py-3 text-[13px] font-medium transition-all ${
                  state.crPeriod === p
                    ? "border-[#00E5FF]/50 bg-[#00E5FF]/10 text-[#00E5FF]"
                    : "border-white/[0.08] bg-white/[0.02] text-[#8B8BA3] hover:border-white/[0.15] hover:text-white"
                }`}
              >
                {p === "weekly" ? "Semanal" : "Mensual"}
              </button>
            ))}
          </div>
        </div>

        {/* Meals per day */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Comidas por dia
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => dispatch({ type: "CR_SET_MEALS_PER_DAY", count: n })}
                className={`flex items-center justify-center rounded-xl border px-4 py-3 text-[13px] font-medium transition-all ${
                  state.crMealsPerDay === n
                    ? "border-[#00E5FF]/50 bg-[#00E5FF]/10 text-[#00E5FF]"
                    : "border-white/[0.08] bg-white/[0.02] text-[#8B8BA3] hover:border-white/[0.15] hover:text-white"
                }`}
              >
                {n} comidas
              </button>
            ))}
          </div>
        </div>

        {/* Target kcal */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">
            Calorias objetivo (kcal/dia)
          </label>
          <input
            type="number"
            value={state.crTargetKcal}
            onChange={(e) => dispatch({ type: "CR_SET_TARGET_KCAL", value: e.target.value ? Number(e.target.value) : "" })}
            placeholder="Auto-calcular segun perfil del cliente"
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none transition-colors focus:border-[#00E5FF]/40"
          />
        </div>
      </div>

      {/* Day planner */}
      <div className="space-y-3">
        <h3 className="text-[16px] font-bold tracking-[-0.02em] text-white">Planificacion por dia</h3>

        {state.crDays.map((day, dayIndex) => (
          <div
            key={dayIndex}
            className="rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl"
          >
            {/* Day header (accordion) */}
            <button
              type="button"
              onClick={() => dispatch({ type: "CR_TOGGLE_DAY", dayIndex })}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-white/[0.04]"
            >
              <span className="text-[13px] font-semibold text-white">{day.day}</span>
              <svg
                className={`h-4 w-4 text-[#8B8BA3] transition-transform ${day.expanded ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Day content */}
            {day.expanded && (
              <div className="border-t border-white/[0.06] px-6 py-4 space-y-5">
                {day.meals.map((meal, mealIndex) => {
                  const totals = getMealTotals(meal.foods);
                  return (
                    <div key={mealIndex} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[13px] font-semibold text-[#00E5FF]">{meal.label}</h4>
                        {meal.foods.length > 0 && (
                          <div className="flex items-center gap-3 text-[11px] text-[#8B8BA3]">
                            <span>{totals.kcal} kcal</span>
                            <span>P: {totals.protein}g</span>
                            <span>C: {totals.carbs}g</span>
                            <span>G: {totals.fat}g</span>
                          </div>
                        )}
                      </div>

                      {/* Food items */}
                      {meal.foods.map((food, foodIndex) => (
                        <div
                          key={foodIndex}
                          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-[13px] text-[#E8E8ED]">{food.name}</p>
                            <p className="text-[11px] text-[#8B8BA3]">
                              {food.kcal} kcal | P: {food.protein}g | C: {food.carbs}g | G: {food.fat}g
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={food.portion_g}
                              onChange={(e) =>
                                dispatch({
                                  type: "CR_UPDATE_PORTION",
                                  dayIndex,
                                  mealIndex,
                                  foodIndex,
                                  portion: Number(e.target.value) || 0,
                                })
                              }
                              className="h-8 w-20 rounded-lg border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl px-2 text-center text-[11px] text-white outline-none focus:border-[#00E5FF]/40"
                            />
                            <span className="text-[11px] text-[#8B8BA3]">g</span>
                            <button
                              type="button"
                              onClick={() => dispatch({ type: "CR_REMOVE_FOOD", dayIndex, mealIndex, foodIndex })}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8B8BA3] transition-colors hover:bg-[#FF1744]/10 hover:text-[#FF1744]"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add food search */}
                      <FoodSearchCombobox
                        foods={state.foods}
                        onSelect={(food) => addFoodToMeal(dayIndex, mealIndex, food)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleGenerateAI}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-5 py-2.5 text-[13px] font-semibold text-[#7C3AED] transition-all hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/20"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
          </svg>
          Generar con IA
        </button>
        <button
          type="button"
          onClick={handleSendMenu}
          disabled={state.crSaving}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#00C853] px-6 py-2.5 text-[13px] font-bold text-[#0A0A0F] transition-all hover:bg-[#00C853]/90 hover:shadow-[0_0_20px_rgba(0,200,83,0.3)] disabled:opacity-50"
        >
          {state.crSaving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
              Enviando...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
              Enviar al cliente
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Food Library Tab
   ──────────────────────────────────────────── */

function FoodLibraryTab({ n }: { n: NutritionHook }) {
  const { state, dispatch, filteredFoods, handleSaveFood, handleDeleteFood } = n;

  return (
    <div className="space-y-5">
      {/* Search & Add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8BA3]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
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
          onClick={() => {
            dispatch({ type: "LIB_RESET_FORM" });
            dispatch({ type: "LIB_SHOW_ADD_FORM" });
          }}
          className="flex items-center gap-2 bg-[#00C853] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#00C853]/90 hover:shadow-[0_0_20px_rgba(0,200,83,0.3)] transition-all"
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
            className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-all ${
              state.libActiveCategory === cat
                ? "bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30"
                : "bg-white/[0.04] text-[#8B8BA3] border border-transparent hover:text-white"
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
            <h3 className="text-[13px] font-semibold text-white">
              {state.libEditingFood ? "Editar alimento" : "Nuevo alimento"}
            </h3>
            <button
              type="button"
              onClick={() => dispatch({ type: "LIB_RESET_FORM" })}
              className="text-[#8B8BA3] transition-colors hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Nombre</label>
              <input
                type="text"
                value={state.libFormName}
                onChange={(e) => dispatch({ type: "LIB_SET_FORM_NAME", value: e.target.value })}
                placeholder="Ej: Pechuga de pollo a la plancha"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Kcal (por 100g)</label>
              <input
                type="number"
                value={state.libFormKcal}
                onChange={(e) => dispatch({ type: "LIB_SET_FORM_KCAL", value: e.target.value ? Number(e.target.value) : "" })}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none focus:border-[#00E5FF]/40 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Proteina (g)</label>
              <input
                type="number"
                value={state.libFormProtein}
                onChange={(e) => dispatch({ type: "LIB_SET_FORM_PROTEIN", value: e.target.value ? Number(e.target.value) : "" })}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none focus:border-[#00E5FF]/40 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Carbohidratos (g)</label>
              <input
                type="number"
                value={state.libFormCarbs}
                onChange={(e) => dispatch({ type: "LIB_SET_FORM_CARBS", value: e.target.value ? Number(e.target.value) : "" })}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none focus:border-[#00E5FF]/40 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Grasa (g)</label>
              <input
                type="number"
                value={state.libFormFat}
                onChange={(e) => dispatch({ type: "LIB_SET_FORM_FAT", value: e.target.value ? Number(e.target.value) : "" })}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none focus:border-[#00E5FF]/40 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Fibra (g)</label>
              <input
                type="number"
                value={state.libFormFiber}
                onChange={(e) => dispatch({ type: "LIB_SET_FORM_FIBER", value: e.target.value ? Number(e.target.value) : "" })}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none focus:border-[#00E5FF]/40 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72]">Categoria</label>
              <select
                value={state.libFormCategory}
                onChange={(e) => dispatch({ type: "LIB_SET_FORM_CATEGORY", value: e.target.value })}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-[13px] text-white outline-none focus:border-[#00E5FF]/40 transition-colors"
              >
                {CATEGORIES.filter((c) => c !== "Todos").map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: "LIB_RESET_FORM" })}
              className="border border-white/[0.1] text-[#8B8BA3] rounded-xl px-5 py-2.5 text-[13px] font-medium hover:border-white/[0.18] hover:bg-white/[0.04] hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveFood}
              disabled={state.libSaving}
              className="flex items-center gap-2 rounded-xl bg-[#00C853] px-5 py-2.5 text-[13px] font-bold text-[#0A0A0F] transition-all hover:bg-[#00C853]/90 disabled:opacity-50"
            >
              {state.libSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0F] border-t-transparent" />
                  Guardando...
                </>
              ) : state.libEditingFood ? (
                "Actualizar"
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Food table */}
      {filteredFoods.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12" />
            </svg>
          }
          title="Sin alimentos"
          description={state.libSearch.trim() ? "No se encontraron alimentos con ese nombre" : "Anade alimentos a tu biblioteca para usarlos en los menus"}
        />
      ) : (
        <div className="overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl">
          {/* Table header */}
          <div className="hidden border-b border-white/[0.06] px-6 py-3 lg:grid lg:grid-cols-12 lg:gap-3">
            <div className="col-span-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Nombre</div>
            <div className="col-span-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Kcal</div>
            <div className="col-span-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Prot.</div>
            <div className="col-span-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Carbs</div>
            <div className="col-span-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Grasa</div>
            <div className="col-span-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Fibra</div>
            <div className="col-span-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Cat.</div>
            <div className="col-span-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Tipo</div>
            <div className="col-span-2" />
          </div>

          {/* Rows */}
          {filteredFoods.map((food) => {
            const isOwn = food.trainer_id === state.trainerId;
            return (
              <div
                key={food.id}
                className="border-b border-white/[0.04] px-6 py-3.5 last:border-b-0 hover:bg-white/[0.025] transition-colors lg:grid lg:grid-cols-12 lg:items-center lg:gap-3"
              >
                <div className="col-span-3">
                  <p className="text-[13px] font-medium text-white truncate">{food.name}</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[13px] text-[#E8E8ED]">{food.kcal}</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[13px] text-[#E8E8ED]">{food.protein}g</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[13px] text-[#E8E8ED]">{food.carbs}g</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[13px] text-[#E8E8ED]">{food.fat}g</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[13px] text-[#E8E8ED]">{food.fiber}g</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[11px] text-[#8B8BA3]">{food.category}</p>
                </div>
                <div className="col-span-1">
                  {isOwn ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7C3AED]/20 bg-[#7C3AED]/10 px-2.5 py-1 text-[10px] font-bold text-[#7C3AED]">
                      Propio
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/10 px-2.5 py-1 text-[10px] font-bold text-[#00E5FF]">
                      Global
                    </span>
                  )}
                </div>
                <div className="col-span-2 flex justify-end gap-2 mt-2 lg:mt-0">
                  {isOwn && (
                    <>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "LIB_START_EDIT", food })}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B8BA3] transition-colors hover:bg-white/[0.06] hover:text-white"
                        title="Editar"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFood(food.id)}
                        disabled={state.libDeleting === food.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B8BA3] transition-colors hover:bg-[#FF1744]/10 hover:text-[#FF1744] disabled:opacity-50"
                        title="Eliminar"
                      >
                        {state.libDeleting === food.id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#FF1744] border-t-transparent" />
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        )}
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
        <div className="rounded-xl border border-[#FF1744]/20 bg-[#FF1744]/05 px-4 py-3">
          <p className="text-[13px] text-[#FF1744]">{state.error}</p>
        </div>
      </div>
    );
  }

  if (state.showCreator) {
    return <MenuCreator n={n} />;
  }

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
              Salud & Alimentacion
            </p>
            <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-white">Nutricion</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="pg-in pg-2 flex gap-1 rounded-[14px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-1">
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_TAB", tab: "menus" })}
            className={`flex-1 flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition-all ${
              state.activeTab === "menus"
                ? "bg-[#00C853]/10 text-[#00C853]"
                : "text-[#8B8BA3] hover:text-white"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12" />
            </svg>
            Menus
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_TAB", tab: "biblioteca" })}
            className={`flex-1 flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition-all ${
              state.activeTab === "biblioteca"
                ? "bg-[#7C3AED]/10 text-[#7C3AED]"
                : "text-[#8B8BA3] hover:text-white"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            Mi Biblioteca de Alimentos
          </button>
        </div>

        {/* Tab content */}
        {state.activeTab === "menus" && (
          <div className="pg-in pg-3 space-y-5">
            {/* New menu button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => dispatch({ type: "SHOW_CREATOR" })}
                className="flex items-center gap-2 bg-[#00C853] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#00C853]/90 hover:shadow-[0_0_20px_rgba(0,200,83,0.3)] transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nuevo menu
              </button>
            </div>

            {/* Meal plans list */}
            {state.mealPlans.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53 0L12 2.845l.265.265Z" />
                  </svg>
                }
                title="Aun no tienes menus creados"
                description="Crea tu primer menu nutricional para tus clientes"
              />
            ) : (
              <div className="relative overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl">
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #00C853, transparent)" }} />
                <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-[#00C853] opacity-[0.04] blur-[40px]" />

                {/* Table header */}
                <div className="hidden border-b border-white/[0.06] px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
                  <div className="col-span-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Titulo</div>
                  <div className="col-span-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Cliente</div>
                  <div className="col-span-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Periodo</div>
                  <div className="col-span-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Kcal</div>
                  <div className="col-span-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Estado</div>
                  <div className="col-span-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A5A72]">Enviado</div>
                  <div className="col-span-1" />
                </div>

                {state.mealPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="border-b border-white/[0.04] px-6 py-4 last:border-b-0 hover:bg-white/[0.025] transition-colors sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                  >
                    <div className="col-span-3">
                      <p className="text-[13px] font-medium text-white truncate">{plan.title}</p>
                    </div>
                    <div className="col-span-2 mt-1 sm:mt-0">
                      <p className="text-[13px] text-[#8B8BA3] truncate">{plan.client_name ?? "Sin cliente"}</p>
                    </div>
                    <div className="col-span-2 mt-1 sm:mt-0">
                      <p className="text-[13px] text-[#8B8BA3]">
                        {plan.period === "weekly" ? "Semanal" : plan.period === "monthly" ? "Mensual" : plan.period}
                      </p>
                    </div>
                    <div className="col-span-1 mt-1 sm:mt-0">
                      <p className="text-[13px] text-[#8B8BA3]">{plan.target_kcal ?? "—"}</p>
                    </div>
                    <div className="col-span-1 mt-1 sm:mt-0">
                      <ActiveBadge active={plan.is_active} />
                    </div>
                    <div className="col-span-2 mt-1 sm:mt-0">
                      <p className="text-[13px] text-[#5A5A72]">
                        {plan.sent_at ? formatDate(plan.sent_at) : "No enviado"}
                      </p>
                    </div>
                    <div className="col-span-1" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {state.activeTab === "biblioteca" && (
          <div className="pg-in pg-3">
            <FoodLibraryTab n={n} />
          </div>
        )}
      </div>
    </>
  );
}
