export function TickerBar() {
  return (
    <div className="overflow-hidden border-y border-white/[0.05] bg-[#0C0C14] py-3.5">
      <div className="ticker-track whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.35em] text-[#3A3A52]">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="mx-8">
            Rutinas con IA <span className="mx-5 text-[#00E5FF]/35">·</span>
            Vision Calorie Tracker <span className="mx-5 text-[#7C3AED]/35">·</span>
            App móvil para clientes <span className="mx-5 text-[#FF9100]/35">·</span>
            Google Calendar <span className="mx-5 text-[#00E5FF]/35">·</span>
            Gestión de clientes <span className="mx-5 text-[#7C3AED]/35">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
