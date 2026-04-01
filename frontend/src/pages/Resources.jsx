import { useScrollReveal, SectionHeader } from "../styles/cyber.jsx";

export default function Resources() {
  useScrollReveal();

  const mono  = { fontFamily: "'DM Mono', monospace" };
  const raj   = { fontFamily: "'Rajdhani', sans-serif" };
  const bebas = { fontFamily: "'Bebas Neue', sans-serif" };

  const categories = [
    {
      eyebrow: "// REPORT",
      title: "REPORT CYBERBULLYING",
      color: "#ef4444",
      items: [
        { name: "National Cyber Crime Portal", desc: "Official Indian government portal to report cybercrimes including harassment.", href: "https://cybercrime.gov.in/", tag: "GOV" },
        { name: "Cyber Crime Helpline", desc: "Call 1930 to report cyberbullying and online harassment.", href: "tel:1930", tag: "CALL" },
        { name: "Google Report Center", desc: "Report abusive content across Google platforms.", href: "https://support.google.com/", tag: "WEB" },
        { name: "Meta Safety Center", desc: "Report harassment on Facebook and Instagram.", href: "https://www.facebook.com/safety/", tag: "WEB" },
      ]
    },
    {
      eyebrow: "// SUPPORT",
      title: "MENTAL HEALTH SUPPORT",
      color: "#06b6d4",
      items: [
        { name: "iCall — TISS", desc: "Free counselling by trained psychologists. Mon–Sat 8AM–10PM.", href: "https://icallhelpline.org/", tag: "FREE" },
        { name: "Vandrevala Foundation", desc: "24x7 mental health helpline. Call 9999 666 555.", href: "tel:9999666555", tag: "24x7" },
        { name: "Kiran Mental Health Helpline", desc: "Free government mental health helpline. Call 1800-599-0019.", href: "tel:18005990019", tag: "FREE" },
        { name: "Aasra", desc: "Crisis intervention helpline. Call 9820466726.", href: "tel:9820466726", tag: "24x7" },
      ]
    },
    {
      eyebrow: "// LEARN",
      title: "EDUCATIONAL RESOURCES",
      color: "#10b981",
      items: [
        { name: "StopBullying.gov", desc: "US federal resource with prevention strategies, research, and guides.", href: "https://www.stopbullying.gov/", tag: "EDU" },
        { name: "Cyberbullying Research Center", desc: "Academic research, statistics, and prevention tools.", href: "https://cyberbullying.org/", tag: "RESEARCH" },
        { name: "UNESCO — Cyberbullying Guide", desc: "Global guide on cyberbullying prevention for educators.", href: "https://en.unesco.org/", tag: "GLOBAL" },
        { name: "NCERT — Digital Safety", desc: "India's National Curriculum Framework on digital safety.", href: "https://ncert.nic.in/", tag: "INDIA" },
      ]
    },
    {
      eyebrow: "// TOOLS",
      title: "SAFETY TOOLS",
      color: "#8b5cf6",
      items: [
        { name: "Google Family Link", desc: "Monitor and manage your child's digital activity.", href: "https://families.google.com/familylink/", tag: "APP" },
        { name: "Screen Time — iOS", desc: "Built-in parental controls on iPhone and iPad.", href: "https://support.apple.com/en-us/HT208982", tag: "IOS" },
        { name: "NetNanny", desc: "Premium parental control software for all platforms.", href: "https://www.netnanny.com/", tag: "TOOL" },
        { name: "Bark — Parental Monitoring", desc: "AI-powered monitoring for kids' online activity.", href: "https://www.bark.us/", tag: "AI" },
      ]
    },
  ];

  return (
    <div className="relative min-h-screen" style={{ ...mono }}>
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="reveal text-center mb-16">
          <p style={{ color: "#06b6d4", fontSize: "0.7rem", letterSpacing: "0.15em", ...mono, marginBottom: "8px" }}>
            // RESOURCE DATABASE
          </p>
          <h1 style={{ ...bebas, fontSize: "clamp(3rem,8vw,6rem)", color: "#64748b", letterSpacing: "0.05em", lineHeight: 1 }}>
            CRISIS <span style={{ color: "#06b6d4" }}>RESOURCES</span>
          </h1>
          <p style={{ color: "#334155", fontSize: "0.75rem", marginTop: "8px", ...mono }}>
            Verified helplines, reporting portals, and educational tools
          </p>
        </div>

        {/* Category sections */}
        {categories.map((cat, ci) => (
          <div key={ci} className="mb-16">
            <div className={`reveal delay-${(ci % 3) + 1} mb-6 flex items-center gap-4`}>
              <div className="w-px h-8" style={{ background: `linear-gradient(to bottom, ${cat.color}, transparent)` }} />
              <div>
                <p style={{ color: cat.color, fontSize: "0.6rem", letterSpacing: "0.2em", ...mono }}>{cat.eyebrow}</p>
                <h2 style={{ ...bebas, fontSize: "1.8rem", color: "#f1f5f9", letterSpacing: "0.08em", lineHeight: 1 }}>{cat.title}</h2>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {cat.items.map((item, ii) => (
                <a key={ii} href={item.href} target="_blank" rel="noopener noreferrer"
                  className={`reveal delay-${ii + 1} flex items-start justify-between gap-4 p-5 rounded transition-all duration-300 group`}
                  style={{ border: `1px solid ${cat.color}22`, background: `${cat.color}04`, textDecoration: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = `${cat.color}55`; e.currentTarget.style.background = `${cat.color}08`; e.currentTarget.style.boxShadow = `0 8px 25px ${cat.color}15`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)";   e.currentTarget.style.borderColor = `${cat.color}22`; e.currentTarget.style.background = `${cat.color}04`; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 style={{ color: "#e2e8f0", ...raj, fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.03em" }}>{item.name}</h3>
                    </div>
                    <p style={{ color: "#475569", fontSize: "0.7rem", lineHeight: 1.6, ...mono }}>{item.desc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded text-xs"
                      style={{ border: `1px solid ${cat.color}44`, color: cat.color, background: `${cat.color}11`, ...mono, fontSize: "0.6rem", letterSpacing: "0.1em" }}>
                      {item.tag}
                    </span>
                    <svg className="w-4 h-4 opacity-30 group-hover:opacity-80 transition-opacity" style={{ color: cat.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}

        {/* Emergency banner */}
        <div className="reveal rounded p-6 text-center"
          style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.04)" }}>
          <p style={{ color: "#ef4444", ...bebas, fontSize: "1.5rem", letterSpacing: "0.1em" }}>IN IMMEDIATE DANGER?</p>
          <p style={{ color: "#64748b", ...mono, fontSize: "0.7rem", marginTop: "4px" }}>
            Call <span style={{ color: "#ef4444" }}>100</span> (Police) or{" "}
            <span style={{ color: "#ef4444" }}>1930</span> (Cyber Crime Helpline)
          </p>
        </div>

      </div>
    </div>
  );
}