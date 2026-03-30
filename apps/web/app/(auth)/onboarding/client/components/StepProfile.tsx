"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "./Shared";
import { GOAL_OPTIONS, DIETARY_RESTRICTIONS } from "./types";
import type { GoalValue } from "./types";

interface StepProfileProps {
  height: string;
  setHeight: (v: string) => void;
  weight: string;
  setWeight: (v: string) => void;
  goal: GoalValue | "";
  setGoal: (v: GoalValue) => void;
  dietaryRestrictions: string[];
  setDietaryRestrictions: (v: string[]) => void;
  allergies: string;
  setAllergies: (v: string) => void;
  dislikedFoods: string;
  setDislikedFoods: (v: string) => void;
  step2Errors: Record<string, string>;
  setStep2Errors: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  pageError: string | null;
  submitting: boolean;
  onBack: () => void;
  onComplete: () => void;
}

export function StepProfile({
  height,
  setHeight,
  weight,
  setWeight,
  goal,
  setGoal,
  dietaryRestrictions,
  setDietaryRestrictions,
  allergies,
  setAllergies,
  dislikedFoods,
  setDislikedFoods,
  step2Errors,
  setStep2Errors,
  pageError,
  submitting,
  onBack,
  onComplete,
}: StepProfileProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">
          Datos fisicos y preferencias
        </h2>
        <p className="mt-1 text-xs text-[#8B8BA3]">
          Esta informacion nos ayuda a personalizar tus planes.
        </p>
      </div>

      {/* Height & Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height" className="text-[#8B8BA3]">
            Altura (cm) <span className="text-[#FF1744]">*</span>
          </Label>
          <Input
            id="height"
            type="number"
            placeholder="170"
            min={1}
            max={300}
            value={height}
            onChange={(e) => {
              setHeight(e.target.value);
              if (step2Errors.height)
                setStep2Errors((p) => {
                  const c = { ...p };
                  delete c.height;
                  return c;
                });
            }}
            className={`border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:ring-[#00E5FF]/20 ${
              step2Errors.height
                ? "border-[#FF1744] focus:border-[#FF1744]"
                : "focus:border-[#00E5FF]"
            }`}
          />
          {step2Errors.height && (
            <p className="text-xs text-[#FF1744]">{step2Errors.height}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight" className="text-[#8B8BA3]">
            Peso (kg) <span className="text-[#FF1744]">*</span>
          </Label>
          <Input
            id="weight"
            type="number"
            placeholder="70"
            min={1}
            max={500}
            step="0.1"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              if (step2Errors.weight)
                setStep2Errors((p) => {
                  const c = { ...p };
                  delete c.weight;
                  return c;
                });
            }}
            className={`border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:ring-[#00E5FF]/20 ${
              step2Errors.weight
                ? "border-[#FF1744] focus:border-[#FF1744]"
                : "focus:border-[#00E5FF]"
            }`}
          />
          {step2Errors.weight && (
            <p className="text-xs text-[#FF1744]">{step2Errors.weight}</p>
          )}
        </div>
      </div>

      {/* Goal */}
      <div className="space-y-2">
        <Label className="text-[#8B8BA3]">
          Objetivo <span className="text-[#FF1744]">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setGoal(value);
                if (step2Errors.goal)
                  setStep2Errors((p) => {
                    const c = { ...p };
                    delete c.goal;
                    return c;
                  });
              }}
              className={`rounded-xl border p-3 text-sm transition-all duration-200 ${
                goal === value
                  ? "border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.12)]"
                  : "border-white/[0.08] text-[#8B8BA3] hover:border-white/20 hover:bg-[#1A1A2E]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {step2Errors.goal && (
          <p className="text-xs text-[#FF1744]">{step2Errors.goal}</p>
        )}
      </div>

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.06]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#12121A] px-3 text-[#8B8BA3]/60">
            Preferencias alimentarias
          </span>
        </div>
      </div>

      {/* Dietary Restrictions */}
      <div className="space-y-2">
        <Label className="text-[#8B8BA3]">Restricciones alimentarias</Label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_RESTRICTIONS.map((restriction) => {
            const isSelected = dietaryRestrictions.includes(restriction);
            return (
              <button
                key={restriction}
                type="button"
                onClick={() =>
                  setDietaryRestrictions(
                    isSelected
                      ? dietaryRestrictions.filter((r) => r !== restriction)
                      : [...dietaryRestrictions, restriction]
                  )
                }
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200 ${
                  isSelected
                    ? "border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED]"
                    : "border-white/[0.08] text-[#8B8BA3] hover:border-white/20 hover:bg-[#1A1A2E]"
                }`}
              >
                {restriction}
              </button>
            );
          })}
        </div>
      </div>

      {/* Allergies */}
      <div className="space-y-2">
        <Label htmlFor="allergies" className="text-[#8B8BA3]">
          Alergias
        </Label>
        <Input
          id="allergies"
          type="text"
          placeholder="Ej: cacahuetes, mariscos..."
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          className="border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
        />
      </div>

      {/* Foods I don't like */}
      <div className="space-y-2">
        <Label htmlFor="dislikedFoods" className="text-[#8B8BA3]">
          Alimentos que no me gustan
        </Label>
        <Input
          id="dislikedFoods"
          type="text"
          placeholder="Ej: brocoli, higado..."
          value={dislikedFoods}
          onChange={(e) => setDislikedFoods(e.target.value)}
          className="border-white/[0.08] bg-[#0A0A0F] text-white placeholder:text-[#8B8BA3]/50 focus:border-[#00E5FF] focus:ring-[#00E5FF]/20"
        />
      </div>

      {/* Error banner */}
      {pageError && (
        <div className="rounded-lg border border-[#FF1744]/20 bg-[#FF1744]/10 p-3 text-sm text-[#FF1744]">
          {pageError}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-5 py-3 text-sm font-medium text-[#8B8BA3] transition-all duration-200 hover:border-white/20 hover:bg-[#1A1A2E] hover:text-white disabled:opacity-40"
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
              d="M11 17l-5-5m0 0l5-5m-5 5h12"
            />
          </svg>
          Anterior
        </button>

        <button
          type="button"
          onClick={onComplete}
          disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-[#00C853] px-6 py-3 text-sm font-semibold text-[#0A0A0F] transition-all duration-200 hover:bg-[#00C853]/90 hover:shadow-[0_0_20px_rgba(0,200,83,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Spinner />
              Guardando...
            </>
          ) : (
            <>
              Completar
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
