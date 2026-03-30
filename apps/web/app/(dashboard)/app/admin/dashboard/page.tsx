"use client";

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#7C3AED]/30 bg-[#7C3AED]/10">
        <svg className="h-8 w-8 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      </div>
      <h1 className="text-2xl font-black tracking-tight text-white">Panel de Administración</h1>
      <p className="text-sm text-[#8B8BA3]">Aquí irá el dashboard de administrador.</p>
    </div>
  );
}
