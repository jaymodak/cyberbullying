import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { darkTokens, lightTokens } from "../styles/cyber.jsx";

const CATEGORIES = ["direct_insults", "threat_intimidation", "body_shaming", "social_exclusion", "hate_speech", "harassment","hashtag_bullying","threats_intimidation","discriminatory_slurs","comment_trolling","post_trolling","tweet_trolling"];
const PLATFORMS  = ["general", "facebook", "twitter", "instagram"];
const SEVERITIES = [1, 2, 3, 4, 5];

const API = import.meta.env.VITE_API_URL;

// ── BUG FIX: useScrollReveal was called from cyber.jsx with an empty dep array,
// so .reveal elements added dynamically (on tab switch) were never observed.
// We use our own local reveal trigger here instead.
function useTabReveal(activeTab) {
  useEffect(() => {
    // Wait one rAF so React has finished painting the new tab content
    const id = requestAnimationFrame(() => {
      document.querySelectorAll(".reveal:not(.revealed)").forEach((el) =>
        el.classList.add("revealed")
      );
    });
    return () => cancelAnimationFrame(id);
  }, [activeTab]);
}

export default function Admin() {
  const { isAdmin, isDark } = useAuth();
  const navigate = useNavigate();
  const t        = isDark ? darkTokens : lightTokens;

  // ── State ─────────────────────────────────────────────────────────────────
  const [patterns,     setPatterns]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [filterCat,    setFilterCat]    = useState("all");
  const [filterSev,    setFilterSev]    = useState("all");
  const [activeTab,    setActiveTab]    = useState("manage");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget,   setEditTarget]   = useState(null);
  const [toast,        setToast]        = useState(null);

  // Add form
  const [form,        setForm]        = useState({ word: "", platform: "general", category: "insult", severity_score: 3 });
  const [formErr,     setFormErr]     = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // JSON upload
  const [jsonText,      setJsonText]      = useState("");
  const [jsonStatus,    setJsonStatus]    = useState(null);
  const [jsonLoading,   setJsonLoading]   = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);
  const fileRef = useRef(null);

  // Suggestions
  const [suggestions,    setSuggestions]    = useState([]);
  const [sugLoading,     setSugLoading]     = useState(false);

  // ── BUG FIX: re-trigger reveal animations on every tab switch ────────────
  useTabReveal(activeTab);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ fontFamily: "'DM Mono',monospace" }}
      >
        <p style={{ color: "#ef4444", fontSize: "0.8rem", letterSpacing: "0.15em" }}>
          // ACCESS DENIED
        </p>
        <button
          onClick={() => navigate("/app")}
          className={`${t.btnClass} px-6 py-2 text-xs tracking-widest`}
        >
          ← RETURN TO APP
        </button>
      </div>
    );
  }

  const mono  = { fontFamily: "'DM Mono', monospace" };
  const raj   = { fontFamily: "'Rajdhani', sans-serif" };
  const bebas = { fontFamily: "'Bebas Neue', sans-serif" };

  const sevColor = (s) => (s >= 4 ? "#ef4444" : s === 3 ? "#f59e0b" : "#10b981");

  // ── Fetch patterns ────────────────────────────────────────────────────────
  const fetchPatterns = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/patterns`);
      const data = await res.json();
      setPatterns(data.patterns || []);
    } catch {
      showToast("Failed to load patterns", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    setSugLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/suggestions`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      showToast("Failed to load suggestions", "error");
    } finally {
      setSugLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatterns(); fetchSuggestions(); }, [fetchPatterns, fetchSuggestions]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = patterns.filter((p) => {
    const matchSearch = !search || p.word?.toLowerCase().includes(search.toLowerCase());
    const matchCat    = filterCat === "all" || p.category === filterCat;
    const matchSev    = filterSev === "all" || String(p.severity_score) === filterSev;
    return matchSearch && matchCat && matchSev;
  });

  // ── Add word ──────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    setFormErr("");
    if (!form.word.trim()) { setFormErr("Word cannot be empty"); return; }
    const exists = patterns.some(
      (p) => p.word?.toLowerCase() === form.word.toLowerCase().trim()
    );
    if (exists) { setFormErr("Word already exists in database"); return; }

    setFormLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/patterns`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ patterns: [{ ...form, word: form.word.trim() }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Insert failed");
      showToast(`✓ "${form.word}" added successfully`);
      setForm({ word: "", platform: "general", category: "insult", severity_score: 3 });
      fetchPatterns();
    } catch (err) {
      setFormErr(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete word ───────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const res  = await fetch(`${API}/api/admin/patterns/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      showToast("✓ Pattern deleted");
      setDeleteTarget(null);
      fetchPatterns();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ── Edit word ─────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    try {
      const res  = await fetch(`${API}/api/admin/patterns/${editTarget._id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          word:           editTarget.word,
          platform:       editTarget.platform,
          category:       editTarget.category,
          severity_score: editTarget.severity_score,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      showToast("✓ Pattern updated");
      setEditTarget(null);
      fetchPatterns();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ── JSON batch upload ──────────────────────────────────────────────────────
  const handleJSONUpload = async () => {
    setJsonStatus(null);
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error("Root must be a JSON array");
    } catch (e) {
      setJsonStatus({ type: "error", msg: `Invalid JSON: ${e.message}` });
      return;
    }

    // Validate each entry
    for (const [i, p] of parsed.entries()) {
      if (!p.word)     { setJsonStatus({ type: "error", msg: `Item [${i}] missing "word"` });     return; }
      if (!p.platform) { setJsonStatus({ type: "error", msg: `Item [${i}] missing "platform"` }); return; }
      if (!p.category) { setJsonStatus({ type: "error", msg: `Item [${i}] missing "category"` }); return; }
    }

    setJsonLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/patterns`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ patterns: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setJsonStatus({ type: "success", msg: `✓ ${data.inserted} patterns inserted` });
      setUploadHistory((prev) => [
        {
          count:   data.inserted,
          time:    new Date().toLocaleString("en-IN"),
          preview: parsed.slice(0, 3).map((p) => p.word).join(", "),
        },
        ...prev,
      ]);
      setJsonText("");
      fetchPatterns();
    } catch (err) {
      setJsonStatus({ type: "error", msg: err.message });
    } finally {
      setJsonLoading(false);
    }
  };

  // ── File drop handler ─────────────────────────────────────────────────────
  const handleFileDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (!f.name.endsWith(".json")) {
      setJsonStatus({ type: "error", msg: "Only .json files accepted" });
      return;
    }
    const r = new FileReader();
    r.onload = (ev) => setJsonText(ev.target.result);
    r.readAsText(f);
  };

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setJsonText(ev.target.result);
    r.readAsText(f);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const tabs = [
    { id: "manage",      label: "// MANAGE PATTERNS" },
    { id: "add",         label: "// ADD WORD" },
    { id: "upload",      label: "// BATCH UPLOAD" },
    { id: "suggestions", label: "// SUGGESTIONS" },
  ];

  return (
    <div style={{ minHeight: "100vh", ...mono }}>
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Toast */}
        {toast && (
          <div
            className="fixed top-20 right-6 z-[200] px-4 py-3 rounded"
            style={{
              border:     `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
              background: isDark ? "#030712" : "#f1f5f9",
              color:      toast.type === "success" ? "#10b981" : "#ef4444",
              ...mono,
              fontSize:   "0.7rem",
              boxShadow:  "0 0 20px rgba(0,0,0,0.3)",
            }}
          >
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="reveal text-center mb-10">
          <p style={{ color: t.accent, fontSize: "0.7rem", letterSpacing: "0.15em", marginBottom: "8px", ...mono }}>
            // ADMIN CONTROL PANEL
          </p>
          <h1 style={{ ...bebas, fontSize: "clamp(2.5rem,7vw,5rem)", color: t.text, letterSpacing: "0.05em", lineHeight: 1 }}>
            PATTERN <span style={{ color: t.accent }}>MANAGER</span>
          </h1>
        </div>

        {/* Stats */}
        <div className="reveal grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "TOTAL PATTERNS", value: patterns.length },
            { label: "FILTERED",       value: filtered.length },
            { label: "CATEGORIES",     value: [...new Set(patterns.map((p) => p.category))].length },
            { label: "PLATFORMS",      value: [...new Set(patterns.map((p) => p.platform))].length },
          ].map((s, i) => (
            <div key={i} className="rounded p-4 text-center" style={{ border: `1px solid ${t.border}`, background: t.bgCard }}>
              <p style={{ ...bebas, fontSize: "2rem", color: t.accent, lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: t.textDim, fontSize: "0.55rem", letterSpacing: "0.12em", marginTop: "4px", ...mono }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── TABS ─────────────────────────────────────────────────────────── */}
        <div className="flex rounded overflow-hidden mb-6" style={{ border: `1px solid ${t.border}` }}>
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-3 text-xs tracking-widest"
              style={{
                ...mono,
                background:  activeTab === tab.id ? t.accentBg : "transparent",
                color:       activeTab === tab.id ? t.accent : t.textDim,
                borderRight: i < tabs.length - 1 ? `1px solid ${t.border}` : "none",
                fontWeight:  activeTab === tab.id ? 600 : 400,
                // BUG FIX: remove transition from tab buttons so clicks register
                // immediately without animation delays interfering
                transition:  "background-color 0.15s ease, color 0.15s ease",
                cursor:      "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: MANAGE ──────────────────────────────────────────────────── */}
        {activeTab === "manage" && (
          <div className="reveal space-y-4">
            {/* Search + filters */}
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="// search words..."
                className={`flex-1 px-4 py-2.5 ${t.inputClass}`}
                style={{ minWidth: "200px" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className={`px-3 py-2.5 ${t.inputClass}`}
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
              >
                <option value="all">ALL CATEGORIES</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
              <select
                className={`px-3 py-2.5 ${t.inputClass}`}
                value={filterSev}
                onChange={(e) => setFilterSev(e.target.value)}
              >
                <option value="all">ALL SEVERITIES</option>
                {SEVERITIES.map((s) => <option key={s} value={s}>SEVERITY {s}</option>)}
              </select>
              <button onClick={fetchPatterns} className={`px-4 py-2 text-xs tracking-widest ${t.btnClass}`}>
                ↺ REFRESH
              </button>
            </div>

            {/* Table */}
            <div className="rounded overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
              {/* Header row */}
              <div className="grid grid-cols-12 px-4 py-2" style={{ background: t.accentBg, borderBottom: `1px solid ${t.border}` }}>
                {[["WORD", 3], ["PLATFORM", 2], ["CATEGORY", 2], ["SEV", 1], ["ACTIONS", 4]].map(([h, span]) => (
                  <div key={h} className={`col-span-${span}`}>
                    <p style={{ color: t.accent, fontSize: "0.55rem", letterSpacing: "0.15em", ...mono }}>{h}</p>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{ borderColor: t.border, borderTopColor: t.accent }} />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <p style={{ color: t.textDim, ...mono, fontSize: "0.65rem" }}>// NO PATTERNS FOUND</p>
                </div>
              ) : filtered.map((p, i) => (
                <div
                  key={p._id || i}
                  className="grid grid-cols-12 px-4 py-3 items-center"
                  style={{
                    borderBottom: `1px solid ${t.border}`,
                    background:   i % 2 === 0 ? "transparent" : (isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)"),
                    transition:   "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = t.accentBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : (isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)"))}
                >
                  <div className="col-span-3">
                    <span style={{ color: t.text, ...raj, fontWeight: 600, fontSize: "0.85rem" }}>{p.word}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="px-2 py-0.5 rounded" style={{ background: t.accentBg, color: t.accent, ...mono, fontSize: "0.55rem", letterSpacing: "0.1em" }}>
                      {p.platform}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span style={{ color: t.textMuted, ...mono, fontSize: "0.6rem" }}>{p.category}</span>
                  </div>
                  <div className="col-span-1">
                    <span style={{ color: sevColor(p.severity_score), ...bebas, fontSize: "1rem" }}>{p.severity_score}</span>
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <button
                      onClick={() => setEditTarget({ ...p })}
                      className="px-3 py-1 rounded text-xs tracking-widest"
                      style={{ border: `1px solid ${t.border}`, color: t.accent, background: "transparent", ...mono, fontSize: "0.6rem", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.background = t.accentBg; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = "transparent"; }}
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="px-3 py-1 rounded text-xs tracking-widest"
                      style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", background: "transparent", ...mono, fontSize: "0.6rem", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: ADD WORD ─────────────────────────────────────────────────── */}
        {activeTab === "add" && (
          <div className="reveal max-w-lg mx-auto space-y-5">
            <div className="rounded-lg p-6 space-y-5" style={{ border: `1px solid ${t.border}`, background: t.bgCard }}>
              <p style={{ color: t.accent, ...mono, fontSize: "0.65rem", letterSpacing: "0.15em" }}>
                // ADD NEW PATTERN
              </p>

              {/* Word input */}
              <div>
                <p style={{ color: t.textDim, fontSize: "0.6rem", letterSpacing: "0.15em", ...mono, marginBottom: "6px" }}>
                  WORD / PHRASE
                </p>
                <input
                  type="text"
                  className={`w-full px-4 py-3 ${t.inputClass}`}
                  placeholder="// enter word or phrase"
                  value={form.word}
                  onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>

              {/* Platform + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p style={{ color: t.textDim, fontSize: "0.6rem", letterSpacing: "0.15em", ...mono, marginBottom: "6px" }}>PLATFORM</p>
                  <select
                    className={`w-full px-3 py-3 ${t.inputClass}`}
                    value={form.platform}
                    onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                  >
                    {PLATFORMS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ color: t.textDim, fontSize: "0.6rem", letterSpacing: "0.15em", ...mono, marginBottom: "6px" }}>CATEGORY</p>
                  <select
                    className={`w-full px-3 py-3 ${t.inputClass}`}
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              {/* Severity */}
              <div>
                <p style={{ color: t.textDim, fontSize: "0.6rem", letterSpacing: "0.15em", ...mono, marginBottom: "8px" }}>
                  SEVERITY: {form.severity_score}
                </p>
                <div className="flex gap-2">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setForm((f) => ({ ...f, severity_score: s }))}
                      className="flex-1 py-2 rounded text-sm"
                      style={{
                        border:     `1px solid ${form.severity_score === s ? sevColor(s) : t.border}`,
                        background: form.severity_score === s ? `${sevColor(s)}15` : "transparent",
                        color:      form.severity_score === s ? sevColor(s) : t.textDim,
                        ...bebas,
                        fontSize:   "1rem",
                        cursor:     "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {formErr && (
                <p style={{ color: "#ef4444", ...mono, fontSize: "0.65rem" }}>⚠ {formErr}</p>
              )}

              <button
                onClick={handleAdd}
                disabled={formLoading}
                className={`w-full py-3 text-sm tracking-widest flex items-center justify-center gap-2 ${t.btnClass}`}
                style={{ opacity: formLoading ? 0.6 : 1, cursor: formLoading ? "not-allowed" : "pointer" }}
              >
                {formLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: "transparent", borderTopColor: t.accent }} />
                    INSERTING...
                  </>
                ) : "▶ ADD TO DATABASE"}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: BATCH UPLOAD ─────────────────────────────────────────────── */}
        {activeTab === "upload" && (
          <div className="reveal grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="rounded p-8 text-center"
                style={{ border: `2px dashed ${t.border}`, background: "transparent", cursor: "pointer", transition: "border-color 0.2s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = t.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = t.border)}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <p style={{ color: t.accent, ...mono, fontSize: "0.75rem" }}>⬇ DROP .JSON FILE HERE</p>
                <p style={{ color: t.textDim, ...mono, fontSize: "0.6rem", marginTop: "4px" }}>or click to browse</p>
              </div>

              {/* JSON preview / editor */}
              <textarea
                rows={10}
                className={`w-full p-4 resize-none ${t.inputClass}`}
                placeholder={`[\n  { "word": "loser", "platform": "general", "category": "insult", "severity_score": 3 }\n]`}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />

              {jsonStatus && (
                <div
                  className="rounded px-4 py-3"
                  style={{
                    border:     `1px solid ${jsonStatus.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                    background: jsonStatus.type === "success" ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)",
                  }}
                >
                  <p style={{ color: jsonStatus.type === "success" ? "#10b981" : "#ef4444", ...mono, fontSize: "0.7rem" }}>
                    {jsonStatus.msg}
                  </p>
                </div>
              )}

              <button
                onClick={handleJSONUpload}
                disabled={jsonLoading || !jsonText.trim()}
                className={`w-full py-3 text-sm tracking-widest flex items-center justify-center gap-2 ${t.btnClass}`}
                style={{ opacity: jsonLoading || !jsonText.trim() ? 0.5 : 1, cursor: jsonLoading || !jsonText.trim() ? "not-allowed" : "pointer" }}
              >
                {jsonLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: "transparent", borderTopColor: t.accent }} />
                    UPLOADING...
                  </>
                ) : "▶ INSERT INTO MONGODB"}
              </button>
            </div>

            {/* Upload log */}
            <div>
              <p style={{ color: t.textDim, fontSize: "0.6rem", letterSpacing: "0.15em", ...mono, marginBottom: "12px" }}>
                // UPLOAD LOG
              </p>
              <div className="rounded overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
                {uploadHistory.length === 0 ? (
                  <div className="text-center py-10" style={{ background: t.bgCard }}>
                    <p style={{ color: t.textDim, ...mono, fontSize: "0.65rem" }}>// no uploads this session</p>
                  </div>
                ) : uploadHistory.map((h, i) => (
                  <div key={i} className="px-4 py-3" style={{ borderBottom: `1px solid ${t.border}` }}>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "#10b981", ...mono, fontSize: "0.65rem" }}>✓ {h.count} patterns</span>
                      <span style={{ color: t.textDim, ...mono, fontSize: "0.6rem" }}>{h.time}</span>
                    </div>
                    <p style={{ color: t.textMuted, ...mono, fontSize: "0.6rem", marginTop: "2px" }}>
                      {h.preview}
                    </p>
                  </div>
                ))}
              </div>

              {/* Format guide */}
              <div className="mt-4 rounded p-4" style={{ border: `1px solid ${t.border}`, background: t.bgCard }}>
                <p style={{ color: t.accent, ...mono, fontSize: "0.6rem", letterSpacing: "0.12em", marginBottom: "8px" }}>
                  // REQUIRED FORMAT
                </p>
                <pre style={{ color: t.textMuted, fontSize: "0.6rem", lineHeight: 1.7, ...mono, overflowX: "auto" }}>
{`[
  {
    "word": "example",
    "platform": "general",
    "category": "insult",
    "severity_score": 3
  }
]`}
                </pre>
                <p style={{ color: t.textDim, fontSize: "0.55rem", ...mono, marginTop: "8px" }}>
                  platform: general | facebook | twitter | instagram<br/>
                  category: insult | threat | body_shame | exclusion | hate_speech | harassment<br/>
                  severity_score: 1–5
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: SUGGESTIONS ──────────────────────────────────────────────── */}
        {activeTab === "suggestions" && (
          <div className="reveal space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
              <div>
                <p style={{ color: t.accent, ...mono, fontSize: "0.6rem", letterSpacing: "0.15em" }}>
                  // USER SUGGESTIONS
                </p>
                <p style={{ color: t.textDim, ...mono, fontSize: "0.55rem", marginTop: "2px" }}>
                  {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""} received
                </p>
              </div>
              <button
                onClick={fetchSuggestions}
                className={`px-4 py-2 text-xs tracking-widest ${t.btnClass}`}
              >
                ↺ REFRESH
              </button>
            </div>

            {sugLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 animate-spin"
                  style={{ borderColor: t.border, borderTopColor: t.accent }} />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-16 rounded"
                style={{ border: `1px dashed ${t.border}`, background: t.bgCard }}>
                <p style={{ color: t.textDim, ...mono, fontSize: "0.65rem" }}>
                  // no suggestions yet
                </p>
                <p style={{ color: t.textDim, ...mono, fontSize: "0.55rem", marginTop: "6px" }}>
                  users can submit suggestions from the site footer
                </p>
              </div>
            ) : (
              <div className="rounded overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
                {/* Column header */}
                <div className="grid grid-cols-12 px-4 py-2"
                  style={{ background: t.accentBg, borderBottom: `1px solid ${t.border}` }}>
                  {[["SUGGESTION", 7], ["FROM", 3], ["DATE", 2]].map(([h, span]) => (
                    <div key={h} className={`col-span-${span}`}>
                      <p style={{ color: t.accent, fontSize: "0.55rem", letterSpacing: "0.15em", ...mono }}>{h}</p>
                    </div>
                  ))}
                </div>

                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 px-4 py-3 items-start"
                    style={{
                      borderBottom: i < suggestions.length - 1 ? `1px solid ${t.border}` : "none",
                      background:   i % 2 === 0 ? "transparent" : (isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)"),
                      transition:   "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = t.accentBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : (isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)"))}
                  >
                    {/* Text */}
                    <div className="col-span-7 pr-4">
                      <p style={{ color: t.text, fontFamily: "'Rajdhani',sans-serif", fontWeight: 500, fontSize: "0.9rem", lineHeight: 1.5 }}>
                        {s.text}
                      </p>
                    </div>
                    {/* Email */}
                    <div className="col-span-3">
                      <span style={{ color: t.accent, ...mono, fontSize: "0.55rem", wordBreak: "break-all" }}>
                        {s.email || "anonymous"}
                      </span>
                    </div>
                    {/* Timestamp */}
                    <div className="col-span-2">
                      <span style={{ color: t.textDim, ...mono, fontSize: "0.55rem" }}>
                        {s.timestamp
                          ? new Date(s.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── DELETE CONFIRM MODAL ──────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-lg p-6 space-y-4"
            style={{ border: "1px solid rgba(239,68,68,0.4)", background: isDark ? "#030712" : "#e2e8f0", boxShadow: "0 0 40px rgba(239,68,68,0.15)" }}>
            <p style={{ color: "#ef4444", ...mono, fontSize: "0.65rem", letterSpacing: "0.15em" }}>// CONFIRM DELETION</p>
            <p style={{ color: t.text, ...raj, fontSize: "1rem" }}>
              Delete <span style={{ color: "#ef4444" }}>"{deleteTarget.word}"</span> from the patterns database?
            </p>
            <p style={{ color: t.textDim, ...mono, fontSize: "0.65rem" }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteTarget._id)}
                className="flex-1 py-2.5 rounded text-sm tracking-widest"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.5)", color: "#ef4444", ...raj, fontWeight: 700, letterSpacing: "0.12em", cursor: "pointer" }}
              >
                DELETE
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className={`flex-1 py-2.5 text-sm tracking-widest ${t.btnClass}`}
                style={{ cursor: "pointer" }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ────────────────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-lg p-6 space-y-4"
            style={{ border: `1px solid ${t.accent}44`, background: isDark ? "#030712" : "#e2e8f0", boxShadow: "0 0 40px rgba(6,182,212,0.1)" }}>
            <p style={{ color: t.accent, ...mono, fontSize: "0.65rem", letterSpacing: "0.15em" }}>// EDIT PATTERN</p>

            <div>
              <p style={{ color: t.textDim, ...mono, fontSize: "0.6rem", marginBottom: "5px" }}>WORD</p>
              <input type="text" className={`w-full px-4 py-2.5 ${t.inputClass}`}
                value={editTarget.word}
                onChange={(e) => setEditTarget((et) => ({ ...et, word: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p style={{ color: t.textDim, ...mono, fontSize: "0.6rem", marginBottom: "5px" }}>PLATFORM</p>
                <select className={`w-full px-3 py-2.5 ${t.inputClass}`} value={editTarget.platform}
                  onChange={(e) => setEditTarget((et) => ({ ...et, platform: e.target.value }))}>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <p style={{ color: t.textDim, ...mono, fontSize: "0.6rem", marginBottom: "5px" }}>CATEGORY</p>
                <select className={`w-full px-3 py-2.5 ${t.inputClass}`} value={editTarget.category}
                  onChange={(e) => setEditTarget((et) => ({ ...et, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <p style={{ color: t.textDim, ...mono, fontSize: "0.6rem", marginBottom: "8px" }}>SEVERITY: {editTarget.severity_score}</p>
              <div className="flex gap-2">
                {SEVERITIES.map((s) => (
                  <button key={s} onClick={() => setEditTarget((et) => ({ ...et, severity_score: s }))}
                    className="flex-1 py-2 rounded text-sm"
                    style={{
                      border:     `1px solid ${editTarget.severity_score === s ? sevColor(s) : t.border}`,
                      background: editTarget.severity_score === s ? `${sevColor(s)}15` : "transparent",
                      color:      editTarget.severity_score === s ? sevColor(s) : t.textDim,
                      ...bebas,
                      fontSize:   "1rem",
                      cursor:     "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleEdit}
                className={`flex-1 py-2.5 text-sm tracking-widest ${t.btnClass}`}
                style={{ cursor: "pointer" }}>
                ▶ SAVE CHANGES
              </button>
              <button onClick={() => setEditTarget(null)}
                className="flex-1 py-2.5 rounded text-sm tracking-widest"
                style={{ border: `1px solid ${t.border}`, color: t.textMuted, ...mono, fontSize: "0.7rem", cursor: "pointer" }}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}