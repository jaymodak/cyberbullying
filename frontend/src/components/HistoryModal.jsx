/**
 * HistoryPanel + HistoryModal
 *
 * Usage in Home.jsx (or wherever history is shown):
 *
 *   import { HistoryPanel } from "../components/HistoryModal";
 *
 *   <HistoryPanel userEmail={user?.email} isDark={isDark} />
 *
 * The panel fetches history from /api/history?email=...,
 * renders a clickable list, and opens a detailed modal on click.
 * A "Download" button exports history as CSV or JSON.
 */

import { useState, useEffect, useCallback } from "react";
import { darkTokens, lightTokens } from "../styles/cyber.jsx";

const API = import.meta.env.VITE_API_URL;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sevColor = (sev) =>
  sev === "High" ? "#ef4444" : sev === "Medium" ? "#f59e0b" : "#10b981";

const catBadgeStyle = (cat) => {
  if (cat === "Cyberbullying") return { color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)" };
  if (cat === "Suspicious")    return { color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.08)" };
  return                              { color: "#10b981", border: "1px solid rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.08)" };
};

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function pct(p) {
  return `${(Number(p) * 100).toFixed(1)}%`;
}

// ─── Download helpers ─────────────────────────────────────────────────────────

function downloadJSON(history) {
  const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
  triggerDownload(blob, "shield_history.json");
}

function downloadCSV(history) {
  const MODEL_KEYS = ["rule_based", "toxic_bert", "twitter_roberta", "zero_shot"];
  const headers = [
    "timestamp", "platform", "final_score", "category", "severity",
    ...MODEL_KEYS.map((m) => `${m}_prob`),
    ...MODEL_KEYS.map((m) => `${m}_cat`),
    "flagged_keywords", "text"
  ];

  const rows = history.map((r) => {
    const models = r.models || {};
    return [
      r.timestamp,
      r.platform,
      r.final_score,
      r.category,
      r.severity,
      ...MODEL_KEYS.map((m) => models[m]?.probability ?? ""),
      ...MODEL_KEYS.map((m) => models[m]?.category    ?? ""),
      (r.flagged_keywords || []).map((k) => k.word).join("; "),
      `"${(r.text || "").replace(/"/g, '""')}"`,
    ];
  });

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  triggerDownload(blob, "shield_history.csv");
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────

function HistoryModal({ record, onClose, isDark }) {
  const t     = isDark ? darkTokens : lightTokens;
  const mono  = { fontFamily: "'DM Mono', monospace" };
  const raj   = { fontFamily: "'Rajdhani', sans-serif" };
  const bebas = { fontFamily: "'Bebas Neue', sans-serif" };

  if (!record) return null;

  const models    = record.models    || {};
  const keywords  = record.flagged_keywords || [];
  const MODEL_KEYS = [
    { key: "rule_based",      label: "Rule Based" },
    { key: "toxic_bert",      label: "Toxic-BERT" },
    { key: "twitter_roberta", label: "Twitter RoBERTa" },
    { key: "zero_shot",       label: "Zero-Shot" },
  ];

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{
          background:  isDark ? "#030712" : "#f1f5f9",
          border:      `1px solid ${t.accent}55`,
          boxShadow:   `0 0 60px rgba(6,182,212,0.15)`,
        }}
      >
        {/* ── Modal Header ─────────────────────────────────────────────────── */}
        <div
          className="sticky top-0 flex items-center justify-between px-6 py-4"
          style={{ background: isDark ? "#030712" : "#f1f5f9", borderBottom: `1px solid ${t.border}`, zIndex: 10 }}
        >
          <div>
            <p style={{ color: t.accent, ...mono, fontSize: "0.6rem", letterSpacing: "0.15em" }}>
              // ANALYSIS DETAIL
            </p>
            <p style={{ color: t.textDim, ...mono, fontSize: "0.6rem", marginTop: "2px" }}>
              {fmtDate(record.timestamp)} · {record.platform}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ color: t.textDim, fontSize: "1.2rem", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = t.accent)}
            onMouseLeave={(e) => (e.currentTarget.style.color = t.textDim)}
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">

          {/* ── Overall verdict ──────────────────────────────────────────── */}
          <div
            className="rounded-lg p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ border: `1px solid ${t.border}`, background: t.bgCard }}
          >
            {/* Score donut placeholder */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-full"
              style={{ border: `4px solid ${sevColor(record.severity)}`, background: `${sevColor(record.severity)}10` }}>
              <span style={{ ...bebas, fontSize: "1.6rem", color: sevColor(record.severity), lineHeight: 1 }}>
                {pct(record.final_score)}
              </span>
              <span style={{ ...mono, fontSize: "0.45rem", color: t.textDim, letterSpacing: "0.1em" }}>SCORE</span>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="px-3 py-1 rounded text-xs font-semibold tracking-wide"
                  style={{ ...catBadgeStyle(record.category), ...mono }}
                >
                  {record.category?.toUpperCase()}
                </span>
                <span style={{ color: sevColor(record.severity), ...raj, fontWeight: 700, fontSize: "0.85rem" }}>
                  {record.severity} Severity
                </span>
              </div>
              <p style={{ color: t.textMuted, ...mono, fontSize: "0.65rem", marginTop: "6px" }}>
                Platform: <span style={{ color: t.accent }}>{record.platform}</span>
              </p>
              {record.bullying_types?.length > 0 && (
                <p style={{ color: t.textMuted, ...mono, fontSize: "0.6rem" }}>
                  Types: {record.bullying_types.join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* ── Analyzed text ────────────────────────────────────────────── */}
          <div>
            <p style={{ color: t.textDim, ...mono, fontSize: "0.6rem", letterSpacing: "0.12em", marginBottom: "8px" }}>
              // ANALYZED TEXT
            </p>
            <div
              className="rounded p-4"
              style={{
                border:     `1px solid ${t.border}`,
                background: isDark ? "#0d1829" : "#e2e8f0",
                color:      t.text,
                ...mono,
                fontSize:   "0.75rem",
                lineHeight: 1.7,
                wordBreak:  "break-word",
              }}
            >
              {record.text || <em style={{ color: t.textDim }}>// text not stored</em>}
            </div>
          </div>

          {/* ── Per-model results ─────────────────────────────────────────── */}
          <div>
            <p style={{ color: t.textDim, ...mono, fontSize: "0.6rem", letterSpacing: "0.12em", marginBottom: "10px" }}>
              // MODEL BREAKDOWN
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MODEL_KEYS.map(({ key, label }) => {
                const m = models[key];
                if (!m) return null;
                const prob = Number(m.probability);
                const bar  = Math.round(prob * 100);
                return (
                  <div
                    key={key}
                    className="rounded-lg p-4 space-y-2"
                    style={{ border: `1px solid ${t.border}`, background: t.bgCard }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ color: t.accent, ...mono, fontSize: "0.6rem", letterSpacing: "0.1em" }}>
                        {label.toUpperCase()}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ ...catBadgeStyle(m.category), ...mono, fontSize: "0.5rem", letterSpacing: "0.08em" }}
                      >
                        {m.category}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="w-full h-1.5 rounded-full" style={{ background: t.border }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width:      `${bar}%`,
                          background: sevColor(m.severity),
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span style={{ color: t.textMuted, ...mono, fontSize: "0.55rem" }}>Severity: {m.severity}</span>
                      <span style={{ color: t.text, ...raj, fontWeight: 700, fontSize: "0.85rem" }}>{pct(prob)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Flagged keywords ──────────────────────────────────────────── */}
          {keywords.length > 0 && (
            <div>
              <p style={{ color: t.textDim, ...mono, fontSize: "0.6rem", letterSpacing: "0.12em", marginBottom: "10px" }}>
                // FLAGGED KEYWORDS ({keywords.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border:     "1px solid rgba(239,68,68,0.3)",
                      color:      "#fca5a5",
                      ...mono,
                      fontSize:   "0.6rem",
                    }}
                  >
                    {kw.word}
                    <span style={{ color: "#64748b", marginLeft: "6px" }}>[{kw.category}]</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Close button ─────────────────────────────────────────────── */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded text-xs tracking-widest"
            style={{
              border:     `1px solid ${t.border}`,
              color:      t.textMuted,
              ...mono,
              background: "transparent",
              cursor:     "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; }}
          >
            ✕ CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── HISTORY PANEL (the list the user sees) ───────────────────────────────────

export function HistoryPanel({ userEmail, isDark }) {
  const t     = isDark ? darkTokens : lightTokens;
  const mono  = { fontFamily: "'DM Mono', monospace" };
  const raj   = { fontFamily: "'Rajdhani', sans-serif" };
  const bebas = { fontFamily: "'Bebas Neue', sans-serif" };

  const [history,       setHistory]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [dlFormat,      setDlFormat]      = useState("csv"); // "csv" | "json"

  const fetchHistory = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API}/api/history?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch history");
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDownload = () => {
    if (history.length === 0) return;
    dlFormat === "json" ? downloadJSON(history) : downloadCSV(history);
  };

  const LIMIT = 40;
  const usagePct = Math.min((history.length / LIMIT) * 100, 100);
  const usageColor = usagePct >= 90 ? "#ef4444" : usagePct >= 70 ? "#f59e0b" : "#10b981";

  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClearData = async () => {
    setClearing(true);
    try {
      const res  = await fetch(`${API}/api/history/clear`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Clear failed");
      setHistory([]);
      setConfirmClear(false);
    } catch (err) {
      alert(`Failed to clear data: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  if (!userEmail) {
    return (
      <div className="text-center py-8" style={{ color: t.textDim, ...mono, fontSize: "0.65rem" }}>
        // Sign in to see your analysis history
      </div>
    );
  }

  return (
    <>
      {/* Panel */}
      <div style={{ fontFamily: "'DM Mono',monospace" }}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <p style={{ color: t.accent, ...mono, fontSize: "0.6rem", letterSpacing: "0.15em" }}>
              // ANALYSIS HISTORY
            </p>
            <p style={{ color: t.textDim, ...mono, fontSize: "0.55rem", marginTop: "2px" }}>
              {history.length} record{history.length !== 1 ? "s" : ""} — click any row for details
            </p>
          </div>

          {history.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Format toggle */}
              <div className="flex rounded overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
                {["csv", "json"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setDlFormat(fmt)}
                    style={{
                      padding:    "5px 12px",
                      ...mono,
                      fontSize:   "0.6rem",
                      letterSpacing: "0.1em",
                      background: dlFormat === fmt ? t.accentBg : "transparent",
                      color:      dlFormat === fmt ? t.accent : t.textDim,
                      border:     "none",
                      cursor:     "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Download button */}
              <button
                onClick={handleDownload}
                style={{
                  padding:    "5px 14px",
                  border:     `1px solid ${t.accent}55`,
                  background: t.accentBg,
                  color:      t.accent,
                  ...mono,
                  fontSize:   "0.6rem",
                  letterSpacing: "0.12em",
                  borderRadius: "4px",
                  cursor:     "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 12px ${t.accent}44`)}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                ↓ DOWNLOAD {dlFormat.toUpperCase()}
              </button>

              {/* Refresh */}
              <button
                onClick={fetchHistory}
                style={{
                  padding:    "5px 10px",
                  border:     `1px solid ${t.border}`,
                  background: "transparent",
                  color:      t.textDim,
                  ...mono,
                  fontSize:   "0.65rem",
                  borderRadius: "4px",
                  cursor:     "pointer",
                }}
              >
                ↺
              </button>

              {/* Clear data button */}
              <button
                onClick={() => setConfirmClear(true)}
                style={{
                  padding:    "5px 12px",
                  border:     "1px solid rgba(239,68,68,0.35)",
                  background: "rgba(239,68,68,0.06)",
                  color:      "#ef4444",
                  ...mono,
                  fontSize:   "0.6rem",
                  letterSpacing: "0.1em",
                  borderRadius: "4px",
                  cursor:     "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
              >
                🗑 CLEAR DATA
              </button>
            </div>
          )}
        </div>

        {/* Usage limit bar */}
        <div className="mb-5 rounded p-3" style={{ border: `1px solid ${usageColor}22`, background: `${usageColor}05` }}>
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ color: t.textDim, ...mono, fontSize: "0.55rem", letterSpacing: "0.12em" }}>
              // STORAGE USAGE
            </span>
            <span style={{ color: usageColor, ...mono, fontSize: "0.6rem", fontWeight: 600 }}>
              {history.length} / {LIMIT} ANALYSES
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: "5px", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)" }}>
            <div style={{
              height: "100%",
              width: `${usagePct}%`,
              background: usageColor,
              borderRadius: "999px",
              transition: "width 0.6s ease",
              boxShadow: usagePct >= 90 ? `0 0 8px ${usageColor}88` : "none",
            }} />
          </div>
          {usagePct >= 100 && (
            <p style={{ color: "#ef4444", ...mono, fontSize: "0.55rem", marginTop: "5px", letterSpacing: "0.08em" }}>
              ⚠ LIMIT REACHED — clear old data to run new analyses
            </p>
          )}
          {usagePct >= 70 && usagePct < 100 && (
            <p style={{ color: "#f59e0b", ...mono, fontSize: "0.55rem", marginTop: "5px" }}>
              ⚠ Approaching limit — consider clearing old records
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: t.border, borderTopColor: t.accent }} />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded px-4 py-3" style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
            <p style={{ color: "#ef4444", ...mono, fontSize: "0.65rem" }}>⚠ {error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && history.length === 0 && (
          <div className="text-center py-10" style={{ border: `1px dashed ${t.border}`, borderRadius: "8px" }}>
            <p style={{ color: t.textDim, ...mono, fontSize: "0.65rem" }}>// no history yet — run an analysis first</p>
          </div>
        )}

        {/* List */}
        {!loading && history.length > 0 && (
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
            {history.map((record, i) => (
              <div
                key={i}
                onClick={() => setSelectedRecord(record)}
                className="flex items-center gap-4 px-4 py-3"
                style={{
                  borderBottom: i < history.length - 1 ? `1px solid ${t.border}` : "none",
                  cursor:       "pointer",
                  transition:   "background 0.15s ease",
                  background:   "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = t.accentBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Score circle */}
                <div
                  className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full"
                  style={{
                    border:     `2px solid ${sevColor(record.severity)}`,
                    background: `${sevColor(record.severity)}10`,
                  }}
                >
                  <span style={{ color: sevColor(record.severity), ...bebas, fontSize: "0.75rem", lineHeight: 1 }}>
                    {Math.round(Number(record.final_score) * 100)}
                  </span>
                </div>

                {/* Middle info */}
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      color:        t.text,
                      ...mono,
                      fontSize:     "0.7rem",
                      overflow:     "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace:   "nowrap",
                    }}
                  >
                    {record.text?.slice(0, 80) || "// no text"}
                    {(record.text?.length || 0) > 80 ? "…" : ""}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span style={{ color: t.textDim, ...mono, fontSize: "0.55rem" }}>
                      {fmtDate(record.timestamp)}
                    </span>
                    <span style={{ color: t.accent, ...mono, fontSize: "0.5rem", letterSpacing: "0.08em" }}>
                      {record.platform}
                    </span>
                  </div>
                </div>

                {/* Badge */}
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ ...catBadgeStyle(record.category), ...mono, fontSize: "0.5rem", letterSpacing: "0.08em" }}
                  >
                    {record.category?.toUpperCase()}
                  </span>
                  <span style={{ color: t.textDim, ...mono, fontSize: "0.5rem" }}>
                    → details
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedRecord && (
        <HistoryModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          isDark={isDark}
        />
      )}

      {/* Confirm clear modal */}
      {confirmClear && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-lg p-6 space-y-4"
            style={{ border: "1px solid rgba(239,68,68,0.4)", background: isDark ? "#030712" : "#f1f5f9", boxShadow: "0 0 40px rgba(239,68,68,0.15)" }}>
            <p style={{ color: "#ef4444", ...mono, fontSize: "0.65rem", letterSpacing: "0.15em" }}>// CONFIRM DATA DELETION</p>
            <p style={{ color: t.text, fontFamily: "'Rajdhani',sans-serif", fontSize: "1rem" }}>
              Delete <span style={{ color: "#ef4444" }}>all {history.length} analysis records</span> for your account?
            </p>
            <p style={{ color: t.textDim, ...mono, fontSize: "0.65rem", lineHeight: 1.7 }}>
              This permanently removes all your history from the database. Downloaded exports will not be affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClearData}
                disabled={clearing}
                style={{ flex: 1, padding: "10px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.5)", color: "#ef4444", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: "0.12em", borderRadius: "4px", cursor: clearing ? "not-allowed" : "pointer", opacity: clearing ? 0.6 : 1 }}>
                {clearing ? "CLEARING..." : "DELETE ALL"}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{ flex: 1, padding: "10px", border: `1px solid ${t.border}`, color: t.textMuted, background: "transparent", ...mono, fontSize: "0.7rem", letterSpacing: "0.1em", borderRadius: "4px", cursor: "pointer" }}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HistoryPanel;