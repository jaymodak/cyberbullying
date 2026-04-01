import { useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { darkTokens, lightTokens, useScrollReveal } from "../styles/cyber.jsx";
import { HistoryPanel } from "../components/HistoryModal.jsx";
// ── Donut chart component ─────────────────────────────────────────────────────
function DonutChart({ models, isDark }) {
  const t = isDark ? darkTokens : lightTokens;
  const colors = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b"];
  const size = 160;
  const cx = size / 2, cy = size / 2, r = 58, stroke = 22;
  const circ = 2 * Math.PI * r;

  const total = models.reduce((s, m) => s + m.probability, 0) || 1;
  let cumOffset = 0;

  const segments = models.map((m, i) => {
    const pct  = m.probability / total;
    const dash = pct * circ;
    const off  = circ - dash;
    const seg  = { dash, off, offset: cumOffset, color: colors[i % colors.length], ...m };
    cumOffset += dash;
    return seg;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* BG ring */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"} strokeWidth={stroke} />
          {segments.map((seg, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${seg.dash} ${circ - seg.dash}`}
              strokeDashoffset={circ - seg.offset}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)", filter: seg.probability > 0.6 ? `drop-shadow(0 0 6px ${seg.color})` : "none" }}
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.5rem", color: t.text, lineHeight: 1 }}>
            {Math.round((models.reduce((s, m) => s + m.probability, 0) / models.length) * 100)}%
          </span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.5rem", color: t.textDim, letterSpacing: "0.1em" }}>AVG SCORE</span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full space-y-2">
        {models.map((m, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: colors[i % colors.length] }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", color: t.textMuted, letterSpacing: "0.05em" }}>
                {m.modelName}
              </span>
            </div>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "0.85rem", color: colors[i % colors.length] }}>
              {Math.round(m.probability * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Animated progress bar ─────────────────────────────────────────────────────
function ConfidenceBar({ score, isDark }) {
  const t = isDark ? darkTokens : lightTokens;
  const [width, setWidth] = useState(0);
  const pct = Math.round(score * 100);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  const barColor = pct < 30 ? "#10b981" : pct < 70 ? "#f59e0b" : "#ef4444";
  const isHigh   = pct >= 70;

  return (
    <div className="space-y-3">
      {/* Score header */}
      <div className="flex items-end justify-between">
        <div>
          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", color: t.textDim, letterSpacing: "0.15em", marginBottom: "4px" }}>
            // CONFIDENCE SCORE
          </p>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "3rem", color: barColor, lineHeight: 1,
            textShadow: isHigh ? `0 0 20px ${barColor}88` : "none" }}>
            {pct}%
          </span>
        </div>
        {/* Gauge labels */}
        <div className="flex flex-col items-end gap-1">
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", color: barColor, letterSpacing: "0.1em" }}>
            {pct < 30 ? "SAFE" : pct < 70 ? "SUSPICIOUS" : "CYBERBULLYING"}
          </span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.55rem", color: t.textDim }}>
            FINAL ENSEMBLE SCORE
          </span>
        </div>
      </div>

      {/* Track */}
      <div className="relative rounded-full overflow-hidden" style={{ height: "12px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)" }}>
        {/* Zone markers */}
        <div className="absolute inset-0 flex">
          <div style={{ width: "30%", borderRight: `1px dashed ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }} />
          <div style={{ width: "40%", borderRight: `1px dashed ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }} />
        </div>
        {/* Fill */}
        <div style={{
          height: "100%",
          width: `${width}%`,
          background: `linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)`,
          backgroundSize: "333% 100%",
          backgroundPosition: `${100 - pct}% 0`,
          borderRadius: "999px",
          transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: isHigh ? `0 0 16px ${barColor}99` : "none",
        }} />
      </div>

      {/* Zone labels */}
      <div className="flex justify-between">
        {[["0%", "SAFE", "#10b981"], ["30%", "SUSPICIOUS", "#f59e0b"], ["70%", "BULLYING", "#ef4444"]].map(([pos, label, col]) => (
          <span key={label} style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.5rem", color: col, letterSpacing: "0.08em" }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Flagged words panel ───────────────────────────────────────────────────────
function FlaggedPanel({ text, flaggedKeywords, isDark }) {
  const t = isDark ? darkTokens : lightTokens;
  const [tooltip, setTooltip] = useState(null);

  if (!text || !flaggedKeywords) return null;

  // Build a set of flagged words with their categories
  const flagMap = {};
  flaggedKeywords.forEach(({ word, category }) => {
    flagMap[word.toLowerCase()] = category;
  });

  // Tokenize text — split into word-tokens keeping spaces/punctuation
  const tokens = text.split(/(\s+|[,.!?;:])/);

  return (
    <div className="space-y-3">
      <p style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", color: t.textDim, letterSpacing: "0.15em" }}>
        // FLAGGED CONTENT ANALYSIS
      </p>

      {/* Annotated text */}
      <div className="rounded-lg p-4 leading-relaxed relative" style={{
        border: `1px solid ${t.border}`,
        background: isDark ? "rgba(13,24,41,0.6)" : "rgba(241,245,249,0.8)",
        fontFamily: "'Rajdhani',sans-serif", fontSize: "1rem", color: t.text, lineHeight: 1.9,
      }}>
        {tokens.map((token, i) => {
          const clean   = token.replace(/[^a-zA-Z0-9\s]/g, "").toLowerCase().trim();
          const category = flagMap[clean];
          if (category) {
            return (
              <span key={i} className="relative inline-block"
                onMouseEnter={() => setTooltip({ idx: i, category })}
                onMouseLeave={() => setTooltip(null)}>
                <mark style={{
                  background: "rgba(239,68,68,0.18)",
                  color: "#ef4444",
                  borderRadius: "3px",
                  padding: "1px 4px",
                  border: "1px solid rgba(239,68,68,0.3)",
                  cursor: "default",
                }}>
                  {token}
                </mark>
                {tooltip?.idx === i && (
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap z-50"
                    style={{ background: isDark ? "#0f172a" : "#1e293b", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)", fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.08em" }}>
                    ⚠ {category.replace(/_/g, " ")}
                  </span>
                )}
              </span>
            );
          }
          return <span key={i}>{token}</span>;
        })}
      </div>

      {/* Category tags */}
      {flaggedKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...new Set(flaggedKeywords.map(f => f.category))].map((cat, i) => (
            <span key={i} className="px-2 py-1 rounded text-xs"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
              {cat.replace(/_/g, " ").toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {flaggedKeywords.length === 0 && (
        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.65rem", color: "#10b981" }}>
          ✓ No flagged keywords detected in rule engine
        </p>
      )}
    </div>
  );
}

// ── Per-model card ────────────────────────────────────────────────────────────
function ModelCard({ model, isDark, animDelay }) {
  const t  = isDark ? darkTokens : lightTokens;
  const pct = Math.round(model.probability * 100);
  const [w, setW] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setW(pct), 200 + animDelay);
    return () => clearTimeout(timer);
  }, [pct, animDelay]);

  const sevColor  = model.severity === "High" ? "#ef4444" : model.severity === "Medium" ? "#f59e0b" : "#10b981";
  const glassCls  = isDark ? "glass-card-dark" : "glass-card-light";

  return (
    <div className={`${glassCls} rounded-lg p-4 space-y-3 animate-fade-up`}
      style={{ animationDelay: `${animDelay}ms`,
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 30px ${sevColor}22`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)";   e.currentTarget.style.boxShadow = "none"; }}
    >
      <div className="flex items-center justify-between">
        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.55rem", color: t.textDim, letterSpacing: "0.15em" }}>
          // {model.modelName}
        </p>
        <span className="px-2 py-0.5 rounded text-xs"
          style={{ background: `${sevColor}15`, border: `1px solid ${sevColor}44`, color: sevColor, fontFamily: "'DM Mono',monospace", fontSize: "0.55rem", letterSpacing: "0.08em" }}>
          {model.severity?.toUpperCase()}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "2rem", color: sevColor, lineHeight: 1,
          textShadow: pct > 70 ? `0 0 15px ${sevColor}88` : "none" }}>
          {pct}%
        </span>
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: "0.8rem", color: t.textMuted }}>
          {model.category}
        </span>
      </div>

      <div className="rounded-full overflow-hidden" style={{ height: "4px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)" }}>
        <div style={{ height: "100%", width: `${w}%`, background: sevColor, borderRadius: "999px",
          transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: pct > 70 ? `0 0 8px ${sevColor}` : "none" }} />
      </div>
    </div>
  );
}

// ── Main Home page ────────────────────────────────────────────────────────────
export default function Home() {
  const { user, isDark } = useAuth();
  const t = isDark ? darkTokens : lightTokens;
  const fileInputRef = useRef(null);
  const helpMenuRef  = useRef(null);
  useScrollReveal();

  const platforms = [
    { id: "general",   name: "GENERAL" }, { id: "facebook",  name: "FACEBOOK" },
    { id: "twitter",   name: "TWITTER/X" }, { id: "instagram", name: "INSTAGRAM" },
  ];

  const [inputMode,     setInputMode]     = useState("text");
  const [platform,      setPlatform]      = useState("general");
  const [text,          setText]          = useState("");
  const [loading,       setLoading]       = useState(false);
  const [results,       setResults]       = useState(null);  // { models[], finalScore, category, severity, flaggedKeywords, analyzeText }
  const [dragOver,      setDragOver]      = useState(false);
  const [imageFile,     setImageFile]     = useState(null);
  const [imagePreview,  setImagePreview]  = useState(null);
  const [ocrLoading,    setOcrLoading]    = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [ocrDone,       setOcrDone]       = useState(false);
  const [isHelpOpen,    setIsHelpOpen]    = useState(false);

  useEffect(() => {
    const fn = (e) => { if (helpMenuRef.current && !helpMenuRef.current.contains(e.target)) setIsHelpOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const loadImage = (file) => {
    setImageFile(file); setExtractedText(""); setOcrDone(false); setResults(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) loadImage(file);
  }, []);

  const handleExtract = async () => {
    if (!imageFile) return;
    setOcrLoading(true); setExtractedText("");
    const fd = new FormData(); fd.append("image", imageFile);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/ocr`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OCR failed");
      setExtractedText(data.text || ""); setOcrDone(true);
    } catch (err) { alert(`OCR failed: ${err.message}`); }
    finally { setOcrLoading(false); }
  };

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    const analyzeText = inputMode === "image" ? extractedText : text;
    if (!analyzeText.trim()) { alert("Enter text to analyze"); return; }
    setLoading(true); setResults(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: analyzeText, platform, user_email: user?.email || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");
      if (!data.models) throw new Error("No models returned");

      const modelsArray = Object.entries(data.models).map(([key, value]) => ({
        modelName: key.replace(/_/g, " ").toUpperCase(), ...value,
      }));
      setResults({ models: modelsArray, finalScore: data.final_score, category: data.category, severity: data.severity, flaggedKeywords: data.flagged_keywords || [], analyzeText });

      const highRisk = modelsArray.some(r => r.severity === "High");
      if (user && highRisk) {
        fetch(`${import.meta.env.VITE_API_URL}/api/send-safety-email`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, name: user.name, text: analyzeText }),
        }).catch(console.error);
      }
    } catch (err) { alert(`Analysis failed: ${err.message}`); }
    finally { setLoading(false); }
  };

  const mono  = { fontFamily: "'DM Mono', monospace" };
  const raj   = { fontFamily: "'Rajdhani', sans-serif" };
  const bebas = { fontFamily: "'Bebas Neue', sans-serif" };

  return (
    <div className="relative" style={{ minHeight: "100vh", ...mono }}>

      {/* Help button */}
      <div className="flex justify-end px-6 pt-6 pb-2">
        <div className="relative" ref={helpMenuRef}>
          <button onClick={() => setIsHelpOpen(!isHelpOpen)}
            className={`${t.btnClass} px-4 py-2 text-xs tracking-widest flex items-center gap-2`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            EMERGENCY HELP
          </button>
          {isHelpOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded z-50 overflow-hidden"
              style={{ border: `1px solid rgba(239,68,68,0.25)`, background: isDark ? "#030712" : "#f1f5f9", boxShadow: "0 0 30px rgba(239,68,68,0.1)" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
                <p style={{ color: "#ef4444", ...raj, fontWeight: 700, letterSpacing: "0.1em", fontSize: "0.8rem" }}>// CRISIS RESOURCES</p>
              </div>
              {[
                { name: "Aasra Helpline", num: "9820466726", tag: "24x7", href: "tel:9820466726" },
                { name: "Vandrevala Foundation", num: "9999 666 555", tag: "24x7", href: "tel:9999666555" },
                { name: "Kiran Mental Health", num: "1800-599-0019", tag: "Free", href: "tel:18005990019" },
                { name: "Cyber Crime Helpline", num: "Dial 1930", tag: "Gov", href: "tel:1930" },
                { name: "Mumbai Police", num: "Dial 100", tag: "Emergency", href: "tel:100" },
              ].map((r, i) => (
                <a key={i} href={r.href} className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: "1px solid rgba(6,182,212,0.05)", textDecoration: "none" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(6,182,212,0.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div>
                    <p style={{ color: t.textMuted, fontSize: "0.75rem", fontWeight: 600, ...raj }}>{r.name}</p>
                    <p style={{ color: t.textDim, fontSize: "0.65rem", ...mono }}>{r.num}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded" style={{ border: `1px solid ${t.border}`, color: t.accent, fontSize: "0.6rem", ...mono }}>{r.tag}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Page title */}
      <div className="reveal px-6 text-center mb-8">
        <p style={{ color: t.accent, fontSize: "0.7rem", letterSpacing: "0.15em", ...mono, marginBottom: "8px" }}>// ANALYSIS ENGINE</p>
        <h1 style={{ ...bebas, fontSize: "clamp(3rem,8vw,6rem)", color: t.text, letterSpacing: "0.05em", lineHeight: 1 }}>
          ANALYZE <span style={{ color: t.accent }}>PAYLOAD</span>
        </h1>
      </div>

      <div className="px-6 pb-12">
        {/* ── TOP ROW: Input + Confidence ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">

          {/* Input panel */}
          <section className="reveal lg:col-span-5">
            <div className="rounded-lg p-5 h-full" style={{ border: `1px solid ${t.border}`, background: t.bgCard }}>

              {/* Mode toggle */}
              <div className="flex rounded overflow-hidden mb-5" style={{ border: `1px solid ${t.border}` }}>
                {[{ id: "text", label: "// TEXT INPUT" }, { id: "image", label: "// SCREENSHOT" }].map((m) => (
                  <button key={m.id} onClick={() => { setInputMode(m.id); setResults(null); }}
                    className="flex-1 py-2.5 text-xs tracking-widest transition-all duration-200"
                    style={{ ...mono, background: inputMode === m.id ? t.accentBg : "transparent", color: inputMode === m.id ? t.accent : t.textDim, borderRight: m.id === "text" ? `1px solid ${t.border}` : "none", fontWeight: inputMode === m.id ? 600 : 400 }}>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Platform */}
              <div className="mb-5">
                <p style={{ color: t.textDim, fontSize: "0.6rem", letterSpacing: "0.15em", ...mono, marginBottom: "8px" }}>SELECT PLATFORM</p>
                <div className="grid grid-cols-2 gap-2">
                  {platforms.map((p) => (
                    <button key={p.id} onClick={() => setPlatform(p.id)}
                      className="py-2 px-3 rounded text-xs tracking-widest transition-all duration-200"
                      style={{ ...mono, border: platform === p.id ? `1px solid ${t.accent}` : `1px solid ${t.border}`, background: platform === p.id ? t.accentBg : t.bgCard, color: platform === p.id ? t.accent : t.textDim }}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {inputMode === "text" && (
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <textarea rows="7"
                    className={`w-full p-4 resize-none ${t.inputClass}`}
                    placeholder="// paste comment, post, or message..."
                    value={text} onChange={(e) => setText(e.target.value)}
                  />
                  <button type="submit" disabled={loading}
                    className={`w-full py-3 text-sm tracking-widest flex items-center justify-center gap-3 ${t.btnClass}`}
                    style={{ opacity: loading ? 0.6 : 1 }}>
                    {loading ? <><div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: t.border, borderTopColor: t.accent }} />RUNNING ENSEMBLE...</> : "▶ RUN ANALYSIS MODELS"}
                  </button>
                </form>
              )}

              {inputMode === "image" && (
                <div className="space-y-4">
                  {!imagePreview ? (
                    <div onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                      onClick={() => fileInputRef.current?.click()} className="rounded p-8 text-center transition-all duration-200"
                      style={{ border: `2px dashed ${dragOver ? t.accent : t.border}`, background: dragOver ? t.accentBg : "transparent", transform: dragOver ? "scale(1.01)" : "scale(1)" }}>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && loadImage(e.target.files[0])} />
                      <p style={{ color: t.accent, fontSize: "0.75rem", ...mono }}>DROP SCREENSHOT HERE</p>
                      <p style={{ color: t.textDim, fontSize: "0.6rem", marginTop: "4px", ...mono }}>or click to browse · PNG JPG WEBP</p>
                    </div>
                  ) : (
                    <div className="rounded overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
                      <div className="relative">
                        <img src={imagePreview} alt="Uploaded" className="w-full object-cover" style={{ maxHeight: "140px" }} />
                        <button onClick={() => { setImageFile(null); setImagePreview(null); setExtractedText(""); setOcrDone(false); setResults(null); }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{ background: "rgba(0,0,0,0.7)", color: "#94a3b8" }}>✕</button>
                      </div>
                    </div>
                  )}
                  {imagePreview && !ocrDone && (
                    <button onClick={handleExtract} disabled={ocrLoading}
                      className={`w-full py-3 text-xs tracking-widest flex items-center justify-center gap-2 ${t.btnClass}`}
                      style={{ opacity: ocrLoading ? 0.6 : 1 }}>
                      {ocrLoading ? <><div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: t.border, borderTopColor: t.accent }} />EXTRACTING...</> : "▶ EXTRACT TEXT FROM SCREENSHOT"}
                    </button>
                  )}
                  {ocrDone && (
                    <div className="space-y-3">
                      <p style={{ color: "#10b981", fontSize: "0.65rem", ...mono }}>✓ TEXT EXTRACTED — EDIT IF NEEDED</p>
                      <textarea rows="5" className={`w-full p-4 resize-none ${t.inputClass}`} value={extractedText} onChange={(e) => setExtractedText(e.target.value)} placeholder="// extracted text..." />
                      <button onClick={handleAnalyze} disabled={loading || !extractedText.trim()}
                        className={`w-full py-3 text-xs tracking-widest flex items-center justify-center gap-2 ${t.btnClass}`}
                        style={{ opacity: (loading || !extractedText.trim()) ? 0.5 : 1 }}>
                        {loading ? "RUNNING ENSEMBLE..." : "▶ ANALYZE EXTRACTED TEXT"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Confidence + Donut */}
          <section className="reveal delay-1 lg:col-span-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">

              {/* Confidence bar card */}
              <div className={`rounded-lg p-5 ${isDark ? "glass-card-dark" : "glass-card-light"}`}>
                {results ? (
                  <ConfidenceBar score={results.finalScore} isDark={isDark} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ border: `1px solid ${t.border}`, background: t.bgCard }}>
                      <svg className="w-6 h-6 opacity-20" style={{ color: t.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p style={{ color: t.textDim, ...mono, fontSize: "0.65rem", letterSpacing: "0.1em" }}>// AWAITING ANALYSIS</p>
                  </div>
                )}
              </div>

              {/* Donut chart card */}
              <div className={`rounded-lg p-5 ${isDark ? "glass-card-dark" : "glass-card-light"}`}>
                {results ? (
                  <>
                    <p style={{ color: t.textDim, ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", marginBottom: "12px" }}>// MODEL COMPARISON</p>
                    <DonutChart models={results.models} isDark={isDark} />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ border: `1px solid ${t.border}`, background: t.bgCard }}>
                      <svg className="w-6 h-6 opacity-20" style={{ color: t.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                      </svg>
                    </div>
                    <p style={{ color: t.textDim, ...mono, fontSize: "0.65rem", letterSpacing: "0.1em" }}>// MODEL CHART</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ── BOTTOM ROW: Per-model cards + Flagged words ───────────────────── */}
        {results && (
          <>
            {/* Per-model cards */}
            <div className="reveal grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {results.models.map((model, i) => (
                <ModelCard key={i} model={model} isDark={isDark} animDelay={i * 100} />
              ))}
            </div>

            {/* Flagged words panel */}
            <div className="reveal">
              <div className={`rounded-lg p-6 ${isDark ? "glass-card-dark" : "glass-card-light"}`}>
                <FlaggedPanel text={results.analyzeText} flaggedKeywords={results.flaggedKeywords} isDark={isDark} />
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!results && !loading && (
          <div className="reveal text-center py-16" style={{ border: `1px solid ${t.border}`, borderRadius: "8px", background: t.bgCard }}>
            <p style={{ color: t.textDim, ...mono, fontSize: "0.7rem", letterSpacing: "0.1em" }}>// SUBMIT TEXT ABOVE TO RUN ENSEMBLE ANALYSIS</p>
          </div>
        )}
        {loading && (
          <div className="text-center py-16">
            <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: t.border, borderTopColor: t.accent }} />
            <p style={{ color: t.accent, ...mono, fontSize: "0.7rem", letterSpacing: "0.15em", marginTop: "12px" }}>RUNNING MODELS...</p>
          </div>
        )}
        <HistoryPanel userEmail={user?.email} isDark={isDark} />
      </div>
    </div>
  );
}