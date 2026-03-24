"use client";

import { ClientProfile, FoodPreferences } from "./types";
import { GOAL_LABELS } from "./shared";

function FoodPreferencesDisplay({ prefs }: { prefs: FoodPreferences | null }) {
  if (!prefs) return <p className="text-sm text-[#8B8BA3]">No especificado</p>;

  const restrictions = prefs.dietary_restrictions ?? [];
  const allergies = prefs.allergies?.trim();
  const disliked = prefs.disliked_foods?.trim();

  const hasContent = restrictions.length > 0 || allergies || disliked;
  if (!hasContent) return <p className="text-sm text-[#8B8BA3]">Sin restricciones</p>;

  return (
    <div className="space-y-3">
      {restrictions.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-[#8B8BA3]">Restricciones</p>
          <div className="flex flex-wrap gap-1.5">
            {restrictions.map((r) => (
              <span
                key={r}
                className="rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-2.5 py-0.5 text-xs font-medium text-[#7C3AED]"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
      {allergies && (
        <div>
          <p className="text-xs text-[#8B8BA3]">Alergias</p>
          <p className="mt-0.5 text-sm text-[#E8E8ED]">{allergies}</p>
        </div>
      )}
      {disliked && (
        <div>
          <p className="text-xs text-[#8B8BA3]">Alimentos que no le gustan</p>
          <p className="mt-0.5 text-sm text-[#E8E8ED]">{disliked}</p>
        </div>
      )}
    </div>
  );
}

export function TabPerfil({ profile }: { profile: ClientProfile }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { label: "Altura", value: profile.height ? `${profile.height} cm` : null },
          { label: "Peso", value: profile.weight ? `${profile.weight} kg` : null },
          { label: "Objetivo", value: profile.goal ? GOAL_LABELS[profile.goal] ?? profile.goal : null },
          { label: "Bio", value: profile.bio },
        ].map((f) => (
          <div key={f.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">{f.label}</p>
            <p className="mt-1 text-sm text-[#E8E8ED]">{f.value ?? "No especificado"}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#8B8BA3]">
          Preferencias alimentarias
        </p>
        <FoodPreferencesDisplay prefs={profile.food_preferences} />
      </div>
    </div>
  );
}
