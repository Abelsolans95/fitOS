import { ClientSidebar } from "@/components/layout/ClientSidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <ClientSidebar />
      <main className="pt-14 transition-all duration-300 lg:pt-0 lg:pl-[220px]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
