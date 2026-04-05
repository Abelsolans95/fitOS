import { memo } from "react";
import type { ExerciseData } from "../active/types";
import { isAllowedVideoUrl } from "@/lib/url-validation";

interface ExerciseCardProps {
  ex: ExerciseData;
  idx: number;
  activeWeek: number;
  formatPrevious: (name: string) => string;
}

export const ExerciseCard = memo(function ExerciseCard({ ex, idx, activeWeek, formatPrevious }: ExerciseCardProps) {
  const wk = ex.weekly_config?.[activeWeek];
  const effectiveMode = ex.mode ?? "equal";
  const effectiveSets = wk?.sets ?? ex.sets;
  const prevStr = formatPrevious(ex.name);
  const weekNotes = wk?.coach_notes || "";
  const baseNotes =
    ex.coach_notes || ex.trainer_notes || ex.technique_notes || "";
  const notes = weekNotes || baseNotes;
  const progressionRule = ex.progression_rule || "";

  // Build per-set rows
  let setRows: {
    idx: number;
    repsMin: number;
    repsMax: number;
    rir: number;
    weight: number | null;
    rest: number;
    setType?: string;
  }[] = [];

  // Use sets_detail if available — even in equal mode (weekly_config may have derivatives)
  const hasSetsDetail = effectiveMode === "different"
    ? true
    : (wk?.sets_detail?.length ?? 0) > 0;

  if (hasSetsDetail) {
    const detail = wk?.sets_detail ?? ex.sets_config ?? [];
    let normalNum = 0;
    setRows = detail.map((s, i) => {
      const st = s.set_type || "normal";
      if (st === "normal") normalNum++;
      return {
        idx: st === "normal" ? normalNum : i + 1,
        repsMin: s.reps_min,
        repsMax: s.reps_max,
        rir: s.rir,
        weight: s.target_weight,
        rest: s.rest_s,
        setType: st,
      };
    });
  } else {
    const rMin = wk?.reps_min ?? ex.reps_min;
    const rMax = wk?.reps_max ?? ex.reps_max;
    const rir = wk?.rir ?? ex.rir;
    const weight = wk?.target_weight ?? ex.target_weight ?? ex.weight_kg ?? null;
    const rest = wk?.rest_s ?? ex.rest_s;
    setRows = Array.from({ length: effectiveSets }, (_, i) => ({
      idx: i + 1,
      repsMin: rMin,
      repsMax: rMax,
      rir,
      weight,
      rest,
    }));
  }

  // Scheme label
  const scheme =
    setRows.length > 0
      ? (() => {
          const allReps = setRows.flatMap((s) => [s.repsMin, s.repsMax]);
          const minR = Math.min(...allReps);
          const maxR = Math.max(...allReps);
          return minR === maxR
            ? `${setRows.length}x${minR}`
            : `${setRows.length}x${minR}-${maxR}`;
        })()
      : ex.scheme || `${ex.sets}x${ex.reps_min}-${ex.reps_max}`;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl px-3 py-2.5">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#00E5FF]/10 text-[9px] font-bold text-[#00E5FF]">
            {idx + 1}
          </span>
          <p className="truncate text-xs font-semibold text-white">{ex.name}</p>
        </div>
        <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-[#8B8BA3]">
          {scheme}
        </span>
      </div>

      {/* Per-set breakdown */}
      <div className="mt-1.5 space-y-0.5">
        {setRows.map((s, i) => {
          const isRP = s.setType === "rest_pause";
          const isDS = s.setType === "drop_set";
          const isDeriv = isRP || isDS;
          return (
            <div
              key={i}
              className={`flex items-center gap-x-2 text-[10px] ${isDeriv ? "ml-4 border-l-2 pl-2" : ""} ${isRP ? "border-[#FF9100]/40 text-[#FF9100]" : isDS ? "border-[#7C3AED]/40 text-[#7C3AED]" : "text-[#5A5A72]"}`}
            >
              <span className={`w-[26px] shrink-0 text-[9px] font-bold ${isRP ? "text-[#FF9100]" : isDS ? "text-[#7C3AED]" : "text-[#8B8BA3]"}`}>
                {isRP ? "RP" : isDS ? "DS" : `S${s.idx}`}
              </span>
              <span>
                {s.repsMin === s.repsMax
                  ? `${s.repsMin} reps`
                  : `${s.repsMin}-${s.repsMax} reps`}
              </span>
              {s.rir > 0 && <span>RIR {s.rir}</span>}
              {s.weight != null && s.weight > 0 && <span>{s.weight}kg</span>}
              <span>{s.rest}s</span>
            </div>
          );
        })}
      </div>

      {/* Previous session */}
      {prevStr && (
        <div className="mt-1 text-[10px] text-[#8B8BA3]">Ant: {prevStr}</div>
      )}

      {/* Notes */}
      {(notes || progressionRule) && (
        <div className="mt-1 space-y-0.5">
          {progressionRule && (
            <p className="truncate text-[9px] text-[#FF9100]">{progressionRule}</p>
          )}
          {notes && (
            <p className="truncate text-[9px] text-[#7C3AED]">{notes}</p>
          )}
        </div>
      )}

      {ex.video_url && isAllowedVideoUrl(ex.video_url) && (
        <a
          href={ex.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-[9px] font-medium text-[#00E5FF] transition-colors hover:text-[#00E5FF]/80"
        >
          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Vídeo
        </a>
      )}
    </div>
  );
});
