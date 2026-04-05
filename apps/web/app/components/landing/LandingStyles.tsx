/* ─── Inline styles for the landing page animations ──── */
export function LandingStyles() {
  return (
    <style>{`
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(22px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes shimmer {
        0%   { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes marquee {
        from { transform: translateX(0); }
        to   { transform: translateX(-50%); }
      }
      @keyframes ticker {
        from { transform: translateX(0); }
        to   { transform: translateX(-50%); }
      }
      @keyframes pulse-ring {
        0%,100% { box-shadow: 0 0 0 0 rgba(0,229,255,0.4); }
        50%     { box-shadow: 0 0 0 8px rgba(0,229,255,0); }
      }
      @keyframes float {
        0%,100% { transform: translateY(0px); }
        50%     { transform: translateY(-7px); }
      }
      @keyframes blink {
        0%,100% { opacity: 1; } 50% { opacity: 0; }
      }

      .fu  { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both; }
      .fi  { animation: fadeIn 1.2s ease both; }
      .fu-1 { animation-delay: 0.1s; }
      .fu-2 { animation-delay: 0.25s; }
      .fu-3 { animation-delay: 0.42s; }
      .fu-4 { animation-delay: 0.6s; }
      .fu-5 { animation-delay: 0.78s; }

      .shimmer-cyan {
        background: linear-gradient(90deg, #00E5FF 0%, #fff 28%, #7C3AED 55%, #00E5FF 80%);
        background-size: 250% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer 5s linear infinite;
      }

      /* Nav */
      .nav-pill {
        background: rgba(10,10,15,0.7);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255,255,255,0.09);
        border-radius: 100px;
      }

      /* Premium UI font — buttons, card titles, UI labels */
      .font-jakarta { font-family: var(--font-jakarta), sans-serif; }
      .feat-card h3,
      .feat-card .card-num,
      .how-card h3,
      .pricing-title,
      .nav-cta { font-family: var(--font-jakarta), sans-serif; }

      /* Buttons */
      .btn-primary {
        background: #00E5FF; color: #0A0A0F; font-weight: 800;
        font-family: var(--font-jakarta), sans-serif;
        letter-spacing: 0.01em;
        position: relative; overflow: hidden; transition: all 0.25s ease;
      }
      .btn-primary::before {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 55%);
        pointer-events: none;
      }
      .btn-primary:hover {
        background: #2BEEFF;
        box-shadow: 0 0 36px rgba(0,229,255,0.5), 0 0 80px rgba(0,229,255,0.18);
        transform: translateY(-1px);
      }
      .btn-ghost {
        border: 1px solid rgba(255,255,255,0.14); color: rgba(255,255,255,0.7);
        font-family: var(--font-jakarta), sans-serif;
        transition: all 0.25s ease;
      }
      .btn-ghost:hover {
        border-color: rgba(255,255,255,0.28); color: #fff;
        background: rgba(255,255,255,0.05);
      }

      /* Feature cards */
      .feat-card {
        position: relative; overflow: hidden;
        border: 1px solid rgba(255,255,255,0.06);
        background: #12121A; border-radius: 20px;
        transition: border-color 0.4s ease, transform 0.35s ease, box-shadow 0.4s ease;
      }
      .feat-card:hover { transform: translateY(-3px); }
      .feat-card[data-c="cyan"]:hover  { border-color: rgba(0,229,255,0.2); box-shadow: 0 20px 60px -15px rgba(0,229,255,0.12); }
      .feat-card[data-c="violet"]:hover { border-color: rgba(124,58,237,0.25); box-shadow: 0 20px 60px -15px rgba(124,58,237,0.15); }
      .feat-card[data-c="orange"]:hover { border-color: rgba(255,145,0,0.25); box-shadow: 0 20px 60px -15px rgba(255,145,0,0.12); }

      .icon-float { animation: float 5s ease-in-out infinite; }

      /* Marquee */
      .marquee-track { display: flex; width: max-content; animation: marquee 30s linear infinite; }
      .marquee-track:hover { animation-play-state: paused; }

      /* Ticker */
      .ticker-track { display: flex; width: max-content; animation: ticker 45s linear infinite; }

      /* Testi card */
      .testi-card {
        background: rgba(18,18,26,0.85); backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 18px; flex-shrink: 0; width: min(320px, 82vw);
      }

      /* Pricing wrap */
      .pricing-wrap {
        background: linear-gradient(135deg, rgba(0,229,255,0.18), rgba(124,58,237,0.18));
        padding: 1px; border-radius: 24px;
      }
      .pricing-inner { background: #0E0E18; border-radius: 23px; }

      /* Pulse */
      .pulse-dot { animation: pulse-ring 2.5s ease-in-out infinite; }

      /* Cursor blink */
      .cursor { animation: blink 1.1s step-end infinite; }

      /* Scan line on hero product card */
      @keyframes scan {
        0%   { transform: translateY(-100%); opacity: 0; }
        8%   { opacity: 0.6; }
        92%  { opacity: 0.6; }
        100% { transform: translateY(900%); opacity: 0; }
      }
      .scan-line {
        position: absolute; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg, transparent 0%, #00E5FF 50%, transparent 100%);
        animation: scan 6s linear infinite; pointer-events: none; z-index: 10;
      }

      /* Word breaking only on mobile — desktop allows natural overflow */
      @media (max-width: 640px) {
        h1, h2, h3 { word-break: break-word; }
      }

      @media (prefers-reduced-motion: reduce) {
        .fu, .fi, .shimmer-cyan, .icon-float, .pulse-dot, .cursor,
        .scan-line, .marquee-track, .ticker-track { animation: none !important; }
        .shimmer-cyan { -webkit-text-fill-color: #00E5FF; }
      }
    `}</style>
  );
}
