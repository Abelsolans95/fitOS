import { ClientSidebar } from "@/components/layout/ClientSidebar";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SECURITY: Server-side role verification as defense-in-depth
  // Middleware already checks role, but this prevents access if middleware is bypassed
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (user.user_metadata?.role !== "client") {
    redirect("/app/trainer/dashboard");
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] text-white">
      {/* ── Premium Ambient Background ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 premium-grid" />
      </div>

      <div className="relative z-10">
        <ClientSidebar />
        <main className="pt-14 transition-all duration-300 lg:pt-0 lg:pl-[240px]">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
