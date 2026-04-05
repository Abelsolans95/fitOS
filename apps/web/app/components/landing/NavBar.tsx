import Link from "next/link";
import { IcArrow } from "./Icons";

export function NavBar() {
  return (
    <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-24px)] sm:w-full sm:max-w-5xl px-0 sm:px-4">
      <nav className="nav-pill flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3">
        <span className="text-[15px] font-extrabold tracking-tight">
          Fit<span className="text-[#00E5FF]">OS</span>
        </span>
        <div className="hidden sm:flex items-center gap-7 text-[13px] text-[#8B8BA3]">
          <a href="#features" className="hover:text-white transition-colors">Módulos</a>
          <a href="#how" className="hover:text-white transition-colors">Cómo funciona</a>
          <a href="#pricing" className="hover:text-white transition-colors">Precio</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="nav-cta btn-ghost rounded-full px-3 py-2 text-[12px] sm:px-4 sm:text-[13px]">Acceder</Link>
          <Link href="/register" className="nav-cta btn-primary rounded-full px-3 py-2 text-[12px] sm:px-4 sm:text-[13px] inline-flex items-center gap-1.5">
            <span className="hidden sm:inline">Empezar gratis</span>
            <span className="sm:hidden">Empezar</span>
            <IcArrow />
          </Link>
        </div>
      </nav>
    </div>
  );
}
