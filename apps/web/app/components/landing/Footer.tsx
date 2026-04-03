import Link from "next/link";

const FOOTER_LINKS: [string, string][] = [
  ["Acceder", "/login"],
  ["Registro", "/register"],
  ["Módulos", "#features"],
  ["Precio", "#pricing"],
];

export function Footer() {
  return (
    <footer className="px-4 py-10 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <span className="text-[15px] font-extrabold">Fit<span className="text-[#00E5FF]">OS</span></span>
            <span className="text-[11px] text-[#3A3A52]">&copy; 2026 &middot; Software para entrenadores</span>
          </div>
          <nav className="flex items-center gap-6">
            {FOOTER_LINKS.map(([label, href]) => (
              <Link key={label} href={href} className="text-[12px] text-[#5A5A72] transition-colors hover:text-white">{label}</Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
