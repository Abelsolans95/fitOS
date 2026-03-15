export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Top nav bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <h1 className="text-xl font-bold text-white">
            Fit<span className="text-[#00E5FF]">OS</span>
          </h1>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-[#8B8BA3]">Dashboard</span>
          </nav>
        </div>
      </header>
      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
