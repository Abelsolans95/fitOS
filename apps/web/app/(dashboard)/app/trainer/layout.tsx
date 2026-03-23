import { TrainerSidebar } from "@/components/layout/TrainerSidebar";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#0A0A0F] text-white">
      {/* ── Ambient Background Glows ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Subtle dot-grid texture */}
        <div className="absolute inset-0 dot-grid opacity-70" />
        
        {/* Soft violet/cyan radial glows */}
        <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#7C3AED] opacity-[0.03] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[500px] translate-x-1/2 rounded-full bg-[#00E5FF] opacity-[0.03] blur-[100px]" />
      </div>

      {/* ── Foreground Shell ── */}
      <div className="relative z-10">
        <TrainerSidebar />
        <main className="pt-14 transition-all duration-300 lg:pt-0 lg:pl-[240px]">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
