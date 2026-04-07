import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useScrollReveal } from "../styles/cyber.jsx";

export default function Laws() {
  useScrollReveal();
  const { isDark } = useOutletContext();
  const [activeIndex, setActiveIndex] = useState(null);

  const mono  = { fontFamily: "'DM Mono', monospace" };
  const raj   = { fontFamily: "'Rajdhani', sans-serif" };
  const bebas = { fontFamily: "'Bebas Neue', sans-serif" };

  // ── Adaptive text colours ─────────────────────────────────────────────────
  const textBody    = isDark ? "#64748b" : "#1e293b";   // body / description text
  const textCard    = isDark ? "#94a3b8" : "#0f172a";   // law name in card
  const textWarning = isDark ? "#64748b" : "#334155";   // disclaimer text
  const textFooter  = isDark ? "#1e293b" : "#334155";   // footer note
  const textSubtitle= isDark ? "#334155" : "#475569";   // page subtitle

  const laws = [
    {
      country: "INDIA",
      flag: "🇮🇳",
      color: "#f59e0b",
      laws: [
        {
          code: "IT ACT § 66A",
          name: "Information Technology Act — Section 66A",
          status: "STRUCK DOWN 2015",
          statusColor: "#ef4444",
          desc: "Originally penalized sending offensive messages electronically. Struck down by Supreme Court in Shreya Singhal v. Union of India for violating freedom of speech.",
          penalty: "Up to 3 years imprisonment",
          link: "https://www.meity.gov.in/",
        },
        {
          code: "IT ACT § 66C/D",
          name: "Identity Theft & Cheating by Personation",
          status: "ACTIVE",
          statusColor: "#10b981",
          desc: "Covers online impersonation, identity theft, and phishing. Directly applicable to cyberbullying via fake profiles.",
          penalty: "Up to 3 years + ₹1 lakh fine",
          link: "https://www.meity.gov.in/",
        },
        {
          code: "IPC § 499–500",
          name: "Defamation",
          status: "ACTIVE",
          statusColor: "#10b981",
          desc: "Criminal defamation applies to online posts, messages, and content that harms someone's reputation.",
          penalty: "Up to 2 years imprisonment",
          link: "https://legislative.gov.in/",
        },
        {
          code: "IPC § 507",
          name: "Criminal Intimidation by Anonymous Communication",
          status: "ACTIVE",
          statusColor: "#10b981",
          desc: "Covers anonymous threats and harassment online — including from fake accounts.",
          penalty: "Up to 2 years imprisonment",
          link: "https://legislative.gov.in/",
        },
        {
          code: "POCSO ACT",
          name: "Protection of Children from Sexual Offences",
          status: "ACTIVE",
          statusColor: "#10b981",
          desc: "Covers online sexual abuse, grooming, and harassment of children. Mandatory reporting required.",
          penalty: "Minimum 3–5 years",
          link: "https://wcd.nic.in/pocso-act",
        },
      ]
    },
    {
      country: "UNITED KINGDOM",
      flag: "🇬🇧",
      color: "#3b82f6",
      laws: [
        {
          code: "MCA 1988",
          name: "Malicious Communications Act",
          status: "ACTIVE",
          statusColor: "#10b981",
          desc: "Criminalizes sending electronic messages intended to cause distress or anxiety. Applies to texts, emails, DMs, and social media.",
          penalty: "Up to 2 years imprisonment",
          link: "https://www.legislation.gov.uk/",
        },
        {
          code: "PHA 1997",
          name: "Protection from Harassment Act",
          status: "ACTIVE",
          statusColor: "#10b981",
          desc: "Prohibits courses of conduct amounting to harassment. Courts have applied this to sustained online harassment campaigns.",
          penalty: "Up to 5 years imprisonment",
          link: "https://www.legislation.gov.uk/",
        },
        {
          code: "OSA 2023",
          name: "Online Safety Act",
          status: "RECENT",
          statusColor: "#8b5cf6",
          desc: "Landmark 2023 legislation requiring platforms to proactively protect users from illegal content and cyberbullying.",
          penalty: "Platform fines up to £18M or 10% global revenue",
          link: "https://www.legislation.gov.uk/",
        },
      ]
    },
    {
      country: "UNITED STATES",
      flag: "🇺🇸",
      color: "#ef4444",
      laws: [
        {
          code: "STATE LAWS",
          name: "Cyberbullying Laws — All 50 States",
          status: "ACTIVE",
          statusColor: "#10b981",
          desc: "All 50 US states have school cyberbullying laws. 48 states have specific criminal cyberbullying or cyberstalking statutes.",
          penalty: "Varies by state",
          link: "https://www.stopbullying.gov/resources/laws",
        },
        {
          code: "18 U.S.C. § 2261A",
          name: "Interstate Stalking / Cyberstalking",
          status: "ACTIVE",
          statusColor: "#10b981",
          desc: "Federal law criminalizing use of electronic communications to stalk, harass, or intimidate. Applies when conduct crosses state lines.",
          penalty: "Up to 5 years federal prison",
          link: "https://www.law.cornell.edu/uscode/text/18/2261A",
        },
        {
          code: "COPPA",
          name: "Children's Online Privacy Protection Act",
          status: "ACTIVE",
          statusColor: "#10b981",
          desc: "Requires parental consent for collecting data from children under 13. Protects minors from exploitation online.",
          penalty: "Civil penalties up to $50,120 per violation",
          link: "https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa",
        },
      ]
    },
    {
      country: "AUSTRALIA",
      flag: "🇦🇺",
      color: "#10b981",
      laws: [
        {
          code: "OSA 2021",
          name: "Online Safety Act",
          status: "ACTIVE",
          statusColor: "#10b981",
          desc: "Requires platforms to remove cyberbullying material targeting Australian children within 24 hours. eSafety Commissioner enforces.",
          penalty: "Up to AUD $555,000 for platforms",
          link: "https://www.esafety.gov.au/",
        },
        {
          code: "CRIMINAL CODE § 474.17",
          name: "Using a Carriage Service to Menace/Harass",
          status: "ACTIVE",
          statusColor: "#10b981",
          desc: "Federal law covering online menace, harassment, and offence using telecommunications services.",
          penalty: "Up to 3 years imprisonment",
          link: "https://www.legislation.gov.au/",
        },
      ]
    },
  ];

  return (
    <div className="relative min-h-screen" style={{ ...mono }}>
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="reveal text-center mb-16">
          <p style={{ color: "#06b6d4", fontSize: "0.7rem", letterSpacing: "0.15em", ...mono, marginBottom: "8px" }}>
            // LEGAL DATABASE
          </p>
          <h1 style={{ ...bebas, fontSize: "clamp(3rem,8vw,6rem)", color: "#64748b", letterSpacing: "0.05em", lineHeight: 1 }}>
            CYBER<span style={{ color: "#06b6d4" }}>LAWS</span>
          </h1>
          <p style={{ color: textSubtitle, fontSize: "0.75rem", marginTop: "8px", ...mono }}>
            International legislation on cyberbullying, online harassment, and digital safety
          </p>
        </div>

        {/* Disclaimer */}
        <div className="reveal mb-12 px-5 py-4 rounded flex items-start gap-4"
          style={{ border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.03)" }}>
          <span style={{ color: "#f59e0b", fontSize: "0.9rem" }}>⚠</span>
          <p style={{ color: textWarning, ...mono, fontSize: "0.65rem", lineHeight: 1.8 }}>
            This information is provided for educational purposes only and does not constitute legal advice.
            Laws change frequently — consult a qualified legal professional for advice specific to your situation.
          </p>
        </div>

        {/* Countries */}
        {laws.map((country, ci) => (
          <div key={ci} className="mb-14">

            {/* Country header */}
            <div className={`reveal delay-${(ci % 3) + 1} flex items-center gap-4 mb-5`}>
              <span style={{ fontSize: "1.5rem" }}>{country.flag}</span>
              <div className="flex-1">
                <h2 style={{ ...bebas, fontSize: "2rem", color: country.color, letterSpacing: "0.1em", lineHeight: 1 }}>
                  {country.country}
                </h2>
              </div>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${country.color}55, transparent)` }} />
            </div>

            {/* Laws accordion */}
            <div className="space-y-2">
              {country.laws.map((law, li) => {
                const key = `${ci}-${li}`;
                const isOpen = activeIndex === key;
                return (
                  <div key={li} className={`reveal delay-${li + 1} rounded overflow-hidden transition-all duration-300`}
                    style={{ border: `1px solid ${isOpen ? country.color + "44" : country.color + "18"}`, background: isOpen ? `${country.color}05` : `${country.color}02` }}>

                    {/* Row */}
                    <button
                      onClick={() => setActiveIndex(isOpen ? null : key)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left transition-all duration-200"
                      onMouseEnter={(e) => { if (!isOpen) e.currentTarget.parentElement.style.background = `${country.color}05`; }}
                      onMouseLeave={(e) => { if (!isOpen) e.currentTarget.parentElement.style.background = `${country.color}02`; }}
                    >
                      <div className="flex items-center gap-4">
                        <span className="px-2 py-0.5 rounded"
                          style={{ border: `1px solid ${country.color}44`, color: country.color, background: `${country.color}11`, ...mono, fontSize: "0.6rem", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>
                          {law.code}
                        </span>
                        <span style={{ color: textCard, ...raj, fontWeight: 600, fontSize: "0.85rem", letterSpacing: "0.03em" }}>
                          {law.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="px-2 py-0.5 rounded text-xs"
                          style={{ border: `1px solid ${law.statusColor}44`, color: law.statusColor, background: `${law.statusColor}11`, ...mono, fontSize: "0.55rem", letterSpacing: "0.1em" }}>
                          {law.status}
                        </span>
                        <span style={{ color: country.color, fontSize: "0.7rem", transition: "transform 0.3s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isOpen && (
                      <div className="px-5 pb-5 space-y-3"
                        style={{ borderTop: `1px solid ${country.color}15` }}>
                        <div className="pt-4">
                          <p style={{ color: textBody, ...mono, fontSize: "0.72rem", lineHeight: 1.8 }}>{law.desc}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span style={{ color: isDark ? "#334155" : "#475569", ...mono, fontSize: "0.6rem", letterSpacing: "0.1em" }}>PENALTY:</span>
                            <span style={{ color: "#ef4444", ...mono, fontSize: "0.65rem", fontWeight: 600 }}>{law.penalty}</span>
                          </div>
                          <a href={law.link} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
                            style={{ color: country.color, ...mono, fontSize: "0.65rem", letterSpacing: "0.1em", textDecoration: "none" }}>
                            VIEW SOURCE
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Footer note */}
        <div className="reveal rounded p-5 text-center"
          style={{ border: "1px solid rgba(6,182,212,0.1)", background: "rgba(6,182,212,0.02)" }}>
          <p style={{ color: textFooter, ...mono, fontSize: "0.65rem", lineHeight: 1.8 }}>
            // Laws updated as of 2024. For the most current information, always verify with official government sources.
          </p>
        </div>

      </div>
    </div>
  );
}