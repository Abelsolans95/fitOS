"use client";

import { memo } from "react";
import { Exercise } from "./types";
import { PlayIcon, PencilIcon, TrashIcon } from "./Icons";
import { CategoryBadge, OwnershipBadge } from "./Shared";

export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  onEdit,
  onDelete,
}: {
  exercise: Exercise;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-[18px] border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-4 transition-all duration-200 hover:border-white/[0.1]">
      {/* Video thumbnail placeholder */}
      {exercise.video_url ? (
        <div className="mb-3 flex h-36 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] transition-colors group-hover:bg-white/[0.12]">
            <PlayIcon className="h-6 w-6 text-[#8B8BA3] ml-0.5" />
          </div>
        </div>
      ) : null}

      {/* Header: name + actions */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-bold text-white leading-snug line-clamp-2 tracking-[-0.01em]">
          {exercise.name}
        </h3>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="rounded-lg p-1.5 text-[#8B8BA3] transition-colors hover:bg-white/[0.06] hover:text-white"
            title={exercise.is_global ? "Personalizar ejercicio" : "Editar ejercicio"}
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg p-1.5 text-[#8B8BA3] transition-colors hover:bg-[#FF1744]/10 hover:text-[#FF1744]"
            title={exercise.is_global ? "Ocultar ejercicio" : "Eliminar ejercicio"}
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Description */}
      {exercise.description && (
        <p className="mt-1.5 text-[12px] text-[#8B8BA3] line-clamp-2 leading-relaxed">
          {exercise.description}
        </p>
      )}

      {/* Badges */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={exercise.category} />
        <OwnershipBadge isGlobal={exercise.is_global} />
      </div>

      {/* Muscle groups */}
      {((exercise.muscle_groups?.length ?? 0) > 0 || (exercise.secondary_muscles?.length ?? 0) > 0) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {(exercise.muscle_groups ?? []).map((m) => (
            <span key={m} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[#E8E8ED]">
              {m}
            </span>
          ))}
          {(exercise.secondary_muscles ?? []).map((m) => (
            <span key={m} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#8B8BA3]">
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
