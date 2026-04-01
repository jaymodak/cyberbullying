import { useState } from "react";
import { useScrollReveal } from "../styles/cyber.jsx";

export default function Videos() {
  useScrollReveal();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const mono  = { fontFamily: "'DM Mono', monospace" };
  const raj   = { fontFamily: "'Rajdhani', sans-serif" };
  const bebas = { fontFamily: "'Bebas Neue', sans-serif" };

  const videos = [
    {
      title: "Cyberbullying Law Explained",
      link: "https://www.youtube.com/embed/7oKjW1OIjuw",
      tag: "LEGAL",
      tagColor: "#f59e0b",
      desc: "An expert breakdown of cyberbullying laws and what victims can do.",
    },
    {
      title: "How to Combat Cyberbullying",
      link: "https://www.youtube.com/embed/G_K9z7tdzy8?rel=0",
      tag: "PREVENTION",
      tagColor: "#10b981",
      desc: "Practical strategies for dealing with and preventing online harassment.",
    },
    {
      title: "How to Stop Bullying — Best Solutions for Students",
      link: "https://www.youtube.com/embed/iFlrCuSyhvU?rel=0",
      tag: "STUDENTS",
      tagColor: "#06b6d4",
      desc: "Real examples and evidence-based solutions aimed at students and young people.",
    },
    {
      title: "Cyberbullying Awareness",
      link: "https://www.youtube.com/embed/tkZ5W01VAeg?rel=0",
      tag: "AWARENESS",
      tagColor: "#8b5cf6",
      desc: "A deep dive into the psychological and social impacts of cyberbullying.",
    },
    {
      title: "Advice for Parents on Cyberbullying",
      link: "https://www.youtube.com/embed/syCyqn1jYhM?rel=0",
      tag: "PARENTS",
      tagColor: "#ef4444",
      desc: "How parents can recognize warning signs and support children who are being bullied online.",
    },
    {
      title: "Online Safety for Teens",
      link: "https://www.youtube.com/embed/G_K9z7tdzy8?rel=0",
      tag: "STUDENTS",
      tagColor: "#06b6d4",
      desc: "Essential digital literacy and safety guidance for teenagers navigating social platforms.",
    },
  ];

  const filters = ["ALL", "LEGAL", "PREVENTION", "STUDENTS", "AWARENESS", "PARENTS"];

  const filtered = videos.filter((v) => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) ||
                        v.desc.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === "ALL" || v.tag === activeFilter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="relative min-h-screen" style={{ ...mono }}>
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="reveal text-center mb-12">
          <p style={{ color: "#06b6d4", fontSize: "0.7rem", letterSpacing: "0.15em", ...mono, marginBottom: "8px" }}>
            // VIDEO ARCHIVE
          </p>
          <h1 style={{ ...bebas, fontSize: "clamp(3rem,8vw,6rem)", color: "#64748b", letterSpacing: "0.05em", lineHeight: 1 }}>
            AWARENESS <span style={{ color: "#06b6d4" }}>VIDEOS</span>
          </h1>
          <p style={{ color: "#334155", fontSize: "0.75rem", marginTop: "8px", ...mono }}>
            Curated educational content on cyberbullying prevention, laws, and mental health
          </p>
        </div>

        {/* Search + filters */}
        <div className="reveal mb-10 space-y-4">
          {/* Search input */}
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "#64748b" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="// search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cyber-input w-full pl-11 pr-4 py-3"
              style={{ fontSize: "0.75rem",
                    color: "#1e293b",
              }}
            />
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className="px-3 py-1.5 rounded text-xs tracking-widest transition-all duration-200"
                style={{
                  ...mono,
                  border: activeFilter === f ? "1px solid rgba(6,182,212,0.6)" : "1px solid rgba(6,182,212,0.12)",
                  background: activeFilter === f ? "rgba(6,182,212,0.15)" : "rgba(6,182,212,0.02)",
                  color: activeFilter === f ? "#06b6d4" : "#334155",
                  fontSize: "0.62rem",
                  letterSpacing: "0.12em",
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="reveal mb-6">
          <p style={{ color: "#64748b", ...mono, fontSize: "0.65rem", letterSpacing: "0.1em" }}>
            // SHOWING {filtered.length} OF {videos.length} VIDEOS
          </p>
        </div>

        {/* Video grid */}
        {filtered.length === 0 ? (
          <div className="reveal text-center py-20"
            style={{ border: "1px solid rgba(6,182,212,0.08)", borderRadius: "4px", background: "rgba(6,182,212,0.01)" }}>
            <p style={{ color: "#1e293b", ...mono, fontSize: "0.7rem", letterSpacing: "0.1em" }}>// NO MATCHES FOUND</p>
            <button onClick={() => { setSearch(""); setActiveFilter("ALL"); }}
              className="mt-4 cyber-btn px-4 py-2 text-xs tracking-widest">CLEAR FILTERS</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((v, i) => (
              <div key={i} className={`reveal delay-${(i % 3) + 1} rounded overflow-hidden group transition-all duration-400`}
                style={{ border: `1px solid ${v.tagColor}22`, background: `${v.tagColor}03` }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.borderColor = `${v.tagColor}55`; e.currentTarget.style.boxShadow = `0 12px 30px ${v.tagColor}12`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)";   e.currentTarget.style.borderColor = `${v.tagColor}22`; e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Video embed */}
                <div className="relative" style={{ paddingBottom: "56.25%", overflow: "hidden" }}>
                  {/* Cyan overlay on hover */}
                  <div className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(to bottom, transparent 60%, ${v.tagColor}22)` }} />
                  <iframe
                    src={v.link}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    title={v.title}
                    style={{ border: "none" }}
                  />
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 style={{ color: "#e2e8f0", ...raj, fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.4, letterSpacing: "0.02em" }}>
                      {v.title}
                    </h3>
                    <span className="shrink-0 px-2 py-0.5 rounded text-xs"
                      style={{ border: `1px solid ${v.tagColor}44`, color: v.tagColor, background: `${v.tagColor}11`, ...mono, fontSize: "0.55rem", letterSpacing: "0.12em" }}>
                      {v.tag}
                    </span>
                  </div>
                  <p style={{ color: "#475569", ...mono, fontSize: "0.65rem", lineHeight: 1.7 }}>{v.desc}</p>

                  {/* Bottom bar */}
                  <div className="pt-1" style={{ borderTop: `1px solid ${v.tagColor}15` }}>
                    <a href={v.link.replace("embed/", "watch?v=").split("?rel=0")[0]} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
                      style={{ color: v.tagColor, ...mono, fontSize: "0.6rem", letterSpacing: "0.1em", textDecoration: "none" }}>
                      OPEN IN YOUTUBE
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}