import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Brand hub layer prepended to the "/" landing.
 * Adds: top bar with language switcher, brand hero, two product cards
 * (Pro + Kite), and a brand-story strip. Existing Pro content renders below.
 */

const DEEP_TEAL = "#0F2A33";
const DEEP_TEAL_DARK = "#081A20";
const DEEP_TEAL_2 = "#1A3F50";
const BORDER_TEAL = "#2A4A52";
const GOLD = "#C9A961";
const TEAL_ACCENT = "#2ABFBF";
const TEXT_MUTED = "#B0C5CC";
const TEXT_SUBTLE = "#7FA0A8";

type Lang = "pt" | "en" | "es";
const LANG_KEY = "salbcare_lang";

function detectInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(LANG_KEY) as Lang | null;
    if (stored === "pt" || stored === "en" || stored === "es") return stored;
  } catch {}
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("pt")) return "pt";
  if (
    nav.startsWith("en") ||
    nav.startsWith("es") ||
    nav.startsWith("de") ||
    nav.startsWith("fr") ||
    nav.startsWith("it") ||
    nav.startsWith("nl")
  ) {
    return nav.startsWith("es") ? "es" : "en";
  }
  return "en";
}

const Check = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }}>
    <path d="M5 12l4 4L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const scrollToProContent = () => {
  const target = document.getElementById("pro-landing-content");
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
};

const ProCard = () => (
  <article
    style={{
      background: `linear-gradient(160deg, ${DEEP_TEAL} 0%, ${DEEP_TEAL_2} 100%)`,
      borderRadius: 16,
      padding: 48,
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}
  >
    <div style={{ color: TEAL_ACCENT, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
      For health professionals
    </div>
    <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 28, lineHeight: 1.2, margin: 0 }}>
      Run your practice with confidence
    </h3>
    <p style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 1.5, margin: 0 }}>
      The all-in-one platform for autonomous psychologists, nutritionists, physicians and physiotherapists in Brazil.
    </p>
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {[
        "Digital records & e-prescriptions",
        "Telehealth via Google Meet",
        "Mentora Financeira AI",
        "No commissions, ever",
      ].map((item) => (
        <li key={item} style={{ display: "flex", gap: 10, color: "#fff", fontSize: 14, lineHeight: 1.4 }}>
          <Check color={TEAL_ACCENT} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
      <button
        type="button"
        onClick={scrollToProContent}
        className="hub-cta-pro"
        style={{
          background: TEAL_ACCENT,
          color: DEEP_TEAL,
          border: "none",
          borderRadius: 999,
          padding: "14px 24px",
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Explore SalbCare Pro →
      </button>
      <Link to="/login" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }} className="hub-secondary-link">
        Login to your account
      </Link>
    </div>
  </article>
);

const KiteCard = () => (
  <article
    style={{
      background: `linear-gradient(160deg, ${DEEP_TEAL_DARK} 0%, ${DEEP_TEAL} 100%)`,
      borderRadius: 16,
      padding: 48,
      border: "1px solid rgba(201, 169, 97, 0.2)",
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}
  >
    <div style={{ color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
      For international travelers
    </div>
    <h3
      style={{
        color: "#fff",
        fontStyle: "italic",
        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
        fontWeight: 600,
        fontSize: 28,
        lineHeight: 1.2,
        margin: 0,
      }}
    >
      Feel good. Kite better.
    </h3>
    <p style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 1.5, margin: 0 }}>
      World-class dental, physiotherapy and telehealth in Ilha do Guajiru — in English and Spanish, at a fraction of European prices.
    </p>
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {[
        "English & Spanish spoken",
        "International cards accepted",
        "Reserve with R$50",
        "Pay rest at the clinic",
      ].map((item) => (
        <li key={item} style={{ display: "flex", gap: 10, color: "#fff", fontSize: 14, lineHeight: 1.4 }}>
          <Check color={GOLD} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
      <Link
        to="/kite"
        className="hub-cta-kite"
        style={{
          background: GOLD,
          color: DEEP_TEAL,
          borderRadius: 999,
          padding: "14px 24px",
          fontWeight: 700,
          fontSize: 15,
          display: "inline-block",
          textDecoration: "none",
        }}
      >
        Explore SalbCare Kite →
      </Link>
      <Link
        to="/kite?utm_source=hub&utm_medium=cta"
        style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}
        className="hub-secondary-link"
      >
        Book a visit
      </Link>
    </div>
  </article>
);

const BrandHubLayer = () => {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => setLang(detectInitialLang()), []);

  const onPickLang = (l: Lang) => {
    try { window.localStorage.setItem(LANG_KEY, l); } catch {}
    setLang(l);
  };

  const proFirst = lang === "pt";

  return (
    <div
      style={{
        background: DEEP_TEAL,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        .hub-secondary-link:hover { text-decoration: underline; color: #fff !important; }
        .hub-cta-pro:hover { filter: brightness(1.08); }
        .hub-cta-kite:hover { filter: brightness(1.08); }
        .hub-lang-btn { background: transparent; color: rgba(255,255,255,0.7); border: 0; padding: 6px 12px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; border-radius: 999px; font-family: inherit; transition: background 150ms ease, color 150ms ease; }
        .hub-lang-btn[aria-pressed="true"] { background: ${TEAL_ACCENT}; color: ${DEEP_TEAL}; }
        .hub-lang-btn:hover:not([aria-pressed="true"]) { color: #fff; }

        .hub-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .hub-hero-h1 { font-size: 56px; }
        .hub-hero-pad { padding: 96px 24px 64px; }
        @media (max-width: 768px) {
          .hub-cards { grid-template-columns: 1fr; }
          .hub-hero-h1 { font-size: 40px !important; }
          .hub-hero-pad { padding: 64px 20px 48px !important; }
          .hub-card-inner { padding: 32px !important; }
          .hub-cta-pro, .hub-cta-kite { width: 100%; text-align: center; }
        }
      `}</style>

      {/* Top bar with language switcher */}
      <header
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "20px 24px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link to="/" aria-label="SalbCare" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <img src="/pwa-icon-192.png" alt="" width={32} height={32} style={{ borderRadius: 8 }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" }}>SalbCare</span>
        </Link>
        <div
          role="group"
          aria-label="Language"
          style={{
            display: "inline-flex",
            gap: 4,
            padding: 4,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 999,
          }}
        >
          {(["pt", "en", "es"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              className="hub-lang-btn"
              aria-pressed={lang === l}
              onClick={() => onPickLang(l)}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      {/* Hero */}
      <section className="hub-hero-pad" style={{ textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div
            style={{
              color: GOLD,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            Health, made human
          </div>
          <h1
            className="hub-hero-h1"
            style={{
              color: "#fff",
              fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            One mission. Different doors.
          </h1>
          <p
            style={{
              marginTop: 20,
              color: TEXT_SUBTLE,
              fontSize: 16,
              lineHeight: 1.55,
              maxWidth: 600,
              marginInline: "auto",
            }}
          >
            SalbCare builds healthcare experiences for the moments traditional systems fail.
          </p>
        </div>
      </section>

      {/* Product cards */}
      <section style={{ padding: "0 24px" }}>
        <div className="hub-cards" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 0 64px" }}>
          {proFirst ? (
            <>
              <div className="hub-card-inner-wrap"><ProCard /></div>
              <div className="hub-card-inner-wrap"><KiteCard /></div>
            </>
          ) : (
            <>
              <div className="hub-card-inner-wrap"><KiteCard /></div>
              <div className="hub-card-inner-wrap"><ProCard /></div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default BrandHubLayer;
