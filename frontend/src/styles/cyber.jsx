// ── Shared cyber design tokens ────────────────────────────────────────────────
// Import this in every page: import { cyberStyles, CyberCard, SectionHeader } from "../styles/cyber";

import { useEffect } from "react";

// Inject global styles once
export const cyberStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');

  * { cursor: none !important; box-sizing: border-box; }

  body {
    background: #030712 !important;
    color: #e2e8f0 !important;
  }

  .cyber-cursor {
    position: fixed; top: 0; left: 0;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: #06b6d4;
    pointer-events: none;
    z-index: 9999;
    mix-blend-mode: difference;
    transition: transform 0.05s linear;
  }
  .cyber-cursor-glow {
    position: fixed; top: 0; left: 0;
    width: 400px; height: 400px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 9998;
    background: radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%);
    transition: transform 0.15s ease-out;
  }

  .reveal {
    opacity: 0;
    transform: translateY(35px);
    transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
  }
  .reveal.revealed { opacity: 1; transform: translateY(0); }
  .delay-1 { transition-delay: 0.1s; }
  .delay-2 { transition-delay: 0.2s; }
  .delay-3 { transition-delay: 0.3s; }
  .delay-4 { transition-delay: 0.4s; }
  .delay-5 { transition-delay: 0.5s; }
  .delay-6 { transition-delay: 0.6s; }

  .grid-bg {
    background-image:
      linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .scan-lines {
    background-image: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px
    );
    opacity: 0.025;
  }

  .cyber-card {
    border: 1px solid rgba(6,182,212,0.15);
    background: rgba(6,182,212,0.02);
    transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
    position: relative;
    overflow: hidden;
  }
  .cyber-card::after {
    content: '';
    position: absolute; inset: 0;
    opacity: 0;
    transition: opacity 0.4s ease;
    background: radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(6,182,212,0.07), transparent 60%);
  }
  .cyber-card:hover { transform: translateY(-4px); border-color: rgba(6,182,212,0.35); }
  .cyber-card:hover::after { opacity: 1; }

  .cyber-btn {
    position: relative; overflow: hidden;
    transition: all 0.3s ease;
    border: 1px solid rgba(6,182,212,0.5);
    background: rgba(6,182,212,0.05);
    color: #06b6d4;
    border-radius: 4px;
    font-family: 'Rajdhani', sans-serif;
    letter-spacing: 0.15em;
    font-weight: 700;
  }
  .cyber-btn::before {
    content: '';
    position: absolute; top: 0; left: -100%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(6,182,212,0.2), transparent);
    transition: left 0.5s ease;
  }
  .cyber-btn:hover::before { left: 100%; }
  .cyber-btn:hover { box-shadow: 0 0 25px rgba(6,182,212,0.35); border-color: rgba(6,182,212,0.8); }

  .cyber-input {
    background: rgba(6,182,212,0.03) !important;
    border: 1px solid rgba(6,182,212,0.2) !important;
    color: #e2e8f0 !important;
    font-family: 'DM Mono', monospace !important;
    font-size: 0.8rem !important;
    border-radius: 4px;
    transition: all 0.3s ease;
    outline: none;
  }
  .cyber-input:focus {
    border-color: rgba(6,182,212,0.6) !important;
    box-shadow: 0 0 20px rgba(6,182,212,0.1) !important;
  }
  .cyber-input::placeholder { color: #334155 !important; }

  .nav-link {
    position: relative;
    transition: color 0.2s;
    font-family: 'DM Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    color: #64748b;
    text-decoration: none;
  }
  .nav-link::after {
    content: '';
    position: absolute; bottom: -2px; left: 0;
    width: 0; height: 1px;
    background: #06b6d4;
    transition: width 0.3s ease;
  }
  .nav-link:hover { color: #06b6d4; }
  .nav-link:hover::after { width: 100%; }
  .nav-link.active { color: #06b6d4; }
  .nav-link.active::after { width: 100%; }
`;

// Cursor component (used in Layout only)
export function CyberCursor() {
  useEffect(() => {
    const dot  = document.getElementById("cyber-cursor-dot");
    const glow = document.getElementById("cyber-cursor-glow");
    const move = (e) => {
      if (dot)  dot.style.transform  = `translate(${e.clientX - 6}px, ${e.clientY - 6}px)`;
      if (glow) glow.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
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

// Scroll reveal hook
export function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("revealed"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// Section header component
export function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="reveal text-center mb-16">
      {eyebrow && (
        <p className="text-xs tracking-widest mb-4" style={{ color: "#06b6d4", fontFamily: "'DM Mono', monospace" }}>
          {eyebrow}
        </p>
      )}
      <h1 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "clamp(2.5rem, 6vw, 5rem)",
        color: "#f1f5f9",
        letterSpacing: "0.05em",
        lineHeight: 1,
      }}>
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 max-w-xl mx-auto" style={{ color: "#475569", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", lineHeight: 1.8 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Page wrapper — consistent bg + grid
export function PageWrapper({ children }) {
  return (
    <div className="relative min-h-screen" style={{ background: "#030712" }}>
      <div className="fixed inset-0 grid-bg pointer-events-none z-0" />
      <div className="fixed inset-0 scan-lines pointer-events-none z-0" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {children}
      </div>
    </div>
  );
}