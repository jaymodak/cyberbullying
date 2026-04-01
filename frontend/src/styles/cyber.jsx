import { useEffect } from "react";

export const darkTokens = {
  bg:          "#030712",
  bgCard:      "rgba(6,182,212,0.03)",
  bgHeader:    "rgba(3,7,18,0.88)",
  bgInput:     "#0d1829",
  border:      "rgba(6,182,212,0.18)",
  borderHover: "rgba(6,182,212,0.5)",
  text:        "#e2e8f0",
  textMuted:   "#64748b",
  textDim:     "#334155",
  accent:      "#06b6d4",
  accentBg:    "rgba(6,182,212,0.1)",
  accentText:  "#67e8f9",
  gridClass:   "grid-bg-dark",
  scanClass:   "scan-lines-dark",
  btnClass:    "cyber-btn-dark",
  inputClass:  "cyber-input-dark",
};

export const lightTokens = {
  bg:          "#dde3ea",
  bgCard:      "rgba(8,145,178,0.05)",
  bgHeader:    "rgba(220,228,235,0.92)",
  bgInput:     "#f1f5f9",
  border:      "rgba(8,145,178,0.22)",
  borderHover: "rgba(8,145,178,0.55)",
  text:        "#0f172a",
  textMuted:   "#475569",
  textDim:     "#94a3b8",
  accent:      "#0891b2",
  accentBg:    "rgba(8,145,178,0.08)",
  accentText:  "#0e7490",
  gridClass:   "grid-bg-light",
  scanClass:   "scan-lines-light",
  btnClass:    "cyber-btn-light",
  inputClass:  "cyber-input-light",
};

export const cyberStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');

  * { cursor: none !important; box-sizing: border-box; }

  .cyber-cursor {
    position: fixed; top:0; left:0; width:12px; height:12px; border-radius:50%;
    background:#06b6d4; pointer-events:none; z-index:9999;
    mix-blend-mode:difference; transition:transform 0.05s linear;
  }
  .cyber-cursor-glow {
    position:fixed; top:0; left:0; width:400px; height:400px; border-radius:50%;
    pointer-events:none; z-index:9998;
    background:radial-gradient(circle,rgba(6,182,212,0.06) 0%,transparent 70%);
    transition:transform 0.15s ease-out;
  }

  .reveal { opacity:0; transform:translateY(35px); transition:opacity 0.8s cubic-bezier(0.16,1,0.3,1),transform 0.8s cubic-bezier(0.16,1,0.3,1); }
  .reveal.revealed { opacity:1; transform:translateY(0); }
  .delay-1{transition-delay:0.1s} .delay-2{transition-delay:0.2s} .delay-3{transition-delay:0.3s}
  .delay-4{transition-delay:0.4s} .delay-5{transition-delay:0.5s} .delay-6{transition-delay:0.6s}

  .grid-bg-dark {
    background-image: linear-gradient(rgba(6,182,212,0.04) 1px,transparent 1px), linear-gradient(90deg,rgba(6,182,212,0.04) 1px,transparent 1px);
    background-size:60px 60px;
  }
  .grid-bg-light {
    background-image: linear-gradient(rgba(8,145,178,0.08) 1px,transparent 1px), linear-gradient(90deg,rgba(8,145,178,0.08) 1px,transparent 1px);
    background-size:60px 60px;
  }
  .scan-lines-dark {
    background-image:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.5) 2px,rgba(255,255,255,0.5) 4px);
    opacity:0.022;
  }
  .scan-lines-light {
    background-image:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.2) 2px,rgba(0,0,0,0.2) 4px);
    opacity:0.022;
  }

  /* ── BUTTONS ── */
  .cyber-btn-dark {
    position:relative; overflow:hidden; transition:all 0.3s ease;
    border:1px solid rgba(6,182,212,0.5); background:rgba(6,182,212,0.06);
    color:#06b6d4; border-radius:4px; font-family:'Rajdhani',sans-serif; letter-spacing:0.15em; font-weight:700;
  }
  .cyber-btn-dark::before { content:''; position:absolute; top:0; left:-100%; width:100%; height:100%; background:linear-gradient(90deg,transparent,rgba(6,182,212,0.2),transparent); transition:left 0.5s ease; }
  .cyber-btn-dark:hover::before { left:100%; }
  .cyber-btn-dark:hover { box-shadow:0 0 25px rgba(6,182,212,0.35); border-color:rgba(6,182,212,0.8); }

  .cyber-btn-light {
    position:relative; overflow:hidden; transition:all 0.3s ease;
    border:1px solid rgba(8,145,178,0.5); background:rgba(8,145,178,0.07);
    color:#0891b2; border-radius:4px; font-family:'Rajdhani',sans-serif; letter-spacing:0.15em; font-weight:700;
  }
  .cyber-btn-light::before { content:''; position:absolute; top:0; left:-100%; width:100%; height:100%; background:linear-gradient(90deg,transparent,rgba(8,145,178,0.15),transparent); transition:left 0.5s ease; }
  .cyber-btn-light:hover::before { left:100%; }
  .cyber-btn-light:hover { box-shadow:0 0 20px rgba(8,145,178,0.25); border-color:rgba(8,145,178,0.8); }

  /* ── INPUTS — FIXED: explicit bg + text so they work in dark AND light ── */
  .cyber-input-dark {
    background: #0d1829 !important;
    border: 1px solid rgba(6,182,212,0.25) !important;
    color: #e2e8f0 !important;
    font-family:'DM Mono',monospace !important;
    border-radius:4px; transition:all 0.3s ease; outline:none;
  }
  .cyber-input-dark:focus { border-color:rgba(6,182,212,0.65) !important; box-shadow:0 0 20px rgba(6,182,212,0.12) !important; }
  .cyber-input-dark::placeholder { color:#2d4a6e !important; }

  .cyber-input-light {
    background: #f1f5f9 !important;
    border: 1px solid rgba(8,145,178,0.28) !important;
    color: #0f172a !important;
    font-family:'DM Mono',monospace !important;
    border-radius:4px; transition:all 0.3s ease; outline:none;
  }
  .cyber-input-light:focus { border-color:rgba(8,145,178,0.65) !important; box-shadow:0 0 15px rgba(8,145,178,0.14) !important; }
  .cyber-input-light::placeholder { color:#94a3b8 !important; }

  /* ── SELECT fix ── */
  select.cyber-input-dark { background:#0d1829 !important; color:#e2e8f0 !important; }
  select.cyber-input-light { background:#f1f5f9 !important; color:#0f172a !important; }

  .nav-link {
    position:relative; transition:color 0.2s; font-family:'DM Mono',monospace;
    font-size:0.7rem; letter-spacing:0.1em; text-decoration:none;
  }
  .nav-link::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:1px; background:#06b6d4; transition:width 0.3s ease; }
  .nav-link:hover::after, .nav-link.active::after { width:100%; }

  /* smooth theme transitions */
  *, *::before, *::after {
    transition: background-color 0.35s ease, color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
  }

  /* Glassmorphism card */
  .glass-card-dark {
    background: rgba(13,24,41,0.7);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(6,182,212,0.18);
  }
  .glass-card-light {
    background: rgba(241,245,249,0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(8,145,178,0.22);
  }

  /* Donut chart animation */
  @keyframes dash-in { from { stroke-dashoffset: 1000; } }
  @keyframes bar-fill { from { width: 0%; } }
  @keyframes fade-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  .animate-fade-up { animation: fade-up 0.6s ease forwards; }
`;

export function CyberCursor() {
  useEffect(() => {
    const dot  = document.getElementById("cyber-cursor-dot");
    const glow = document.getElementById("cyber-cursor-glow");
    const move = (e) => {
      if (dot)  dot.style.transform = `translate(${e.clientX-6}px,${e.clientY-6}px)`;
      if (glow) glow.style.transform = `translate(${e.clientX-200}px,${e.clientY-200}px)`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (
    <>
      <div id="cyber-cursor-dot"  className="cyber-cursor" />
      <div id="cyber-cursor-glow" className="cyber-cursor-glow" />
    </>
  );
}

export function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("revealed"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

export function SectionHeader({ eyebrow, title, subtitle, isDark }) {
  const t = isDark ? darkTokens : lightTokens;
  return (
    <div className="reveal text-center mb-16">
      {eyebrow && <p style={{ color:t.accent, fontSize:"0.7rem", letterSpacing:"0.15em", fontFamily:"'DM Mono',monospace", marginBottom:"8px" }}>{eyebrow}</p>}
      <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"clamp(2.5rem,6vw,5rem)", color:t.text, letterSpacing:"0.05em", lineHeight:1 }}>{title}</h1>
      {subtitle && <p style={{ color:t.textMuted, fontFamily:"'DM Mono',monospace", fontSize:"0.75rem", lineHeight:1.8, marginTop:"8px" }}>{subtitle}</p>}
    </div>
  );
}