import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Cursor glow component ─────────────────────────────────────────────────────
function CursorGlow() {
  const cursorRef = useRef(null);
  const glowRef   = useRef(null);

  useEffect(() => {
    const move = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX - 6}px, ${e.clientY - 6}px)`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <>
      {/* Small sharp cursor dot */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-3 h-3 rounded-full bg-cyan-400 pointer-events-none z-[9999] mix-blend-difference"
        style={{ transition: "transform 0.05s linear" }}
      />
      {/* Large ambient glow */}
      <div
        ref={glowRef}
        className="fixed top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none z-[9998]"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)",
          transition: "transform 0.15s ease-out",
        }}
      />
    </>
  );
}

// ── Scroll reveal hook ────────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = to / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= to) { setCount(to); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Glitch text ───────────────────────────────────────────────────────────────
function GlitchText({ text, className }) {
  return (
    <span className={`relative inline-block ${className}`} data-text={text}
      style={{ "--glitch-text": `"${text}"` }}>
      {text}
      <style>{`
        [data-text]::before, [data-text]::after {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
        }
        [data-text]::before {
          animation: glitch1 3.5s infinite;
          color: #06b6d4;
          clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%);
        }
        [data-text]::after {
          animation: glitch2 3.5s infinite;
          color: #ef4444;
          clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%);
        }
        @keyframes glitch1 {
          0%,90%,100% { transform: translate(0); opacity: 0; }
          92% { transform: translate(-3px, 1px); opacity: 0.8; }
          94% { transform: translate(3px, -1px); opacity: 0.8; }
          96% { transform: translate(0); opacity: 0; }
        }
        @keyframes glitch2 {
          0%,90%,100% { transform: translate(0); opacity: 0; }
          93% { transform: translate(3px, 1px); opacity: 0.7; }
          95% { transform: translate(-3px, -1px); opacity: 0.7; }
          97% { transform: translate(0); opacity: 0; }
        }
      `}</style>
    </span>
  );
}

// ── Scan line overlay ─────────────────────────────────────────────────────────
function ScanLines() {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.03]"
      style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
      }}
    />
  );
}

// ── Floating particles ────────────────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 10,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-cyan-400/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `float-particle ${p.duration}s ${p.delay}s ease-in-out infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes float-particle {
          0%   { transform: translate(0, 0) scale(1); opacity: 0.3; }
          100% { transform: translate(${Math.random() > 0.5 ? "" : "-"}30px, -40px) scale(1.5); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  useScrollReveal();

  const features = [
    {
      icon: "⚡",
      title: "Real-Time Detection",
      desc: "Three ML models analyze content simultaneously — toxic-bert, twitter-roberta, and zero-shot classification working in parallel.",
      color: "cyan",
    },
    {
      icon: "🧠",
      title: "Zero-Shot Intelligence",
      desc: "Understands sarcasm, exclusion, and indirect harassment that keyword filters completely miss.",
      color: "violet",
    },
    {
      icon: "📸",
      title: "Screenshot Analysis",
      desc: "Upload any social media screenshot. OCR extracts text, you confirm it, then run the full model ensemble.",
      color: "emerald",
    },
    {
      icon: "🛡",
      title: "Multi-Platform",
      desc: "Context-aware detection tuned for Facebook, Twitter/X, Instagram, and general text.",
      color: "red",
    },
    {
      icon: "📧",
      title: "Instant Alerts",
      desc: "High-severity detections trigger personalized safety emails to logged-in users automatically.",
      color: "amber",
    },
    {
      icon: "🔒",
      title: "Private & Secure",
      desc: "Google OAuth authentication. Your analysis history is tied to your account only.",
      color: "blue",
    },
  ];

  const colorMap = {
    cyan:    { border: "#06b6d4", bg: "rgba(6,182,212,0.06)",   text: "#67e8f9" },
    violet:  { border: "#8b5cf6", bg: "rgba(139,92,246,0.06)",  text: "#c4b5fd" },
    emerald: { border: "#10b981", bg: "rgba(16,185,129,0.06)",  text: "#6ee7b7" },
    red:     { border: "#ef4444", bg: "rgba(239,68,68,0.06)",   text: "#fca5a5" },
    amber:   { border: "#f59e0b", bg: "rgba(245,158,11,0.06)",  text: "#fcd34d" },
    blue:    { border: "#3b82f6", bg: "rgba(59,130,246,0.06)",  text: "#93c5fd" },
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background: "#030712", fontFamily: "'DM Mono', 'Courier New', monospace", cursor: "none" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');

        * { cursor: none !important; }

        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal.revealed { opacity: 1; transform: translateY(0); }
        .reveal-left  { opacity: 0; transform: translateX(-50px); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1); }
        .reveal-left.revealed  { opacity: 1; transform: translateX(0); }
        .reveal-right { opacity: 0; transform: translateX(50px);  transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1); }
        .reveal-right.revealed { opacity: 1; transform: translateX(0); }

        .delay-1 { transition-delay: 0.1s; }
        .delay-2 { transition-delay: 0.2s; }
        .delay-3 { transition-delay: 0.3s; }
        .delay-4 { transition-delay: 0.4s; }
        .delay-5 { transition-delay: 0.5s; }

        .cyber-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .cyber-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(6,182,212,0.2), transparent);
          transition: left 0.5s ease;
        }
        .cyber-btn:hover::before { left: 100%; }
        .cyber-btn:hover { box-shadow: 0 0 30px rgba(6,182,212,0.4), inset 0 0 30px rgba(6,182,212,0.05); }

        .feature-card {
          position: relative;
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          overflow: hidden;
        }
        .feature-card::after {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.4s ease;
          background: radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(6,182,212,0.08), transparent 60%);
        }
        .feature-card:hover { transform: translateY(-6px); }
        .feature-card:hover::after { opacity: 1; }

        .terminal-text {
          border-right: 2px solid #06b6d4;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 50% { border-color: transparent; } }

        .grid-bg {
          background-image:
            linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .hero-glow {
          animation: hero-pulse 4s ease-in-out infinite;
        }
        @keyframes hero-pulse {
          0%,100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 0.7; transform: scale(1.05); }
        }

        .stat-card {
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: scale(1.05);
          border-color: rgba(6,182,212,0.5) !important;
          box-shadow: 0 0 20px rgba(6,182,212,0.15);
        }

        .nav-link {
          position: relative;
          transition: color 0.2s;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0;
          width: 0; height: 1px;
          background: #06b6d4;
          transition: width 0.3s ease;
        }
        .nav-link:hover::after { width: 100%; }
        .nav-link:hover { color: #06b6d4; }

        .shield-rotate {
          animation: shield-spin 20s linear infinite;
        }
        @keyframes shield-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .model-pill {
          transition: all 0.3s ease;
        }
        .model-pill:hover {
          background: rgba(6,182,212,0.15);
          border-color: rgba(6,182,212,0.6);
          transform: scale(1.05);
        }
      `}</style>

      <CursorGlow />
      <ScanLines />
      <Particles />

      {/* Grid background */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0" />

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-4"
        style={{ borderBottom: "1px solid rgba(6,182,212,0.1)", background: "rgba(3,7,18,0.8)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ border: "1px solid rgba(6,182,212,0.5)", background: "rgba(6,182,212,0.1)" }}>
              <span className="text-cyan-400 text-sm font-bold">S</span>
            </div>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#e2e8f0", letterSpacing: "0.05em" }}>
              SHIELD<span style={{ color: "#06b6d4" }}>AI</span>
            </span>
          </div>

          <div className="flex items-center gap-8">
            {["Features", "Models", "Stats"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="nav-link text-sm"
                style={{ color: "#94a3b8", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", letterSpacing: "0.1em" }}>
                {item.toUpperCase()}
              </a>
            ))}
            <button
              onClick={() => navigate("/app")}
              className="cyber-btn px-5 py-2 text-xs font-semibold tracking-widest"
              style={{
                border: "1px solid rgba(6,182,212,0.5)",
                color: "#06b6d4",
                background: "rgba(6,182,212,0.05)",
                borderRadius: "4px",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.15em",
              }}>
              LAUNCH APP →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">

        {/* Background glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full hero-glow pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 65%)" }} />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)", animation: "hero-pulse 6s ease-in-out infinite 2s" }} />

        {/* Badge */}
        <div className="reveal mb-8 flex items-center gap-2 px-4 py-2 rounded-full text-xs tracking-widest"
          style={{ border: "1px solid rgba(6,182,212,0.3)", background: "rgba(6,182,212,0.05)", color: "#67e8f9", fontFamily: "'DM Mono', monospace" }}>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          AI-POWERED CYBERBULLYING DETECTION
        </div>

        {/* Main headline */}
        <div className="reveal delay-1 text-center mb-6" style={{ maxWidth: "900px" }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(4rem, 12vw, 9rem)",
            lineHeight: 0.9,
            letterSpacing: "0.02em",
            color: "#f1f5f9",
          }}>
            DETECT.{" "}
            <GlitchText text="PROTECT." className="text-cyan-400" />
            {" "}ACT.
          </h1>
        </div>

        {/* Subheadline */}
        <p className="reveal delay-2 text-center mb-10 max-w-xl"
          style={{ color: "#64748b", fontFamily: "'Rajdhani', sans-serif", fontSize: "1.1rem", lineHeight: 1.7, letterSpacing: "0.03em" }}>
          Three ML models working in unison to catch explicit threats, subtle exclusion,
          and sarcastic harassment across every social platform.
        </p>

        {/* CTA buttons */}
        <div className="reveal delay-3 flex items-center gap-4 mb-16">
          <button
            onClick={() => navigate("/app")}
            className="cyber-btn px-8 py-4 font-bold tracking-widest text-sm"
            style={{
              background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.05))",
              border: "1px solid rgba(6,182,212,0.6)",
              color: "#06b6d4",
              borderRadius: "4px",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.9rem",
              letterSpacing: "0.15em",
            }}>
            ▶ LAUNCH ANALYZER
          </button>
          <a href="#features"
            className="px-8 py-4 font-bold tracking-widest text-sm transition-all duration-300 hover:text-cyan-400"
            style={{
              border: "1px solid rgba(148,163,184,0.2)",
              color: "#94a3b8",
              borderRadius: "4px",
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: "0.15em",
            }}>
            SEE HOW IT WORKS ↓
          </a>
        </div>

        {/* Model pills */}
        <div className="reveal delay-4 flex flex-wrap justify-center gap-3 mb-16">
          {[
            { name: "TOXIC-BERT", desc: "Explicit threats" },
            { name: "TWITTER-ROBERTA", desc: "Social media" },
            { name: "ZERO-SHOT NLI", desc: "Sarcasm & exclusion" },
            { name: "RULE ENGINE", desc: "Keyword patterns" },
          ].map((m) => (
            <div key={m.name} className="model-pill px-4 py-2 rounded text-xs"
              style={{
                border: "1px solid rgba(6,182,212,0.2)",
                background: "rgba(6,182,212,0.03)",
                fontFamily: "'DM Mono', monospace",
              }}>
              <span style={{ color: "#06b6d4" }}>{m.name}</span>
              <span style={{ color: "#475569" }}> · {m.desc}</span>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="reveal delay-5 flex flex-col items-center gap-2" style={{ color: "#334155" }}>
          <span className="text-xs tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>SCROLL</span>
          <div className="w-px h-12 relative overflow-hidden" style={{ background: "rgba(6,182,212,0.1)" }}>
            <div className="absolute top-0 w-full bg-cyan-400"
              style={{ height: "40%", animation: "scroll-line 2s ease-in-out infinite" }} />
          </div>
          <style>{`
            @keyframes scroll-line {
              0%   { top: -40%; }
              100% { top: 140%; }
            }
          `}</style>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section id="stats" className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: 3, suffix: "", label: "ML MODELS" },
              { value: 58, suffix: "M+", label: "TWEETS TRAINED ON" },
              { value: 99, suffix: "%", label: "EXPLICIT ACCURACY" },
              { value: 4, suffix: "", label: "PLATFORMS" },
            ].map((s, i) => (
              <div key={i} className={`reveal stat-card delay-${i + 1} p-6 rounded-lg text-center`}
                style={{ border: "1px solid rgba(6,182,212,0.12)", background: "rgba(6,182,212,0.02)" }}>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "3rem",
                  color: "#06b6d4",
                  lineHeight: 1,
                }}>
                  <Counter to={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-2 text-xs tracking-widest" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="reveal text-center mb-16">
            <p className="text-xs tracking-widest mb-4" style={{ color: "#06b6d4", fontFamily: "'DM Mono', monospace" }}>
              // CAPABILITIES
            </p>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              color: "#f1f5f9",
              letterSpacing: "0.05em",
            }}>
              BUILT TO CATCH WHAT OTHERS MISS
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const c = colorMap[f.color];
              return (
                <div
                  key={i}
                  className={`reveal feature-card delay-${(i % 3) + 1} p-6 rounded-lg`}
                  style={{ border: `1px solid ${c.border}22`, background: c.bg }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
                    e.currentTarget.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
                  }}
                >
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-bold mb-2" style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "1.1rem",
                    color: c.text,
                    letterSpacing: "0.05em",
                  }}>
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem" }}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="models" className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="reveal text-center mb-16">
            <p className="text-xs tracking-widest mb-4" style={{ color: "#06b6d4", fontFamily: "'DM Mono', monospace" }}>
              // PIPELINE
            </p>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              color: "#f1f5f9",
              letterSpacing: "0.05em",
            }}>
              HOW THE MODELS WORK
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px"
              style={{ background: "linear-gradient(to bottom, transparent, rgba(6,182,212,0.4), transparent)" }} />

            {[
              { step: "01", title: "INPUT", desc: "Paste text or upload a social media screenshot. OCR extracts the text for you.", color: "#06b6d4" },
              { step: "02", title: "RULE ENGINE", desc: "Pattern matching against platform-specific keyword database in MongoDB.", color: "#8b5cf6" },
              { step: "03", title: "TOXIC-BERT", desc: "Transformer model flags explicit threats, slurs, and hate speech with high confidence.", color: "#ef4444" },
              { step: "04", title: "TWITTER-ROBERTA", desc: "Trained on 58M tweets — catches subtle social media bullying and indirect harassment.", color: "#10b981" },
              { step: "05", title: "ZERO-SHOT NLI", desc: "Semantic understanding model reads intent. Catches sarcasm and exclusion others miss.", color: "#f59e0b" },
              { step: "06", title: "ENSEMBLE VERDICT", desc: "Weighted combination of all signals. Final score determines Safe / Suspicious / Cyberbullying.", color: "#06b6d4" },
            ].map((s, i) => (
              <div key={i} className={`reveal delay-${(i % 3) + 1} relative flex gap-8 mb-8 pl-16`}>
                {/* Node dot */}
                <div className="absolute left-0 top-0 w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    border: `1px solid ${s.color}55`,
                    background: `${s.color}11`,
                    color: s.color,
                    fontFamily: "'DM Mono', monospace",
                  }}>
                  {s.step}
                </div>

                <div className="flex-1 pb-8"
                  style={{ borderBottom: i < 5 ? "1px solid rgba(6,182,212,0.06)" : "none" }}>
                  <h3 className="font-bold mb-1" style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "1rem",
                    color: s.color,
                    letterSpacing: "0.1em",
                  }}>
                    {s.title}
                  </h3>
                  <p className="text-sm" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", lineHeight: 1.7 }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative py-32 px-6 text-center">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(6,182,212,0.07), transparent)" }} />

        <div className="reveal max-w-3xl mx-auto">
          <p className="text-xs tracking-widest mb-6" style={{ color: "#06b6d4", fontFamily: "'DM Mono', monospace" }}>
            // READY TO BEGIN
          </p>
          <h2 className="mb-6" style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(3rem, 8vw, 7rem)",
            color: "#f1f5f9",
            lineHeight: 0.95,
            letterSpacing: "0.02em",
          }}>
            ANALYZE YOUR<br />
            <span style={{ color: "#06b6d4" }}>FIRST PAYLOAD</span>
          </h2>
          <p className="mb-10 text-sm" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
            No setup. No API keys. Sign in with Google and run your first analysis in seconds.
          </p>
          <button
            onClick={() => navigate("/app")}
            className="cyber-btn px-12 py-5 text-sm font-bold tracking-widest"
            style={{
              background: "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(6,182,212,0.08))",
              border: "1px solid rgba(6,182,212,0.7)",
              color: "#06b6d4",
              borderRadius: "4px",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "1rem",
              letterSpacing: "0.2em",
              boxShadow: "0 0 40px rgba(6,182,212,0.15)",
            }}>
            ▶ LAUNCH CYBERSHIELD
          </button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 text-center"
        style={{ borderTop: "1px solid rgba(6,182,212,0.08)" }}>
        <p className="text-xs" style={{ color: "#1e293b", fontFamily: "'DM Mono', monospace" }}>
          Built by{" "}
          <span style={{ color: "#06b6d4" }}>Sameer Kumar</span>
          {" & "}
          <span style={{ color: "#06b6d4" }}>Jay Modak</span>
          {" · "}
          <span>© {new Date().getFullYear()} Cybershield</span>
        </p>
      </footer>
    </div>
  );
}