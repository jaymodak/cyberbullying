import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useState, useRef, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { cyberStyles, CyberCursor, darkTokens, lightTokens } from "../styles/cyber.jsx";

const ADMIN_USER = "admin-cybd";
const ADMIN_PASS = "cybd-ibsar";

const DISCLAIMER_TEXT =
  "By signing in, you confirm that you are 18 years or older, or have permission/supervision if under 18. " +
  "This platform is intended for detecting and preventing cyberbullying. Results are automated and may not be " +
  "fully accurate. Users are responsible for their content and must not misuse the system.";

// ── Sign-In Gate ────────────────────────────────────────────────────────────
function SignInGate({ isDark, onLoginSuccess }) {
  const t = isDark ? darkTokens : lightTokens;
  const [agreed, setAgreed] = useState(false);

  const mono  = { fontFamily: "'DM Mono', monospace" };
  const raj   = { fontFamily: "'Rajdhani', sans-serif" };
  const bebas = { fontFamily: "'Bebas Neue', sans-serif" };

  return (
    <div style={{ background: t.bg, minHeight: "100vh", ...mono, transition: "background 0.35s ease" }}>
      <style>{cyberStyles}</style>
      <CyberCursor />

      {/* Background grid + scanlines */}
      <div className={`fixed inset-0 pointer-events-none z-0 ${t.gridClass}`} />
      <div className={`fixed inset-0 pointer-events-none z-0 ${t.scanClass}`} />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse 70% 60% at 30% 50%, rgba(6,182,212,0.05), transparent), radial-gradient(ellipse 50% 40% at 80% 60%, rgba(139,92,246,0.04), transparent)" }} />

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">

        {/* ── LEFT — Branding panel ──────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-center items-start px-20 w-5/12 relative overflow-hidden"
          style={{ borderRight: `1px solid ${t.border}` }}>

          {/* Corner decoration */}
          <div className="absolute top-8 left-8 w-10 h-10"
            style={{ borderTop: `1px solid ${t.accent}`, borderLeft: `1px solid ${t.accent}`, opacity: 0.5 }} />
          <div className="absolute bottom-8 right-8 w-10 h-10"
            style={{ borderBottom: `1px solid ${t.accent}`, borderRight: `1px solid ${t.accent}`, opacity: 0.5 }} />

          {/* Badge */}
          <div className="mb-8 flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center"
              style={{ border: `1px solid ${t.border}`, background: t.accentBg }}>
              <span style={{ color: t.accent, fontSize: "0.9rem", fontWeight: 700 }}>C</span>
            </div>
            <span style={{ ...raj, fontWeight: 700, fontSize: "1.1rem", color: t.text, letterSpacing: "0.08em" }}>
              CYBER<span style={{ color: t.accent }}>SHIELD</span>
            </span>
          </div>

          {/* Main headline */}
          <h1 style={{ ...bebas, fontSize: "clamp(3.5rem,5vw,5rem)", lineHeight: 0.95, letterSpacing: "0.03em", color: t.text, marginBottom: "20px" }}>
            DETECT.<br />
            <span style={{ color: t.accent }}>PROTECT.</span><br />
            PREVENT.
          </h1>

          <p style={{ color: isDark ? "#475569" : "#475569", ...mono, fontSize: "0.72rem", lineHeight: 1.9, maxWidth: "320px", marginBottom: "40px" }}>
            AI-powered cyberbullying detection using an ensemble of three transformer models — analysing text and screenshots in real time.
          </p>

          {/* Stats row */}
          <div className="flex gap-8">
            {[
              { value: "3", label: "ML MODELS" },
              { value: "99%", label: "ACCURACY" },
              { value: "24/7", label: "DETECTION" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ ...bebas, fontSize: "1.8rem", color: t.accent, lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: isDark ? "#334155" : "#64748b", fontSize: "0.55rem", letterSpacing: "0.15em", ...mono, marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT — Sign-in panel ──────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2 mb-10 justify-center">
              <div className="w-8 h-8 rounded flex items-center justify-center"
                style={{ border: `1px solid ${t.border}`, background: t.accentBg }}>
                <span style={{ color: t.accent, fontSize: "0.9rem", fontWeight: 700 }}>C</span>
              </div>
              <span style={{ ...raj, fontWeight: 700, fontSize: "1.1rem", color: t.text, letterSpacing: "0.08em" }}>
                CYBER<span style={{ color: t.accent }}>SHIELD</span>
              </span>
            </div>

            {/* Card */}
            <div className="rounded-lg overflow-hidden"
              style={{ border: `1px solid ${t.border}`, background: isDark ? "rgba(6,182,212,0.02)" : "rgba(8,145,178,0.04)", boxShadow: `0 0 60px rgba(6,182,212,0.08)` }}>

              {/* Card header */}
              <div className="px-8 py-6" style={{ borderBottom: `1px solid ${t.border}` }}>
                <p style={{ color: t.accent, fontSize: "0.6rem", letterSpacing: "0.2em", ...mono, marginBottom: "4px" }}>// SECURE ACCESS</p>
                <h2 style={{ ...bebas, fontSize: "1.8rem", color: t.text, letterSpacing: "0.06em", lineHeight: 1 }}>
                  SIGN IN TO YOUR <span style={{ color: t.accent }}>ACCOUNT</span>
                </h2>
              </div>

              <div className="px-8 py-8 space-y-6">

                {/* Google login wrapper */}
                <div>
                  <div
                    style={{
                      opacity: agreed ? 1 : 0.4,
                      pointerEvents: agreed ? "auto" : "none",
                      transition: "opacity 0.3s ease",
                      filter: agreed ? "none" : "grayscale(60%)",
                    }}
                  >
                    <GoogleLogin
                      onSuccess={onLoginSuccess}
                      onError={() => toast.error("Login Failed")}
                      width="100%"
                      text="signin_with"
                      shape="rectangular"
                      theme={isDark ? "filled_black" : "outline"}
                    />
                  </div>
                  {!agreed && (
                    <p style={{ color: isDark ? "#334155" : "#94a3b8", ...mono, fontSize: "0.6rem", textAlign: "center", marginTop: "6px", letterSpacing: "0.08em" }}>
                      ↑ agree to terms below to enable sign-in
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: t.border }} />
                  <span style={{ color: isDark ? "#334155" : "#94a3b8", ...mono, fontSize: "0.6rem", letterSpacing: "0.1em" }}>TERMS OF USE</span>
                  <div className="flex-1 h-px" style={{ background: t.border }} />
                </div>

                {/* Disclaimer checkbox */}
                <label className="flex items-start gap-3 group"
                  style={{ cursor: "pointer" }}
                  onClick={() => setAgreed(!agreed)}>

                  {/* Custom checkbox */}
                  <div className="shrink-0 mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all duration-200"
                    style={{
                      border: `1px solid ${agreed ? t.accent : isDark ? "#334155" : "#94a3b8"}`,
                      background: agreed ? t.accentBg : "transparent",
                      boxShadow: agreed ? `0 0 10px ${t.accent}44` : "none",
                    }}>
                    {agreed && (
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: t.accent }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  <p style={{ color: isDark ? "#475569" : "#475569", ...mono, fontSize: "0.65rem", lineHeight: 1.8, userSelect: "none" }}>
                    {DISCLAIMER_TEXT}
                  </p>
                </label>

                {/* Security note */}
                <div className="flex items-center gap-2 px-3 py-2 rounded"
                  style={{ border: `1px solid ${t.border}`, background: isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.02)" }}>
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: t.accent }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p style={{ color: isDark ? "#334155" : "#64748b", ...mono, fontSize: "0.6rem", letterSpacing: "0.05em" }}>
                    Secured via Google OAuth · No passwords stored
                  </p>
                </div>

              </div>
            </div>

            {/* Back link */}
            <div className="mt-6 text-center">
              <Link to="/" style={{ color: isDark ? "#334155" : "#64748b", ...mono, fontSize: "0.65rem", letterSpacing: "0.1em", textDecoration: "none" }}
                onMouseEnter={(e) => e.target.style.color = t.accent}
                onMouseLeave={(e) => e.target.style.color = isDark ? "#334155" : "#64748b"}>
                ← BACK TO HOME
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Layout ─────────────────────────────────────────────────────────────
export default function Layout() {
  const { user, setUser, isAdmin, setIsAdmin, adminLogout, isDark, setIsDark, fontSize, setFontSize } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const t = isDark ? darkTokens : lightTokens;

  const [isHistoryOpen,  setIsHistoryOpen]  = useState(false);
  const [history,        setHistory]        = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyRef = useRef(null);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminUsername,  setAdminUsername]  = useState("");
  const [adminPassword,  setAdminPassword]  = useState("");
  const [adminError,     setAdminError]     = useState("");
  const [showPass,       setShowPass]       = useState(false);
  const modalRef = useRef(null);

  const [suggestion,       setSuggestion]       = useState("");
  const [suggestionStatus, setSuggestionStatus] = useState(null);

  useEffect(() => {
    const fn = (e) => {
      if (historyRef.current && !historyRef.current.contains(e.target)) setIsHistoryOpen(false);
      if (modalRef.current && !modalRef.current.contains(e.target) && adminModalOpen) setAdminModalOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [adminModalOpen]);

  useEffect(() => { if (isHistoryOpen && user) fetchHistory(); }, [isHistoryOpen]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/history?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch { toast.error("Failed to load history"); }
    finally { setHistoryLoading(false); }
  };

  const handleLoginSuccess = (cr) => {
    const d = jwtDecode(cr.credential);
    setUser(d);
    toast.success(`Welcome ${d.name}`);
  };
  const handleLogout = () => { googleLogout(); setUser(null); setHistory([]); setIsHistoryOpen(false); toast.success("Logged out"); };

  const handleAdminLogin = () => {
    setAdminError("");
    if (adminUsername === ADMIN_USER && adminPassword === ADMIN_PASS) {
      setIsAdmin(true); setAdminModalOpen(false); setAdminUsername(""); setAdminPassword("");
      toast.success("Admin access granted"); navigate("/admin");
    } else { setAdminError("// INVALID CREDENTIALS"); }
  };

  const handleAdminLogout = () => { adminLogout(); toast.success("Admin logged out"); navigate("/app"); };
  const handleSuggestionSubmit = async () => {
    const text = suggestion.trim();
    if (!text) return;
    setSuggestionStatus("sending");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/suggestions`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text, email: user?.email || "" }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuggestion("");
      setSuggestionStatus("sent");
      setTimeout(() => setSuggestionStatus(null), 3000);
    } catch {
      setSuggestionStatus("error");
      setTimeout(() => setSuggestionStatus(null), 3000);
    }
  };
  const sevColor = (s) => s === "High" ? "#ef4444" : s === "Medium" ? "#f59e0b" : "#10b981";

  const navLinks = [
    { to: "/app", label: "HOME" }, { to: "/resources", label: "RESOURCES" },
    { to: "/laws", label: "LAWS" }, { to: "/videos", label: "VIDEOS" },
  ];

  const mono  = { fontFamily: "'DM Mono', monospace" };
  const raj   = { fontFamily: "'Rajdhani', sans-serif" };
  const bebas = { fontFamily: "'Bebas Neue', sans-serif" };

  // ── Show sign-in gate when not authenticated ──────────────────────────────
  if (!user) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{
          style: { background: isDark ? "#0f172a" : "#f1f5f9", color: isDark ? "#e2e8f0" : "#0f172a", border: `1px solid ${t.border}`, fontFamily: "'DM Mono',monospace", fontSize: "0.75rem" }
        }} />
        <SignInGate isDark={isDark} onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  // ── Main authenticated layout ─────────────────────────────────────────────
  return (
    <div style={{ background: t.bg, minHeight: "100vh", ...mono, transition: "background 0.35s ease" }}>
      <style>{cyberStyles}</style>
      <CyberCursor />
      <Toaster position="top-right" toastOptions={{
        style: { background: isDark ? "#0f172a" : "#f1f5f9", color: isDark ? "#e2e8f0" : "#0f172a", border: `1px solid ${t.border}`, fontFamily: "'DM Mono',monospace", fontSize: "0.75rem" }
      }} />

      <div className={`fixed inset-0 pointer-events-none z-0 ${t.gridClass}`} />
      <div className={`fixed inset-0 pointer-events-none z-0 ${t.scanClass}`} />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50"
        style={{ borderBottom: `1px solid ${t.border}`, background: t.bgHeader, backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" style={{ textDecoration: "none" }}>
            <div className="w-7 h-7 rounded flex items-center justify-center"
              style={{ border: `1px solid ${t.border}`, background: t.accentBg }}>
              <span style={{ color: t.accent, fontSize: "0.75rem", fontWeight: 700 }}>C</span>
            </div>
            <span style={{ ...raj, fontWeight: 700, fontSize: "1.1rem", color: t.text, letterSpacing: "0.06em" }}>
              CYBER<span style={{ color: t.accent }}>SHIELD</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`nav-link${location.pathname === to ? " active" : ""}`}
                style={{ color: location.pathname === to ? t.accent : t.textMuted }}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">

            {/* ── FONT SIZE ─────────────────────────────────────────── */}
            <div className="flex items-center rounded overflow-hidden"
              style={{ border: `1px solid ${t.border}` }}>
              {[
                { key: "small",  label: "A",  size: "0.6rem" },
                { key: "medium", label: "A",  size: "0.75rem" },
                { key: "large",  label: "A",  size: "0.9rem" },
              ].map((f) => (
                <button key={f.key} onClick={() => setFontSize(f.key)}
                  title={`${f.key.charAt(0).toUpperCase() + f.key.slice(1)} text`}
                  className="px-2 py-1.5 transition-all duration-200"
                  style={{
                    background: fontSize === f.key ? t.accentBg : "transparent",
                    color: fontSize === f.key ? t.accent : t.textDim,
                    fontSize: f.size,
                    fontWeight: 700,
                    borderRight: f.key !== "large" ? `1px solid ${t.border}` : "none",
                    fontFamily: "'Rajdhani',sans-serif",
                  }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* ── THEME TOGGLE ─────────────────────────────────────── */}
            <button onClick={() => setIsDark(!isDark)} title={isDark ? "Light Mode" : "Dark Mode"}
              className="w-8 h-8 flex items-center justify-center rounded transition-all duration-200"
              style={{ border: `1px solid ${t.border}`, background: t.accentBg, color: t.accent }}>
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* ── HISTORY ─────────────────────────────────────────── */}
            {user && (
              <div className="relative" ref={historyRef}>
                <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} title="Analysis History"
                  className="w-8 h-8 flex items-center justify-center rounded transition-all"
                  style={{ border: `1px solid ${isHistoryOpen ? t.accent : t.border}`, background: isHistoryOpen ? t.accentBg : "transparent", color: t.accent }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {isHistoryOpen && (
                  <div className="absolute right-0 mt-3 w-96 rounded z-50 overflow-hidden"
                    style={{ border: `1px solid ${t.border}`, background: isDark ? "#030712" : "#f1f5f9", boxShadow: `0 0 40px ${t.accentBg}` }}>
                    <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${t.border}` }}>
                      <div>
                        <p style={{ color: t.accent, ...raj, fontWeight: 700, letterSpacing: "0.1em", fontSize: "0.85rem" }}>ANALYSIS HISTORY</p>
                        <p style={{ color: t.textDim, fontSize: "0.65rem", marginTop: "2px", ...mono }}>{user.name}</p>
                      </div>
                      <button onClick={fetchHistory} style={{ color: t.textDim, fontSize: "0.65rem", ...mono }}
                        onMouseEnter={(e) => e.target.style.color = t.accent}
                        onMouseLeave={(e) => e.target.style.color = t.textDim}>↺ REFRESH</button>
                    </div>
                    <div style={{ maxHeight: "380px", overflowY: "auto" }}>
                      {historyLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: t.border, borderTopColor: t.accent }} />
                        </div>
                      ) : history.length === 0 ? (
                        <div className="text-center py-10"><p style={{ ...mono, fontSize: "0.7rem", color: t.textDim }}>// NO RECORDS FOUND</p></div>
                      ) : history.map((item, i) => (
                        <div key={i} className="px-4 py-3" style={{ borderBottom: `1px solid ${t.border}` }}
                          onMouseEnter={(e) => e.currentTarget.style.background = t.accentBg}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <p style={{ color: t.textMuted, fontSize: "0.75rem", lineHeight: 1.5, marginBottom: "8px", ...mono }}>
                            {item.text?.length > 75 ? item.text.slice(0, 75) + "…" : item.text}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded" style={{ border: `1px solid ${sevColor(item.severity)}44`, color: sevColor(item.severity), background: `${sevColor(item.severity)}11`, ...mono, fontSize: "0.6rem", letterSpacing: "0.1em" }}>
                              {item.severity?.toUpperCase()} · {item.category?.toUpperCase()}
                            </span>
                            <span style={{ color: t.textDim, fontSize: "0.6rem", ...mono }}>
                              {item.timestamp ? new Date(item.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                            </span>
                          </div>
                          <div className="mt-2 rounded-full overflow-hidden" style={{ height: "2px", background: t.border }}>
                            <div style={{ height: "100%", width: `${(item.final_score || 0) * 100}%`, background: sevColor(item.severity), borderRadius: "99px" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {history.length > 0 && (
                      <div className="px-4 py-2 text-center" style={{ borderTop: `1px solid ${t.border}` }}>
                        <span style={{ color: t.textDim, fontSize: "0.6rem", ...mono }}>{history.length} RECORDS</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── ADMIN ────────────────────────────────────────────── */}
            {!isAdmin ? (
              <button onClick={() => setAdminModalOpen(true)}
                className={`${t.btnClass} px-3 py-1.5 text-xs tracking-widest flex items-center gap-1.5`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                ADMIN
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => navigate("/admin")} className={`${t.btnClass} px-3 py-1.5 text-xs tracking-widest`}>⚙ PANEL</button>
                <button onClick={handleAdminLogout} className="px-3 py-1.5 text-xs tracking-widest rounded"
                  style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", background: "rgba(239,68,68,0.05)", ...raj, fontWeight: 700, letterSpacing: "0.15em" }}>
                  EXIT
                </button>
              </div>
            )}

            {/* ── GOOGLE AUTH ─────────────────────────────────────── */}
            <div className="flex items-center gap-2">
              <img src={user.picture} className="w-7 h-7 rounded-full" alt={user.name} style={{ border: `1px solid ${t.border}` }} />
              <button onClick={handleLogout} className={`${t.btnClass} px-3 py-1.5 text-xs tracking-widest`}>LOGOUT</button>
            </div>
          </div>
        </div>
      </header>

      {/* ── ADMIN LOGIN MODAL ──────────────────────────────────────────────── */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
          <div ref={modalRef} className="w-full max-w-sm rounded-lg overflow-hidden"
            style={{ border: `1px solid ${t.accent}44`, background: isDark ? "#030712" : "#e2e8f0", boxShadow: `0 0 60px rgba(6,182,212,0.15)` }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${t.border}` }}>
              <div>
                <p style={{ color: t.textDim, ...mono, fontSize: "0.6rem", letterSpacing: "0.15em" }}>// SECURE ACCESS</p>
                <h2 style={{ ...bebas, fontSize: "1.6rem", color: t.text, letterSpacing: "0.1em", lineHeight: 1 }}>
                  ADMIN <span style={{ color: t.accent }}>LOGIN</span>
                </h2>
              </div>
              <button onClick={() => { setAdminModalOpen(false); setAdminError(""); setAdminUsername(""); setAdminPassword(""); }}
                className="w-7 h-7 flex items-center justify-center rounded"
                style={{ border: `1px solid ${t.border}`, color: t.textMuted }}>✕</button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <p style={{ color: t.textDim, ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", marginBottom: "6px" }}>USERNAME</p>
                <input type="text" className={`w-full px-4 py-3 ${t.inputClass}`} placeholder="// enter username"
                  value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()} autoComplete="off" />
              </div>
              <div>
                <p style={{ color: t.textDim, ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", marginBottom: "6px" }}>PASSWORD</p>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} className={`w-full px-4 py-3 pr-12 ${t.inputClass}`} placeholder="// enter password"
                    value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()} autoComplete="off" />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: t.textDim, fontSize: "0.6rem", ...mono }}>{showPass ? "HIDE" : "SHOW"}</button>
                </div>
              </div>
              {adminError && <p style={{ color: "#ef4444", ...mono, fontSize: "0.65rem" }}>⚠ {adminError}</p>}
              <button onClick={handleAdminLogin} className={`w-full py-3 text-sm tracking-widest ${t.btnClass}`}>▶ ACCESS ADMIN PANEL</button>
              <p style={{ color: t.textDim, ...mono, fontSize: "0.6rem", textAlign: "center" }}>// authorized personnel only</p>
            </div>
          </div>
        </div>
      )}

      <main style={{ paddingTop: "64px", minHeight: "100vh", position: "relative", zIndex: 10 }}>
        <Outlet context={{ isDark }} />
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${t.border}`, padding: "2rem 1.5rem", position: "relative", zIndex: 10 }}>
        <div className="max-w-7xl mx-auto flex flex-col gap-6">

          {/* Suggestion box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <p style={{ ...mono, fontSize: "0.6rem", color: t.textDim, letterSpacing: "0.12em", whiteSpace: "nowrap", alignSelf: "center" }}>
              // LEAVE A SUGGESTION
            </p>
            <input
              type="text"
              placeholder="Share feedback or report an issue..."
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSuggestionSubmit()}
              disabled={suggestionStatus === "sending"}
              style={{
                flex:        1,
                padding:     "8px 14px",
                background:  isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
                border:      `1px solid ${suggestionStatus === "sent" ? "#10b981" : suggestionStatus === "error" ? "#ef4444" : t.border}`,
                borderRadius: "4px",
                color:       t.text,
                ...mono,
                fontSize:    "0.65rem",
                outline:     "none",
                transition:  "border-color 0.2s ease",
              }}
            />
            <button
              onClick={handleSuggestionSubmit}
              disabled={suggestionStatus === "sending" || !suggestion.trim()}
              style={{
                padding:      "8px 18px",
                border:       `1px solid ${t.accent}55`,
                background:   t.accentBg,
                color:        suggestionStatus === "sent" ? "#10b981" : suggestionStatus === "error" ? "#ef4444" : t.accent,
                ...mono,
                fontSize:     "0.6rem",
                letterSpacing: "0.12em",
                borderRadius: "4px",
                cursor:       (suggestionStatus === "sending" || !suggestion.trim()) ? "not-allowed" : "pointer",
                opacity:      (suggestionStatus === "sending" || !suggestion.trim()) ? 0.5 : 1,
                whiteSpace:   "nowrap",
                transition:   "all 0.2s ease",
              }}
            >
              {suggestionStatus === "sending" ? "SENDING..." : suggestionStatus === "sent" ? "✓ SENT" : suggestionStatus === "error" ? "✗ FAILED" : "▶ SEND"}
            </button>
          </div>

          {/* Bottom row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span style={{ ...raj, fontWeight: 700, fontSize: "1rem", color: t.text, letterSpacing: "0.06em" }}>CYBER<span style={{ color: t.accent }}>SHIELD</span></span>
            <nav className="flex gap-6">
              {navLinks.map(({ to, label }) => (
                <Link key={to} to={to} className="nav-link" style={{ fontSize: "0.65rem", color: t.textMuted }}>{label}</Link>
              ))}
            </nav>
            <p style={{ color: t.textDim, ...mono, fontSize: "0.65rem" }}>
              Built by <span style={{ color: t.accent }}>Sameer Kumar</span> & <span style={{ color: t.accent }}>Jay Modak</span> · © {new Date().getFullYear()}
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}