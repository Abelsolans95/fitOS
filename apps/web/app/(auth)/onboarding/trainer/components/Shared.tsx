"use client";

const STEP_LABELS = [
  "Perfil de negocio",
  "Formulario de onboarding",
  "Codigo promocional",
] as const;

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative mb-6 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
        />
      </div>

      {/* Step dots with labels */}
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div key={label} className="flex flex-col items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? "border-[#00E5FF] bg-[#00E5FF] text-[#0A0A0F]"
                    : isCurrent
                    ? "border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.3)]"
                    : "border-white/[0.12] bg-transparent text-[#8B8BA3]/60"
                }`}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-[11px] font-medium transition-colors duration-300 ${
                  isCurrent
                    ? "text-[#00E5FF]"
                    : isCompleted
                    ? "text-white/70"
                    : "text-[#8B8BA3]/50"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
