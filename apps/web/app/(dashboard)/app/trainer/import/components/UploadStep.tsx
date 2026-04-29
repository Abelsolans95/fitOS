"use client";

interface Props {
  loading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadStep({ loading, onUpload }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0E0E18]/60 backdrop-blur-xl p-8">
      <label className="flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed border-white/[0.1] p-12 transition-colors hover:border-[#00E5FF]/30 hover:bg-[#00E5FF]/[0.02]">
        <svg
          className="h-12 w-12 text-[#5A5A72]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <div className="text-center">
          <p className="text-lg font-semibold text-white">
            {loading ? "Procesando..." : "Arrastra o selecciona archivo"}
          </p>
          <p className="mt-1 text-sm text-[#5A5A72]">
            .xlsx, .xls o .csv — máx. 5MB
          </p>
        </div>
        <input
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={onUpload}
          disabled={loading}
        />
      </label>
    </div>
  );
}
