"use client";

import { TrashIcon } from "./Icons";

export function DeleteConfirmModal({
  isOpen,
  exerciseName,
  isGlobal,
  deleting,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  exerciseName: string;
  isGlobal: boolean;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-[18px] border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF1744]/10 ring-1 ring-[#FF1744]/20">
            <TrashIcon className="h-6 w-6 text-[#FF1744]" />
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold tracking-[-0.02em] text-white">
              {isGlobal ? "Ocultar ejercicio" : "Eliminar ejercicio"}
            </h3>
            <p className="mt-1.5 text-[13px] text-[#8B8BA3]">
              {isGlobal ? (
                <>
                  ¿Ocultar{" "}
                  <span className="font-semibold text-white">{exerciseName}</span>?
                  Solo desaparecerá de tu vista.
                </>
              ) : (
                <>
                  ¿Eliminar{" "}
                  <span className="font-semibold text-white">{exerciseName}</span>?
                  Esta acción no se puede deshacer.
                </>
              )}
            </p>
          </div>
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className="flex-1 border border-white/[0.1] text-[#8B8BA3] rounded-xl px-4 py-2 text-[13px] hover:border-white/[0.18] hover:text-white transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 rounded-xl bg-[#FF1744] px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-[#FF1744]/90 hover:shadow-[0_0_20px_rgba(255,23,68,0.3)] disabled:opacity-50"
            >
              {deleting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Eliminando...
                </span>
              ) : (
                "Eliminar"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
