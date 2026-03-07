import { Link, Outlet, useLocation } from "react-router-dom";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useState, useRef, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { cyberStyles, CyberCursor } from "../styles/cyber.jsx";

export default function Layout() {
  const { user, setUser, isDark, setIsDark } = useAuth();
  const location = useLocation();
  const [isHistoryOpen,  setIsHistoryOpen]  = useState(false);
  const [history,        setHistory]        = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyRef = useRef(null);

  // Close history on outside click
  useEffect(() => {
    const fn = (e) => { if (historyRef.current && !historyRef.current.contains(e.target)) setIsHistoryOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Fetch history when opened
  useEffect(() => {
    if (isHistoryOpen && user) fetchHistory();
  }, [isHistoryOpen]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/history?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch { toast.error("Failed to load history"); }
    finally   { setHistoryLoading(false); }
  };

  const handleLoginSuccess = (cr) => {
    const decoded = jwtDecode(cr.credential);
    setUser(decoded);
    toast.success(`Welcome ${decoded.name}`);
  };
  const handleLogout = () => { googleLogout(); setUser(null); setHistory([]); setIsHistoryOpen(false); toast.success("Logged out"); };

  const sevColor = (s) => s === "High" ? "#ef4444" : s === "Medium" ? "#f59e0b" : "#10b981";

  const navLinks = [
    { to: "/app",       label: "HOME" },
    { to: "/resources", label: "RESOURCES" },
    { to: "/laws",      label: "LAWS" },
    { to: "/videos",    label: "VIDEOS" },
  ];

  return (
    <div style={{ background: "#030712", minHeight: "100vh", fontFamily: "'DM Mono', monospace" }}>
      <style>{cyberStyles}</style>
      <CyberCursor />
      <Toaster position="top-right" toastOptions={{
        style: { background: "#0f172a", color: "#e2e8f0", border: "1px solid rgba(6,182,212,0.3)", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem" }
      }} />

      {/* Fixed grid bg */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0" />
      <div className="fixed inset-0 scan-lines pointer-events-none z-0" />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50"
        style={{ borderBottom: "1px solid rgba(6,182,212,0.1)", background: "rgba(3,7,18,0.85)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" style={{ textDecoration: "none" }}>
            <div className="w-7 h-7 rounded flex items-center justify-center"
              style={{ border: "1px solid rgba(6,182,212,0.5)", background: "rgba(6,182,212,0.1)" }}>
              <span style={{ color: "#06b6d4", fontSize: "0.75rem", fontWeight: 700 }}>S</span>
            </div>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#e2e8f0", letterSpacing: "0.06em" }}>
              SHIELD<span style={{ color: "#06b6d4" }}>AI</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-8">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`nav-link${location.pathname === to ? " active" : ""}`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">

            {/* History — only when logged in */}
            {user && (
              <div className="relative" ref={historyRef}>
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="w-8 h-8 flex items-center justify-center rounded transition-all duration-200"
                  style={{
                    border: isHistoryOpen ? "1px solid rgba(6,182,212,0.7)" : "1px solid rgba(6,182,212,0.2)",
                    background: isHistoryOpen ? "rgba(6,182,212,0.15)" : "rgba(6,182,212,0.03)",
                    color: "#06b6d4",
                  }}
                  title="Analysis History"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {isHistoryOpen && (
                  <div className="absolute right-0 mt-3 w-96 rounded z-50 overflow-hidden animate-fade-in"
                    style={{ border: "1px solid rgba(6,182,212,0.2)", background: "#030712", boxShadow: "0 0 40px rgba(6,182,212,0.1)" }}>
                    {/* Header */}
                    <div className="px-4 py-3 flex items-center justify-between"
                      style={{ borderBottom: "1px solid rgba(6,182,212,0.1)" }}>
                      <div>
                        <p style={{ color: "#06b6d4", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.1em", fontSize: "0.85rem" }}>
                          ANALYSIS HISTORY
                        </p>
                        <p style={{ color: "#334155", fontSize: "0.65rem", marginTop: "2px" }}>{user.name}</p>
                      </div>
                      <button onClick={fetchHistory} style={{ color: "#334155", fontSize: "0.65rem", letterSpacing: "0.1em" }}
                        className="hover:text-cyan-400 transition-colors">↺ REFRESH</button>
                    </div>

                    {/* Body */}
                    <div style={{ maxHeight: "380px", overflowY: "auto" }}>
                      {historyLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-6 h-6 rounded-full border-2 border-t-cyan-400 animate-spin"
                            style={{ borderColor: "rgba(6,182,212,0.2)", borderTopColor: "#06b6d4" }} />
                        </div>
                      ) : history.length === 0 ? (
                        <div className="text-center py-10" style={{ color: "#1e293b" }}>
                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem" }}>// NO RECORDS FOUND</p>
                          <p style={{ fontSize: "0.65rem", marginTop: "4px", color: "#1e293b" }}>Run your first analysis to see history</p>
                        </div>
                      ) : (
                        history.map((item, i) => (
                          <div key={i} className="px-4 py-3 transition-colors"
                            style={{ borderBottom: "1px solid rgba(6,182,212,0.06)", cursor: "default" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(6,182,212,0.03)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <p style={{ color: "#94a3b8", fontSize: "0.75rem", lineHeight: 1.5, marginBottom: "8px" }}>
                              {item.text?.length > 75 ? item.text.slice(0, 75) + "…" : item.text}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs px-2 py-0.5 rounded"
                                style={{ border: `1px solid ${sevColor(item.severity)}44`, color: sevColor(item.severity), background: `${sevColor(item.severity)}11`, fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
                                {item.severity?.toUpperCase()} · {item.category?.toUpperCase()}
                              </span>
                              <span style={{ color: "#1e293b", fontSize: "0.6rem", fontFamily: "'DM Mono', monospace" }}>
                                {item.timestamp ? new Date(item.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                              </span>
                            </div>
                            <div className="mt-2 rounded-full overflow-hidden" style={{ height: "2px", background: "rgba(6,182,212,0.08)" }}>
                              <div style={{ height: "100%", width: `${(item.final_score || 0) * 100}%`, background: sevColor(item.severity), borderRadius: "99px" }} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {history.length > 0 && (
                      <div className="px-4 py-2 text-center" style={{ borderTop: "1px solid rgba(6,182,212,0.08)" }}>
                        <span style={{ color: "#1e293b", fontSize: "0.6rem", fontFamily: "'DM Mono', monospace" }}>{history.length} RECORDS</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Auth */}
            {!user ? (
              <GoogleLogin onSuccess={handleLoginSuccess} onError={() => toast.error("Login Failed")} />
            ) : (
              <div className="flex items-center gap-3">
                <img src={user.picture} className="w-7 h-7 rounded-full" alt={user.name}
                  style={{ border: "1px solid rgba(6,182,212,0.3)" }} />
                <button onClick={handleLogout} className="cyber-btn px-4 py-1.5 text-xs tracking-widest">
                  LOGOUT
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main style={{ paddingTop: "64px", minHeight: "100vh", position: "relative", zIndex: 10 }}>
        <Outlet />
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(6,182,212,0.08)", padding: "2rem 1.5rem", position: "relative", zIndex: 10 }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#e2e8f0", letterSpacing: "0.06em" }}>
            SHIELD<span style={{ color: "#06b6d4" }}>AI</span>
          </span>
          <nav className="flex gap-6">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className="nav-link" style={{ fontSize: "0.65rem" }}>{label}</Link>
            ))}
          </nav>
          <p style={{ color: "#1e293b", fontFamily: "'DM Mono', monospace", fontSize: "0.65rem" }}>
            Built by <span style={{ color: "#06b6d4" }}>Sameer Kumar</span> & <span style={{ color: "#06b6d4" }}>Jay Modak</span>
            {" · "}© {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}