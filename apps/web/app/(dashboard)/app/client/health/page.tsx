"use client";

import { Suspense } from "react";
import { useClientHealth } from "./useClientHealth";
import { HealthLogList } from "./components/HealthLogList";
import { AnatomyMap } from "@/components/health/AnatomyMap";
import { HealthReportForm } from "@/components/health/HealthReportForm";
import type { MuscleStatus, Gender } from "@/components/health/AnatomyMap";

function GenderToggle({ gender, onChange }: { gender: Gender; onChange: (g: Gender) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-white/10 bg-[#0A0A12] p-1">
      <button
        type="button"
        onClick={() => onChange("male")}
        className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
          gender === "male"
            ? "bg-[#7C3AED]/10 text-[#7C3AED]"
            : "text-[#5A5A72] hover:text-[#8B8BA3]"
        }`}
      >
        Hombre
      </button>
      <button
        type="button"
        onClick={() => onChange("female")}
        className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
          gender === "female"
            ? "bg-[#7C3AED]/10 text-[#7C3AED]"
            : "text-[#5A5A72] hover:text-[#8B8BA3]"
        }`}
      >
        Mujer
      </button>
    </div>
  );
}

function ClientHealthInner() {
  const {
    logs, loading, selectedMuscle, showForm, saving, gender,
    activeLogs, recoveredLogs, existingForMuscle,
    handleMuscleClick, handleSubmit, handleCancel, handleGenderChange,
  } = useClientHealth();

  const muscleStatuses: MuscleStatus[] = logs
    .filter((l) => l.status !== "recovered")
    .reduce((acc, log) => {
      const existing = acc.find((m) => m.muscle_id === log.muscle_id);
      if (!existing || log.pain_score > existing.pain_score) {
        return [
          ...acc.filter((m) => m.muscle_id !== log.muscle_id),
          { muscle_id: log.muscle_id, pain_score: log.pain_score, status: log.status as MuscleStatus["status"] },
        ];
      }
      return acc;
    }, [] as MuscleStatus[]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Mi Salud</h1>
          <p className="mt-1 text-sm text-[#8B8BA3]">
            Reporta molestias o lesiones para que tu entrenador las tenga en cuenta
          </p>
        </div>
        <GenderToggle gender={gender} onChange={handleGenderChange} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Anatomy map */}
        <div className="rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#5A5A72]">Mapa corporal</h2>
            {activeLogs.length > 0 && (
              <span className="rounded-full bg-[#FF1744]/10 px-2.5 py-0.5 text-xs font-semibold text-[#FF1744]">
                {activeLogs.length} activa{activeLogs.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <AnatomyMap muscleStatuses={muscleStatuses} onMuscleClick={handleMuscleClick} selectedMuscle={selectedMuscle} gender={gender} />
        </div>

        {/* Right: Form or log list */}
        <div className="space-y-4">
          {showForm && selectedMuscle ? (
            <div className="rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-5">
              <HealthReportForm
                muscleId={selectedMuscle}
                existingData={
                  existingForMuscle
                    ? {
                        muscle_id: existingForMuscle.muscle_id,
                        pain_score: existingForMuscle.pain_score,
                        incident_type: existingForMuscle.incident_type,
                        status: existingForMuscle.status,
                        notes: existingForMuscle.notes ?? "",
                      }
                    : null
                }
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                saving={saving}
              />
            </div>
          ) : (
            <HealthLogList activeLogs={activeLogs} recoveredLogs={recoveredLogs} onLogClick={handleMuscleClick} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientHealthPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" /></div>}>
      <ClientHealthInner />
    </Suspense>
  );
}
