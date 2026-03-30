"use client";

export function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] text-[#3A3A52]">
        {icon}
      </div>
      <p className="text-[14px] font-semibold text-white">{title}</p>
      <p className="text-[12px] text-[#5A5A72] text-center max-w-[200px]">{description}</p>
    </div>
  );
}
