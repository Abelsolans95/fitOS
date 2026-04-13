import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SECURITY: Double verification — JWT + DB profile
  // user_metadata.role alone is spoofable via signUp({ data: { role: "admin" } })
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Quick JWT check
  if (user.user_metadata?.role !== "admin") {
    redirect("/app/client/dashboard");
  }

  // CRITICAL: Verify profiles.role in DB (source of truth)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("[AdminLayout] Missing SUPABASE_SERVICE_ROLE_KEY env var");
    redirect("/login");
  }

  const supabaseAdmin = createServiceClient(url, serviceKey);

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileErr) {
    console.error("[AdminLayout] Profile check failed:", profileErr.code);
    redirect("/login");
  }

  if (!profile || profile.role !== "admin") {
    redirect("/login");
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
        <AdminSidebar />
        <main className="pt-14 transition-all duration-300 lg:pt-0 lg:pl-[240px]">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
