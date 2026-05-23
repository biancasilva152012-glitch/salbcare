import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Brand hub: header + hero + 2 product cards + brand story.
 * Language switcher (PT/EN/ES) updates all content. PT is default.
 */

const DEEP_TEAL = "#0F2A33";
const DEEP_TEAL_DARK = "#081A20";
const DEEP_TEAL_2 = "#1A3F50";
const GOLD = "#C9A961";
const TEAL_ACCENT = "#2ABFBF";
const TEXT_MUTED = "#B0C5CC";
const TEXT_SUBTLE = "#7FA0A8";

type Lang = "pt" | "en" | "es";
const LANG_KEY = "salbcare_lang";

function detectInitialLang(): Lang {
  if (typeof window === "undefined") return "pt";
  try {
    const stored = window.localStorage.getItem(LANG_KEY) as Lang | null;
    if (stored === "pt" || stored === "en" || stored === "es") return stored;
  } catch {}
  const nav = (navigator.language || "pt").toLowerCase();
  if (nav.startsWith("pt")) return "pt";
  if (nav.startsWith("es")) return "es";
  return "en";
}

type Copy = {
  hero: { eyebrow: string; headline: string; subhead: string };
  proCard: {
    eyebrow: string;
    headline: string;
    body: string;
    bullets: string[];
    cta: string;
    secondaryLink: string;
  };
  kiteCard: {
    eyebrow: string;
    headline: string;
    body: string;
    bullets: string[];
    cta: string;
    secondaryLink: string;
  };
  brandStoryEyebrow: string;
  brandStory: string;
};

const t: Record<Lang, Copy> = {
  pt: {
    hero: {
      eyebrow: "BEM-VINDO À SALBCARE",
      headline: "Escolha seu caminho.",
      subhead:
        "Duas plataformas, uma missão: cuidar de quem cuida e de quem viaja.",
    },
    proCard: {
      eyebrow: "PARA PROFISSIONAIS DE SAÚDE",
      headline: "Sua prática, com confiança.",
      body: "A plataforma completa para psicólogos, nutricionistas, médicos e fisioterapeutas autônomos no Brasil.",
      bullets: [
        "Prontuário digital & receitas eletrônicas",
        "Teleconsulta via Google Meet",
        "Mentora Financeira com IA",
        "Sem comissões, nunca",
      ],
      cta: "Conhecer SalbCare Pro →",
      secondaryLink: "Já é cadastrado? Faça login",
    },
    kiteCard: {
      eyebrow: "PARA VIAJANTES INTERNACIONAIS",
      headline: "Sinta-se bem. Pratique kite melhor.",
      body: "Atendimento odontológico de primeira classe, fisioterapia e teleconsulta em Ilha do Guajiru — com cuidado disponível em inglês e espanhol, a uma fração dos preços europeus.",
      bullets: [
        "Atendimento em inglês e espanhol",
        "Cartões internacionais aceitos",
        "Reserve com R$50 de depósito",
        "Pague o restante na clínica",
      ],
      cta: "Conhecer SalbCare Kite →",
      secondaryLink: "Agendar uma visita",
    },
    brandStoryEyebrow: "A MARCA POR TRÁS",
    brandStory:
      "A SalbCare é uma plataforma de saúde construída em torno de uma crença: acesso a um bom cuidado não deveria depender de onde você está, que idioma você fala, ou quanto você ganha.",
  },
  en: {
    hero: {
      eyebrow: "WELCOME TO SALBCARE",
      headline: "Choose your path.",
      subhead:
        "Two platforms, one mission: caring for those who care, and for those who travel.",
    },
    proCard: {
      eyebrow: "FOR HEALTH PROFESSIONALS",
      headline: "Run your practice with confidence",
      body: "The all-in-one platform for autonomous psychologists, nutritionists, physicians and physiotherapists in Brazil.",
      bullets: [
        "Digital records & e-prescriptions",
        "Telehealth via Google Meet",
        "Mentora Financeira AI",
        "No commissions, ever",
      ],
      cta: "Explore SalbCare Pro →",
      secondaryLink: "Login to your account",
    },
    kiteCard: {
      eyebrow: "FOR INTERNATIONAL TRAVELERS",
      headline: "Feel better. Kite better.",
      body: "World-class dental care, physiotherapy, and telehealth in Ilha do Guajiru — with care available in English and Spanish, at a fraction of European prices.",
      bullets: [
        "English & Spanish spoken",
        "International cards accepted",
        "Book with a R$50 deposit",
        "Pay the remaining balance at the clinic",
      ],
      cta: "Explore SalbCare Kite →",
      secondaryLink: "Book a visit",
    },
    brandStoryEyebrow: "THE BRAND BEHIND",
    brandStory:
      "SalbCare is a healthcare platform built around one belief: access to good care shouldn't depend on where you are, what language you speak, or how much you earn.",
  },
  es: {
    hero: {
      eyebrow: "BIENVENIDO A SALBCARE",
      headline: "Elige tu camino.",
      subhead:
        "Dos plataformas, una misión: cuidar de quien cuida y de quien viaja.",
    },
    proCard: {
      eyebrow: "PARA PROFESIONALES DE LA SALUD",
      headline: "Tu práctica, con confianza.",
      body: "La plataforma completa para psicólogos, nutricionistas, médicos y fisioterapeutas autónomos en Brasil.",
      bullets: [
        "Historia clínica digital y recetas electrónicas",
        "Teleconsulta vía Google Meet",
        "Mentora Financiera con IA",
        "Sin comisiones, nunca",
      ],
      cta: "Conocer SalbCare Pro →",
      secondaryLink: "¿Ya tienes cuenta? Inicia sesión",
    },
    kiteCard: {
      eyebrow: "PARA VIAJEROS INTERNACIONALES",
      headline: "Sentite bien. Kiteá mejor.",
      body: "Atención dental de primera clase, fisioterapia y teleconsulta en Ilha do Guajiru — con atención disponible en inglés y español, a una fracción de los precios europeos.",
      bullets: [
        "Atención en inglés y español",
        "Tarjetas internacionales aceptadas",
        "Reservá con un depósito de R$50",
        "Pagá el resto en la clínica",
      ],
      cta: "Conocer SalbCare Kite →",
      secondaryLink: "Agendar una visita",
    },
    brandStoryEyebrow: "LA MARCA DETRÁS",
    brandStory:
      "SalbCare es una plataforma de salud construida en torno a una creencia: el acceso a un buen cuidado no debería depender de dónde estás, qué idioma hablas o cuánto ganas.",
  },
};

const Check = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }}>
    <path d="M5 12l4 4L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ProCard = ({ copy }: { copy: Copy["proCard"] }) => (
  <Link
    to="/pro"
    aria-label={copy.headline}
    className="hub-card hub-card-pro"
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 20,
      background: `linear-gradient(160deg, ${DEEP_TEAL} 0%, ${DEEP_TEAL_2} 100%)`,
      borderRadius: 16,
      padding: 48,
      border: "1px solid rgba(42, 191, 191, 0.15)",
      color: "inherit",
      textDecoration: "none",
    }}
  >
    <div style={{ color: TEAL_ACCENT, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
      {copy.eyebrow}
    </div>
    <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 28, lineHeight: 1.2, margin: 0 }}>
      {copy.headline}
    </h3>
    <p style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 1.5, margin: 0 }}>
      {copy.body}
    </p>
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {copy.bullets.map((item) => (
        <li key={item} style={{ display: "flex", gap: 10, color: "#fff", fontSize: 14, lineHeight: 1.4 }}>
          <Check color={TEAL_ACCENT} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
      <span
        className="hub-cta-pro"
        style={{
          background: TEAL_ACCENT,
          color: DEEP_TEAL,
          borderRadius: 999,
          padding: "14px 24px",
          fontWeight: 700,
          fontSize: 15,
          display: "inline-block",
        }}
      >
        {copy.cta}
      </span>
      <span
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = "/login";
        }}
        style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer" }}
        className="hub-secondary-link"
      >
        {copy.secondaryLink}
      </span>
    </div>
  </Link>
);

const KiteCard = ({ copy }: { copy: Copy["kiteCard"] }) => (
  <Link
    to="/kite"
    aria-label={copy.headline}
    className="hub-card hub-card-kite"
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 20,
      background: `linear-gradient(160deg, ${DEEP_TEAL_DARK} 0%, ${DEEP_TEAL} 100%)`,
      borderRadius: 16,
      padding: 48,
      border: "1px solid rgba(201, 169, 97, 0.2)",
      color: "inherit",
      textDecoration: "none",
    }}
  >
    <div style={{ color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
      {copy.eyebrow}
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
      {copy.headline}
    </h3>
    <p style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 1.5, margin: 0 }}>
      {copy.body}
    </p>
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {copy.bullets.map((item) => (
        <li key={item} style={{ display: "flex", gap: 10, color: "#fff", fontSize: 14, lineHeight: 1.4 }}>
          <Check color={GOLD} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
      <span
        className="hub-cta-kite"
        style={{
          background: GOLD,
          color: DEEP_TEAL,
          borderRadius: 999,
          padding: "14px 24px",
          fontWeight: 700,
          fontSize: 15,
          display: "inline-block",
        }}
      >
        {copy.cta}
      </span>
      <span
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = "/kite?utm_source=hub&utm_medium=cta";
        }}
        style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer" }}
        className="hub-secondary-link"
      >
        {copy.secondaryLink}
      </span>
    </div>
  </Link>
);

const BrandHubLayer = () => {
  const [lang, setLang] = useState<Lang>("pt");
  const [order, setOrder] = useState<"proFirst" | "kiteFirst">("proFirst");
  const [orderInit, setOrderInit] = useState(false);

  useEffect(() => {
    const initial = detectInitialLang();
    setLang(initial);
    if (!orderInit) {
      setOrder(initial === "pt" ? "proFirst" : "kiteFirst");
      setOrderInit(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onPickLang = (l: Lang) => {
    try { window.localStorage.setItem(LANG_KEY, l); } catch {}
    setLang(l);
    // Card order does NOT change on switch; it sticks to initial.
  };

  const copy = t[lang];

  return (
    <div style={{ background: DEEP_TEAL, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        .hub-secondary-link:hover { text-decoration: underline; color: #fff !important; }
        .hub-cta-pro, .hub-cta-kite { transition: filter 150ms ease; }
        .hub-lang-btn { background: transparent; color: rgba(255,255,255,0.7); border: 0; padding: 6px 12px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; border-radius: 999px; font-family: inherit; transition: background 150ms ease, color 150ms ease; }
        .hub-lang-btn[aria-pressed="true"] { background: ${TEAL_ACCENT}; color: ${DEEP_TEAL}; }
        .hub-lang-btn:hover:not([aria-pressed="true"]) { color: #fff; }

        .hub-card {
          cursor: pointer;
          transition: transform 300ms cubic-bezier(0.2, 0, 0, 1),
                      box-shadow 300ms cubic-bezier(0.2, 0, 0, 1),
                      border-color 300ms cubic-bezier(0.2, 0, 0, 1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        @media (hover: hover) and (pointer: fine) {
          .hub-card-pro:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(0,0,0,0.25), 0 4px 8px rgba(42,191,191,0.1);
            border-color: rgba(42,191,191,0.4);
          }
          .hub-card-kite:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(0,0,0,0.25), 0 4px 8px rgba(201,169,97,0.1);
            border-color: rgba(201,169,97,0.4);
          }
          .hub-card-pro:hover .hub-cta-pro,
          .hub-card-kite:hover .hub-cta-kite { filter: brightness(1.08); }
        }
        @media (hover: none) {
          .hub-card:active { transform: scale(0.98); transition: transform 100ms ease; }
        }

        .hub-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .hub-hero-h1 { font-size: 48px; }
        .hub-hero-pad { padding: 80px 24px 56px; }
        @media (max-width: 768px) {
          .hub-cards { grid-template-columns: 1fr; }
          .hub-hero-h1 { font-size: 36px !important; }
          .hub-hero-pad { padding: 56px 20px 40px !important; }
          .hub-card { padding: 32px !important; }
          .hub-cta-pro, .hub-cta-kite { width: 100%; text-align: center; }
        }
      `}</style>

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
            {copy.hero.eyebrow}
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
            {copy.hero.headline}
          </h1>
          <p
            style={{
              marginTop: 20,
              color: TEXT_MUTED,
              fontSize: 16,
              lineHeight: 1.55,
              maxWidth: 600,
              marginInline: "auto",
            }}
          >
            {copy.hero.subhead}
          </p>
        </div>
      </section>

      <section style={{ padding: "0 24px" }}>
        <div className="hub-cards" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 64px" }}>
          {order === "proFirst" ? (
            <>
              <ProCard copy={copy.proCard} />
              <KiteCard copy={copy.kiteCard} />
            </>
          ) : (
            <>
              <KiteCard copy={copy.kiteCard} />
              <ProCard copy={copy.proCard} />
            </>
          )}
        </div>
      </section>

      <section style={{ padding: "64px 24px 80px", textAlign: "center" }}>
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
            {copy.brandStoryEyebrow}
          </div>
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontSize: 22,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {copy.brandStory}
          </p>
        </div>
      </section>
    </div>
  );
};

export default BrandHubLayer;
