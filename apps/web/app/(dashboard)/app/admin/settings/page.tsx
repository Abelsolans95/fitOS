"use client";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Configuración</h1>
        <p className="mt-1 text-sm text-[#8B8BA3]">Ajustes de la plataforma</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Platform Info */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Plataforma</h3>
          <div className="space-y-3">
            <InfoRow label="Versión" value="1.0.0" />
            <InfoRow label="Entorno" value={process.env.NODE_ENV ?? "development"} />
            <InfoRow label="Framework" value="Next.js 15 + Supabase" />
            <InfoRow label="Base de datos" value="PostgreSQL (Supabase)" />
          </div>
        </div>

        {/* Integrations */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Integraciones</h3>
          <div className="space-y-3">
            <IntegrationRow label="Google Calendar" configured={false} />
            <IntegrationRow label="Resend (Email)" configured={false} />
            <IntegrationRow label="Claude AI (Edge Functions)" configured={!!process.env.NEXT_PUBLIC_SUPABASE_URL} />
            <IntegrationRow label="Stripe (Pagos)" configured={false} />
          </div>
        </div>

        {/* Security */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Seguridad</h3>
          <div className="space-y-3">
            <InfoRow label="CSP Headers" value="Activo" accent="#00C853" />
            <InfoRow label="Rate Limiting" value="Activo (in-memory)" accent="#00C853" />
            <InfoRow label="CSRF Protection" value="Activo" accent="#00C853" />
            <InfoRow label="RLS (Row Level Security)" value="Activo en todas las tablas" accent="#00C853" />
            <InfoRow label="Input Sanitization" value="Activo" accent="#00C853" />
          </div>
        </div>

        {/* Limits */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#5A5A72]">Límites</h3>
          <div className="space-y-3">
            <InfoRow label="Rate limit API" value="60 req/min" />
            <InfoRow label="Rate limit Auth" value="10 req/min" />
            <InfoRow label="Rate limit Upload" value="10 req/min" />
            <InfoRow label="Max upload size" value="5 MB (imágenes)" />
            <InfoRow label="Max Excel import" value="200 ejercicios/batch" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-[#5A5A72]">{label}</span>
      <span className="text-sm font-semibold" style={{ color: accent ?? "#E8E8ED" }}>
        {value}
      </span>
    </div>
  );
}

function IntegrationRow({ label, configured }: { label: string; configured: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#5A5A72]">{label}</span>
      <span className={`text-xs font-semibold ${configured ? "text-[#00C853]" : "text-[#FF9100]"}`}>
        {configured ? "Configurado" : "Pendiente"}
      </span>
    </div>
  );
}
