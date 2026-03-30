"use client";

import { Spinner } from "./Shared";

interface StepPromoCodeProps {
  loading: boolean;
  promoCode: string;
  codeCopied: boolean;
  onCopy: () => void;
}

export function StepPromoCode({
  loading,
  promoCode,
  codeCopied,
  onCopy,
}: StepPromoCodeProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">
          Tu codigo promocional
        </h2>
        <p className="mt-1 text-sm text-[#8B8BA3]">
          Comparte este codigo con tus clientes para que se registren contigo.
        </p>
      </div>

      {/* Code display */}
      {loading && !promoCode ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner className="h-8 w-8 text-[#00E5FF]" />
          <p className="text-sm text-[#8B8BA3]">Generando tu codigo...</p>
        </div>
      ) : promoCode ? (
        <div className="space-y-6">
          {/* Main code card */}
          <div className="relative overflow-hidden rounded-2xl border border-[#00E5FF]/20 bg-gradient-to-br from-[#00E5FF]/5 via-transparent to-[#7C3AED]/5 p-8">
            {/* Decorative glow */}
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#00E5FF]/10 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-[#7C3AED]/10 blur-3xl" />

            <div className="relative text-center">
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#8B8BA3]">
                Tu codigo
              </p>
              <p className="font-mono text-3xl font-bold tracking-[0.2em] text-[#00E5FF] sm:text-4xl">
                {promoCode}
              </p>
            </div>
          </div>

          {/* Copy button */}
          <button
            type="button"
            onClick={onCopy}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all duration-200 ${
              codeCopied
                ? "border-[#00C853]/30 bg-[#00C853]/10 text-[#00C853]"
                : "border-[#00E5FF]/20 bg-[#00E5FF]/5 text-[#00E5FF] hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/30"
            }`}
          >
            {codeCopied ? (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copiado al portapapeles
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                  />
                </svg>
                Copiar codigo
              </>
            )}
          </button>

          {/* Share section */}
          <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0F] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-[#7C3AED]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                />
              </svg>
              <h3 className="text-sm font-medium text-white">
                Compartir codigo
              </h3>
            </div>
            <p className="text-xs text-[#8B8BA3] leading-relaxed">
              Envia este codigo a tus clientes para que lo ingresen al registrarse.
              Asi quedaran vinculados automaticamente a tu cuenta.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const text = `Registrate en FitOS con mi codigo: ${promoCode}`;
                  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(url, "_blank");
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-[#12121A] py-2.5 text-xs text-[#8B8BA3] transition-all hover:border-[#25D366]/30 hover:bg-[#25D366]/5 hover:text-[#25D366]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => {
                  const subject = encodeURIComponent("Tu codigo para FitOS");
                  const body = encodeURIComponent(
                    `Hola!\n\nRegistrate en FitOS con mi codigo promocional: ${promoCode}\n\nNos vemos en la plataforma!`
                  );
                  window.open(
                    `mailto:?subject=${subject}&body=${body}`,
                    "_blank"
                  );
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-[#12121A] py-2.5 text-xs text-[#8B8BA3] transition-all hover:border-[#00E5FF]/30 hover:bg-[#00E5FF]/5 hover:text-[#00E5FF]"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
                Email
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
