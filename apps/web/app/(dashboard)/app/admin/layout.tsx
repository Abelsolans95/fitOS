import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SECURITY: Server-side role verification as defense-in-depth
  // Middleware already checks role, but this prevents access if middleware is bypassed
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (user.user_metadata?.role !== "admin") {
    redirect("/app/client/dashboard");
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] text-white">
      {/* ── Premium Ambient Background ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 premium-grid" />
      </div>

      {/* ── Foreground Shell ── */}
      <div className="relative z-10">
        <main>
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
