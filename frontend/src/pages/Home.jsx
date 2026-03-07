import { useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useScrollReveal, SectionHeader } from "../styles/cyber.jsx";

export default function Home() {
  const helpMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isHelpOpen,    setIsHelpOpen]    = useState(false);
  const { user } = useAuth();

  const platforms = [
    { id: "general",   name: "GENERAL" },
    { id: "facebook",  name: "FACEBOOK" },
    { id: "twitter",   name: "TWITTER/X" },
    { id: "instagram", name: "INSTAGRAM" },
  ];

  const [inputMode,     setInputMode]     = useState("text");
  const [platform,      setPlatform]      = useState("facebook");
  const [text,          setText]          = useState("");
  const [loading,       setLoading]       = useState(false);
  const [results,       setResults]       = useState(null);
  const [dragOver,      setDragOver]      = useState(false);
  const [imageFile,     setImageFile]     = useState(null);
  const [imagePreview,  setImagePreview]  = useState(null);
  const [ocrLoading,    setOcrLoading]    = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [ocrDone,       setOcrDone]       = useState(false);

  useScrollReveal();

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
    const formData = new FormData();
    formData.append("image", imageFile);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/ocr`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OCR failed");
      setExtractedText(data.text || "");
      setOcrDone(true);
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
        body: JSON.stringify({ text: analyzeText, user_email: user?.email || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");
      if (!data.models) throw new Error("No models returned from server");
      const modelsArray = Object.entries(data.models).map(([key, value]) => ({
        modelName: key.replace(/_/g, " ").toUpperCase(), ...value,
      }));
      setResults(modelsArray);
      const highRisk = modelsArray.some(r => r.severity === "High");
      if (user && highRisk) {
        fetch(`${import.meta.env.VITE_API_URL}/api/send-safety-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, name: user.name, text: analyzeText }),
        }).catch(console.error);
      }
    } catch (err) { alert(`Analysis failed: ${err.message}`); }
    finally { setLoading(false); }
  };

  const sevColor  = (s) => s === "High" ? "#ef4444" : s === "Medium" ? "#f59e0b" : "#10b981";
  const sevBorder = (s) => s === "High" ? "rgba(239,68,68,0.35)" : s === "Medium" ? "rgba(245,158,11,0.35)" : "rgba(16,185,129,0.35)";
  const sevBg     = (s) => s === "High" ? "rgba(239,68,68,0.04)"  : s === "Medium" ? "rgba(245,158,11,0.04)"  : "rgba(16,185,129,0.04)";

  const mono  = { fontFamily: "'DM Mono', monospace" };
  const raj   = { fontFamily: "'Rajdhani', sans-serif" };
  const bebas = { fontFamily: "'Bebas Neue', sans-serif" };

  return (
    <div className="relative" style={{ minHeight: "100vh", ...mono }}>

      {/* Help button */}
      <div className="flex justify-end px-6 pt-6 pb-2">
        <div className="relative" ref={helpMenuRef}>
          <button onClick={() => setIsHelpOpen(!isHelpOpen)}
            className="cyber-btn px-4 py-2 text-xs tracking-widest flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            EMERGENCY HELP
          </button>

          {isHelpOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded z-50"
              style={{ border: "1px solid rgba(239,68,68,0.25)", background: "#030712", boxShadow: "0 0 30px rgba(239,68,68,0.1)" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
                <p style={{ color: "#ef4444", ...raj, fontWeight: 700, letterSpacing: "0.1em", fontSize: "0.8rem" }}>// CRISIS RESOURCES</p>
              </div>
              {[
                { name: "Aasra Helpline", num: "9820466726", tag: "24x7", href: "tel:9820466726" },
                { name: "Vandrevala Foundation", num: "9999 666 555", tag: "24x7", href: "tel:9999666555" },
                { name: "Kiran Mental Health", num: "1800-599-0019", tag: "Free", href: "tel:18005990019" },
                { name: "Cyber Crime Helpline", num: "Dial 1930", tag: "Gov", href: "tel:1930", danger: true },
                { name: "Mumbai Police", num: "Dial 100", tag: "Emergency", href: "tel:100" },
              ].map((r, i) => (
                <a key={i} href={r.href}
                  className="flex items-center justify-between px-4 py-2.5 transition-colors"
                  style={{ borderBottom: "1px solid rgba(6,182,212,0.05)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(6,182,212,0.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div>
                    <p style={{ color: r.danger ? "#ef4444" : "#94a3b8", fontSize: "0.75rem", fontWeight: 600, ...raj }}>
                      {r.name}
                    </p>
                    <p style={{ color: "#334155", fontSize: "0.65rem", ...mono }}>{r.num}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded"
                    style={{ border: "1px solid rgba(6,182,212,0.2)", color: "#06b6d4", fontSize: "0.6rem", ...mono }}>
                    {r.tag}
                  </span>
                </a>
              ))}
              <a href="https://cybercrime.gov.in/" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(6,182,212,0.03)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <p style={{ color: "#06b6d4", fontSize: "0.75rem", fontWeight: 600, ...raj }}>National Cyber Crime Portal →</p>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Page title */}
      <div className="reveal px-6 text-center mb-10">
        <p style={{ color: "#06b6d4", fontSize: "0.7rem", letterSpacing: "0.15em", ...mono, marginBottom: "8px" }}>
          // ANALYSIS ENGINE
        </p>
        <h1 style={{ ...bebas, fontSize: "clamp(3rem,8vw,6rem)", color: "#f1f5f9", letterSpacing: "0.05em", lineHeight: 1 }}>
          ANALYZE <span style={{ color: "#06b6d4" }}>PAYLOAD</span>
        </h1>
        <p style={{ color: "#334155", fontSize: "0.75rem", marginTop: "8px", ...mono }}>
          Multi-model cyberbullying detection — rule engine + toxic-bert + twitter-roberta + zero-shot NLI
        </p>
      </div>

      <div className="px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">

        {/* ── INPUT PANEL ─────────────────────────────────────────────── */}
        <section className="reveal lg:col-span-5">
          <div className="rounded" style={{ border: "1px solid rgba(6,182,212,0.15)", background: "rgba(6,182,212,0.02)", padding: "1.5rem" }}>

            {/* Mode toggle */}
            <div className="flex rounded mb-6 overflow-hidden" style={{ border: "1px solid rgba(6,182,212,0.15)" }}>
              {[
                { id: "text",  label: "// TEXT INPUT" },
                { id: "image", label: "// SCREENSHOT" },
              ].map((m) => (
                <button key={m.id} onClick={() => { setInputMode(m.id); setResults(null); }}
                  className="flex-1 py-2.5 text-xs tracking-widest transition-all duration-200"
                  style={{
                    ...mono,
                    background: inputMode === m.id ? "rgba(6,182,212,0.15)" : "transparent",
                    color:      inputMode === m.id ? "#06b6d4" : "#334155",
                    borderRight: m.id === "text" ? "1px solid rgba(6,182,212,0.15)" : "none",
                    fontWeight: inputMode === m.id ? 600 : 400,
                  }}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Platform selector */}
            <div className="mb-6">
              <p style={{ color: "#334155", fontSize: "0.65rem", letterSpacing: "0.15em", ...mono, marginBottom: "8px" }}>
                SELECT PLATFORM
              </p>
              <div className="grid grid-cols-2 gap-2">
                {platforms.map((p) => (
                  <button key={p.id} onClick={() => setPlatform(p.id)}
                    className="py-2 px-3 rounded text-xs tracking-widest transition-all duration-200"
                    style={{
                      ...mono,
                      border: platform === p.id ? "1px solid rgba(6,182,212,0.6)" : "1px solid rgba(6,182,212,0.1)",
                      background: platform === p.id ? "rgba(6,182,212,0.12)" : "rgba(6,182,212,0.02)",
                      color: platform === p.id ? "#06b6d4" : "#334155",
                    }}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ── TEXT MODE ── */}
            {inputMode === "text" && (
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <p style={{ color: "#334155", fontSize: "0.65rem", letterSpacing: "0.15em", ...mono, marginBottom: "8px" }}>
                    INPUT TEXT
                  </p>
                  <textarea rows="7"
                    className="cyber-input w-full p-4 resize-none"
                    placeholder="// paste comment, post, or message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="cyber-btn w-full py-3 text-sm tracking-widest flex items-center justify-center gap-3"
                  style={{ opacity: loading ? 0.6 : 1 }}>
                  {loading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-t-cyan-400 animate-spin"
                      style={{ borderColor: "rgba(6,182,212,0.2)", borderTopColor: "#06b6d4" }} />
                    RUNNING ENSEMBLE...</>
                  ) : "▶ RUN ANALYSIS MODELS"}
                </button>
              </form>
            )}

            {/* ── IMAGE MODE ── */}
            {inputMode === "image" && (
              <div className="space-y-4">
                {!imagePreview ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded p-8 text-center transition-all duration-200"
                    style={{
                      border: `2px dashed ${dragOver ? "rgba(6,182,212,0.7)" : "rgba(6,182,212,0.2)"}`,
                      background: dragOver ? "rgba(6,182,212,0.06)" : "transparent",
                      transform: dragOver ? "scale(1.01)" : "scale(1)",
                    }}>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files[0] && loadImage(e.target.files[0])} />
                    <div className="w-12 h-12 rounded mx-auto mb-4 flex items-center justify-center"
                      style={{ border: "1px solid rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.04)" }}>
                      <svg className="w-6 h-6" style={{ color: "#06b6d4" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p style={{ color: "#475569", ...mono, fontSize: "0.75rem" }}>DROP SCREENSHOT HERE</p>
                    <p style={{ color: "#1e293b", ...mono, fontSize: "0.65rem", marginTop: "4px" }}>or click to browse · PNG, JPG, WEBP</p>
                    <p style={{ color: "#1e293b", ...mono, fontSize: "0.6rem", marginTop: "4px" }}>⚠ emojis may not extract</p>
                  </div>
                ) : (
                  <div className="rounded overflow-hidden" style={{ border: "1px solid rgba(6,182,212,0.15)" }}>
                    <div className="relative">
                      <img src={imagePreview} alt="Uploaded" className="w-full object-cover" style={{ maxHeight: "160px" }} />
                      <button onClick={() => { setImageFile(null); setImagePreview(null); setExtractedText(""); setOcrDone(false); setResults(null); }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors"
                        style={{ background: "rgba(0,0,0,0.7)", color: "#94a3b8" }}>✕</button>
                    </div>
                    <div className="px-3 py-2" style={{ background: "rgba(6,182,212,0.03)" }}>
                      <p style={{ color: "#334155", fontSize: "0.65rem", ...mono }}>📎 {imageFile?.name}</p>
                    </div>
                  </div>
                )}

                {imagePreview && !ocrDone && (
                  <button onClick={handleExtract} disabled={ocrLoading}
                    className="cyber-btn w-full py-3 text-xs tracking-widest flex items-center justify-center gap-2"
                    style={{ opacity: ocrLoading ? 0.6 : 1 }}>
                    {ocrLoading
                      ? <><div className="w-3 h-3 rounded-full border-2 animate-spin"
                          style={{ borderColor: "rgba(6,182,212,0.2)", borderTopColor: "#06b6d4" }} />EXTRACTING TEXT...</>
                      : "▶ EXTRACT TEXT FROM SCREENSHOT"}
                  </button>
                )}

                {ocrDone && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p style={{ color: "#10b981", fontSize: "0.65rem", letterSpacing: "0.1em", ...mono }}>✓ TEXT EXTRACTED — EDIT IF NEEDED</p>
                      <button onClick={() => setOcrDone(false)} style={{ color: "#334155", fontSize: "0.6rem", ...mono }}
                        className="hover:text-cyan-400 transition-colors">RE-EXTRACT</button>
                    </div>
                    <textarea rows="6"
                      className="cyber-input w-full p-4 resize-none"
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      placeholder="// extracted text appears here..."
                    />
                    {!extractedText.trim() && (
                      <p style={{ color: "#f59e0b", fontSize: "0.65rem", ...mono }}>⚠ no text detected — try a clearer screenshot</p>
                    )}
                    <button onClick={handleAnalyze} disabled={loading || !extractedText.trim()}
                      className="cyber-btn w-full py-3 text-xs tracking-widest flex items-center justify-center gap-2"
                      style={{ opacity: (loading || !extractedText.trim()) ? 0.5 : 1 }}>
                      {loading
                        ? <><div className="w-3 h-3 rounded-full border-2 animate-spin"
                            style={{ borderColor: "rgba(6,182,212,0.2)", borderTopColor: "#06b6d4" }} />RUNNING ENSEMBLE...</>
                        : "▶ ANALYZE EXTRACTED TEXT"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── RESULTS PANEL ───────────────────────────────────────────── */}
        <section className="reveal delay-1 lg:col-span-7 flex flex-col" style={{ minHeight: "400px" }}>

          {!results && !loading && (
            <div className="flex-1 rounded flex flex-col items-center justify-center text-center p-8"
              style={{ border: "1px solid rgba(6,182,212,0.08)", background: "rgba(6,182,212,0.01)" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ border: "1px solid rgba(6,182,212,0.1)", background: "rgba(6,182,212,0.03)" }}>
                <svg className="w-8 h-8 opacity-20" style={{ color: "#06b6d4" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p style={{ color: "#1e293b", ...mono, fontSize: "0.7rem", letterSpacing: "0.1em" }}>
                // AWAITING INPUT
              </p>
              <p style={{ color: "#0f172a", fontSize: "0.65rem", marginTop: "6px", ...mono }}>
                Submit text or screenshot to run ensemble analysis
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 rounded flex flex-col items-center justify-center gap-4"
              style={{ border: "1px solid rgba(6,182,212,0.08)", background: "rgba(6,182,212,0.01)" }}>
              <div className="w-10 h-10 rounded-full border-2 animate-spin"
                style={{ borderColor: "rgba(6,182,212,0.1)", borderTopColor: "#06b6d4" }} />
              <p style={{ color: "#06b6d4", ...mono, fontSize: "0.7rem", letterSpacing: "0.15em" }}>
                RUNNING MODELS...
              </p>
            </div>
          )}

          {results && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result, i) => (
                <div key={i} className="rounded p-5 flex flex-col gap-3"
                  style={{
                    border: `1px solid ${sevBorder(result.severity)}`,
                    background: sevBg(result.severity),
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${sevBorder(result.severity)}`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)";   e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Model name */}
                  <p style={{ color: "#334155", ...mono, fontSize: "0.6rem", letterSpacing: "0.15em" }}>
                    // {result.modelName}
                  </p>

                  {/* Category + probability */}
                  <div className="flex items-end justify-between">
                    <span style={{ ...bebas, fontSize: "2rem", color: sevColor(result.severity), lineHeight: 1 }}>
                      {result.category}
                    </span>
                    <span style={{ ...bebas, fontSize: "1.8rem", color: sevColor(result.severity), opacity: 0.8, lineHeight: 1 }}>
                      {(result.probability * 100).toFixed(1)}%
                    </span>
                  </div>

                  {/* Severity tag */}
                  <span className="text-xs px-2 py-0.5 rounded w-fit"
                    style={{ border: `1px solid ${sevColor(result.severity)}44`, color: sevColor(result.severity), background: `${sevColor(result.severity)}11`, ...mono, fontSize: "0.6rem", letterSpacing: "0.1em" }}>
                    SEVERITY: {result.severity?.toUpperCase()}
                  </span>

                  {/* Progress bar */}
                  <div className="rounded-full overflow-hidden" style={{ height: "3px", background: "rgba(255,255,255,0.05)" }}>
                    <div style={{
                      height: "100%",
                      width: `${result.probability * 100}%`,
                      background: sevColor(result.severity),
                      borderRadius: "99px",
                      transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
                      boxShadow: `0 0 8px ${sevColor(result.severity)}`,
                    }} />
                  </div>

                  {/* Dominant types */}
                  {result.dominantTypes?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {result.dominantTypes.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-xs"
                          style={{ border: `1px solid ${sevColor(result.severity)}33`, color: sevColor(result.severity), ...mono, fontSize: "0.55rem", letterSpacing: "0.1em" }}>
                          {t.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}