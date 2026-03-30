"use client";

import { OWNERSHIP_FILTERS } from "./components/types";
import { SearchIcon, PlusIcon, XIcon, DumbbellIcon } from "./components/Icons";
import { PillFilter } from "./components/Shared";
import { ExerciseCard } from "./components/ExerciseCard";
import { ExerciseFormModal } from "./components/ExerciseFormModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { useExercisesPage } from "./useExercisesPage";

export default function TrainerExercisesPage() {
  const {
    loading, error, setError, loadExercises,
    search, setSearch,
    ownershipFilter, setOwnershipFilter,
    filteredExercises,
    modalOpen, editingExercise, form, saving,
    openCreateModal, openEditModal, closeModal, updateForm, handleSave,
    deleteTarget, setDeleteTarget, deleting, handleDelete,
  } = useExercisesPage();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  if (error && filteredExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="rounded-[18px] border border-[#FF1744]/20 bg-[#FF1744]/5 px-6 py-4">
          <p className="text-[13px] text-[#FF1744]">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => { setError(null); loadExercises(); }}
          className="rounded-xl px-4 py-2 text-[13px] font-medium text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/10"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes ex-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ex-in { animation: ex-in 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .ex-1  { animation-delay: 0.04s; }
        .ex-2  { animation-delay: 0.14s; }
        .ex-3  { animation-delay: 0.24s; }
      `}</style>

      <div className="space-y-6">
        {error && filteredExercises.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-[#FF1744]/20 bg-[#FF1744]/5 px-4 py-3">
            <p className="text-[13px] text-[#FF1744]">{error}</p>
            <button type="button" onClick={() => setError(null)} className="rounded-lg p-1 text-[#FF1744] transition-colors hover:bg-[#FF1744]/10">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="ex-in ex-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5A5A72] mb-1">Entrenamiento</p>
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-white">Biblioteca de Ejercicios</h1>
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-2 text-[11px] font-bold text-[#00E5FF]">
                {filteredExercises.length}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all"
          >
            <PlusIcon className="h-4 w-4" />
            Añadir ejercicio
          </button>
        </div>

        <div className="ex-in ex-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A5A72]" />
            <input
              type="text"
              placeholder="Buscar ejercicio por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0E0E18]/60 backdrop-blur-xl pl-10 pr-4 text-[13px] text-white placeholder:text-[#5A5A72] outline-none focus:border-[#00E5FF]/40 transition-colors"
            />
          </div>
          <PillFilter options={OWNERSHIP_FILTERS} value={ownershipFilter} onChange={setOwnershipFilter} />
        </div>

        <div className="ex-in ex-3">
          {filteredExercises.length === 0 ? (
            <div className="rounded-[18px] border border-white/[0.06] bg-[#0E0E18]/60 backdrop-blur-xl p-12">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] text-[#3A3A52]">
                  <DumbbellIcon className="h-6 w-6" />
                </div>
                <p className="text-[14px] font-semibold text-white">
                  {search.trim() || ownershipFilter !== "todos" ? "No se encontraron ejercicios" : "Aun no hay ejercicios"}
                </p>
                <p className="text-[12px] text-[#5A5A72] text-center">
                  {search.trim() || ownershipFilter !== "todos"
                    ? "Prueba ajustar los filtros de busqueda"
                    : "Crea tu primer ejercicio para empezar a construir tu biblioteca"}
                </p>
                {!search.trim() && ownershipFilter === "todos" && (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-2 inline-flex items-center gap-2 bg-[#00E5FF] text-[#0A0A0F] font-bold rounded-xl px-5 py-2.5 text-[13px] hover:bg-[#2BEEFF] hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Añadir ejercicio
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onEdit={() => openEditModal(exercise)}
                  onDelete={() => setDeleteTarget(exercise)}
                />
              ))}
            </div>
          )}
        </div>

        <ExerciseFormModal
          isOpen={modalOpen}
          title={editingExercise ? "Editar ejercicio" : "Nuevo ejercicio"}
          form={form}
          saving={saving}
          onChange={updateForm}
          onSave={handleSave}
          onClose={closeModal}
        />

        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          exerciseName={deleteTarget?.name ?? ""}
          isGlobal={deleteTarget?.is_global ?? false}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </>
  );
}
