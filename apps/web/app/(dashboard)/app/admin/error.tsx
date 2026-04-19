"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="rounded-2xl border border-white/10 bg-[#12121A] p-8 text-center">
        <p className="text-lg font-semibold text-white">Error al cargar el panel</p>
        <p className="mt-2 text-sm text-[#8B8BA3]">
          {error.digest ? `Ref: ${error.digest}` : "Ha ocurrido un error inesperado"}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-xl bg-[#7C3AED] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7C3AED]/80"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
