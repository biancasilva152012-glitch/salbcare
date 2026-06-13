// build: 2026-06-13 — rebrand: "Healthcare for people in motion". Kite (active) + Pro (waitlist).
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";

import SEOHead from "@/components/SEOHead";
import { trackViewContent, trackCtaClick, setupScrolledHalfwayTracking } from "@/hooks/useTracking";
import LanguageSwitcher, { detectInitialLang, type HubLang } from "@/components/shared/LanguageSwitcher";
import { buildWhatsAppUrl, WHATSAPP_DISPLAY } from "@/lib/whatsapp";

// Brand tokens (kept inline so the homepage owns its identity independently of the app shell).
const NAVY_TOP = "#0B1C26";
const NAVY_BOTTOM = "#0E2128";
const NAVY_CARD = "#102932";
const TEAL = "#3FD0BD";
const TEAL_HOVER = "#52DCC9";
const GOLD = "#C9A45C";
const TEXT = "#E9F2F4";
const TEXT_MUTED = "#8FA8B0";
const BORDER = "#1E3A44";

type Copy = {
  nav: { care: string; clinics: string };
  hero: {
    eyebrow: string;
    headline: string;
    subhead: string;
    ctaCare: string;
    ctaClinic: string;
  };
  what: { title: string; line: string; cards: [string, string, string]; cardDescs: [string, string, string] };
  kite: {
    eyebrow: string;
    title: string;
    bullets: string[];
    trust: string;
    flow: string;
    cta: string;
  };
  pro: {
    eyebrow: string;
    title: string;
    intro: string;
    bullets: string[];
    label: string;
    cta: string;
  };
  how: { title: string; subtitle: string; steps: [string, string, string, string] };
  where: { title: string; line: string; next: string };
  trust: { title: string; line: string; badges: [string, string, string] };
  finalCta: { headline: string; ctaCare: string; ctaClinic: string };
  footerTag: string;
};

const COPY: Record<HubLang, Copy> = {
  en: {
    nav: { care: "I need care", clinics: "I'm a clinic" },
    hero: {
      eyebrow: "HEALTHCARE FOR PEOPLE IN MOTION",
      headline: "Healthcare that travels with you.",
      subhead:
        "Trusted care while you travel — in your language, same day. And the platform that powers the clinics behind it.",
      ctaCare: "I need care",
      ctaClinic: "I'm a clinic",
    },
    what: {
      title: "What is SalbCare",
      line: "SalbCare connects travelers who need care with trusted local clinics.",
      cards: ["Verified clinics", "Your language", "Book in minutes"],
      cardDescs: [
        "Real practices, real professionals, checked one by one.",
        "English and Spanish on the line — no translation apps.",
        "Reserve online and visit the clinic the same day.",
      ],
    },
    kite: {
      eyebrow: "FOR TRAVELERS · SALBCARE KITE",
      title: "Care you can trust, wherever you land.",
      bullets: [
        "English & Spanish-speaking",
        "Same-day appointments",
        "Dental, physiotherapy & telehealth",
        "Reserve online, pay the rest at the clinic",
      ],
      trust: "Verified care in Ilha do Guajiru, Ceará.",
      flow: "Reserve online with R$50 — our team confirms your appointment (currently handled directly by our founder, a dentist on the ground).",
      cta: "Find care →",
    },
    pro: {
      eyebrow: "FOR CLINICS · SALBCARE PRO",
      title: "Reach patients from around the world.",
      intro: "A new market for your clinic — not another management tool.",
      bullets: [
        "International patient acquisition",
        "Multilingual communication",
        "Telehealth",
        "International payments",
        "Grow beyond local demand",
      ],
      label: "Coming next season — join the waitlist.",
      cta: "Join the clinic waitlist",
    },
    how: {
      title: "How it works",
      subtitle: "Patient journey to your clinic",
      steps: [
        "The patient chooses the service",
        "Book online via SalbCare (R$50)",
        "Visit the clinic",
        "Pay the rest on arrival",
      ],
    },
    where: {
      title: "Where we are",
      line: "Now: Ilha do Guajiru · Ceará · Brazil.",
      next: "Next: Preá, Jericoacoara, Pipa — coastal stops, one at a time.",
    },
    trust: {
      title: "Founded and operated by a dentist in Ceará.",
      line: "Real, human, on the ground. No fake testimonials, no stock photos.",
      badges: ["English & Spanish", "International cards welcome", "Verified care"],
    },
    finalCta: {
      headline: "Travel freely. We've got your health.",
      ctaCare: "Find care",
      ctaClinic: "Clinic waitlist",
    },
    footerTag: "Healthcare for people in motion.",
  },
  pt: {
    nav: { care: "Preciso de atendimento", clinics: "Sou uma clínica" },
    hero: {
      eyebrow: "SAÚDE PARA QUEM ESTÁ EM MOVIMENTO",
      headline: "Saúde que viaja com você.",
      subhead:
        "Atendimento confiável durante sua viagem — no seu idioma, no mesmo dia. E a plataforma que conecta as clínicas por trás.",
      ctaCare: "Preciso de atendimento",
      ctaClinic: "Sou uma clínica",
    },
    what: {
      title: "O que é a SalbCare",
      line: "A SalbCare conecta viajantes que precisam de cuidados a clínicas locais de confiança.",
      cards: ["Clínicas verificadas", "Seu idioma", "Reserve em minutos"],
      cardDescs: [
        "Profissionais reais, conferidos um a um.",
        "Inglês e espanhol no atendimento — sem tradutor.",
        "Reserva online e visita à clínica no mesmo dia.",
      ],
    },
    kite: {
      eyebrow: "PARA VIAJANTES · SALBCARE KITE",
      title: "Cuidado confiável, onde você pousar.",
      bullets: [
        "Atendimento em inglês e espanhol",
        "Consultas no mesmo dia",
        "Odontologia, fisioterapia e teleconsulta",
        "Reserve online, pague o restante na clínica",
      ],
      trust: "Atendimento verificado na Ilha do Guajiru, Ceará.",
      flow: "Reserve online com R$50 — nosso time confirma sua consulta (hoje, atendida diretamente pela nossa fundadora, dentista no local).",
      cta: "Encontrar atendimento →",
    },
    pro: {
      eyebrow: "PARA CLÍNICAS · SALBCARE PRO",
      title: "Receba pacientes do mundo todo.",
      intro: "Um novo mercado para sua clínica — não mais um software de gestão.",
      bullets: [
        "Aquisição de pacientes internacionais",
        "Comunicação multilíngue",
        "Teleconsulta",
        "Pagamentos internacionais",
        "Crescer além da demanda local",
      ],
      label: "Em breve, na próxima temporada — entre na lista de espera.",
      cta: "Entrar na lista de espera",
    },
    how: {
      title: "Como funciona",
      subtitle: "A jornada do paciente até sua clínica",
      steps: [
        "O paciente escolhe o serviço",
        "Reserva online pela SalbCare (R$50)",
        "Visite a clínica",
        "Pague o restante ao chegar",
      ],
    },
    where: {
      title: "Onde estamos",
      line: "Agora: Ilha do Guajiru · Ceará · Brasil.",
      next: "Próximos: Preá, Jericoacoara, Pipa — destinos litorâneos, um por vez.",
    },
    trust: {
      title: "Fundada e operada por uma dentista no Ceará.",
      line: "Real, humano, no chão. Sem depoimentos fabricados, sem foto de banco.",
      badges: ["Inglês & Espanhol", "Cartão internacional aceito", "Atendimento verificado"],
    },
    finalCta: {
      headline: "Viaje tranquilo. Cuidamos da sua saúde.",
      ctaCare: "Encontrar atendimento",
      ctaClinic: "Lista de espera de clínicas",
    },
    footerTag: "Saúde para quem está em movimento.",
  },
  es: {
    nav: { care: "Necesito atención", clinics: "Soy una clínica" },
    hero: {
      eyebrow: "SALUD PARA QUIENES ESTÁN EN MOVIMIENTO",
      headline: "Salud que viaja contigo.",
      subhead:
        "Atención confiable mientras viajas — en tu idioma, el mismo día. Y la plataforma que conecta a las clínicas detrás.",
      ctaCare: "Necesito atención",
      ctaClinic: "Soy una clínica",
    },
    what: {
      title: "Qué es SalbCare",
      line: "SalbCare conecta a viajeros que necesitan atención con clínicas locales de confianza.",
      cards: ["Clínicas verificadas", "Tu idioma", "Reserva en minutos"],
      cardDescs: [
        "Profesionales reales, revisados uno por uno.",
        "Inglés y español al teléfono — sin traductor.",
        "Reserva online y visita la clínica el mismo día.",
      ],
    },
    kite: {
      eyebrow: "PARA VIAJEROS · SALBCARE KITE",
      title: "Atención de confianza, donde aterrices.",
      bullets: [
        "Atención en inglés y español",
        "Citas el mismo día",
        "Odontología, fisioterapia y teleconsulta",
        "Reserva online, paga el resto en la clínica",
      ],
      trust: "Atención verificada en Ilha do Guajiru, Ceará.",
      flow: "Reserva online con R$50 — nuestro equipo confirma tu cita (hoy, atendida directamente por nuestra fundadora, dentista en el lugar).",
      cta: "Encontrar atención →",
    },
    pro: {
      eyebrow: "PARA CLÍNICAS · SALBCARE PRO",
      title: "Atiende a pacientes de todo el mundo.",
      intro: "Un nuevo mercado para tu clínica — no otro software de gestión.",
      bullets: [
        "Captación de pacientes internacionales",
        "Comunicación multilingüe",
        "Teleconsulta",
        "Pagos internacionales",
        "Crece más allá de la demanda local",
      ],
      label: "Pronto, en la próxima temporada — únete a la lista de espera.",
      cta: "Unirme a la lista de espera",
    },
    how: {
      title: "Cómo funciona",
      subtitle: "El recorrido del paciente hasta su clínica",
      steps: [
        "El paciente elige el servicio",
        "Reserva online por SalbCare (R$50)",
        "Visita la clínica",
        "Paga el resto al llegar",
      ],
    },
    where: {
      title: "Dónde estamos",
      line: "Ahora: Ilha do Guajiru · Ceará · Brasil.",
      next: "Próximos: Preá, Jericoacoara, Pipa — destinos costeros, uno a uno.",
    },
    trust: {
      title: "Fundada y operada por una dentista en Ceará.",
      line: "Real, humano, sobre el terreno. Sin testimonios falsos, sin fotos de banco.",
      badges: ["Inglés & Español", "Tarjetas internacionales", "Atención verificada"],
    },
    finalCta: {
      headline: "Viaja tranquilo. Cuidamos tu salud.",
      ctaCare: "Encontrar atención",
      ctaClinic: "Lista de espera de clínicas",
    },
    footerTag: "Salud para quienes están en movimento.",
  },
};

const waitlistHref = `mailto:biancadealbuquerquep@gmail.com?subject=SalbCare%20Pro%20%E2%80%94%20Clinic%20Waitlist`;

const Index = () => {
  const [lang, setLang] = useState<HubLang>("en");
  useEffect(() => setLang(detectInitialLang()), []);
  const t = useMemo(() => COPY[lang], [lang]);

  useEffect(() => {
    trackViewContent("SalbCare Landing — Healthcare in motion", "Homepage");
    const cleanup = setupScrolledHalfwayTracking();
    return cleanup;
  }, []);

  // Subtle fade-in on scroll using IntersectionObserver — no extra deps.
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const els = document.querySelectorAll<HTMLElement>("[data-fade]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("salb-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [t]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SalbCare",
    url: "https://salbcare.com.br",
    logo: "https://salbcare.com.br/pwa-icon-512.png",
    description:
      "Healthcare infrastructure for people in motion. Trusted care for international travelers, starting in Ilha do Guajiru, Ceará.",
  };

  return (
    <>
      <SEOHead
        title="SalbCare — Healthcare that travels with you"
        description="Trusted healthcare for international travelers in Ilha do Guajiru, Ceará — in your language, same day. And the platform powering the clinics behind it."
        canonical="/"
        jsonLd={jsonLd}
      />
      <Helmet>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <style>{`
        .salb-root {
          font-family: 'Hanken Grotesk', system-ui, -apple-system, sans-serif;
          color: ${TEXT};
          background: linear-gradient(180deg, ${NAVY_TOP} 0%, ${NAVY_BOTTOM} 100%);
          min-height: 100vh;
        }
        .salb-serif { font-family: 'Playfair Display', Georgia, serif; font-weight: 600; letter-spacing: -0.01em; }
        .salb-eyebrow {
          font-size: 12px; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: ${GOLD};
        }
        .salb-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 14px 22px; border-radius: 999px; font-weight: 600; font-size: 15px;
          text-decoration: none; transition: all 180ms ease;
          min-height: 48px;
        }
        .salb-btn-primary { background: ${TEAL}; color: #062023; }
        .salb-btn-primary:hover { background: ${TEAL_HOVER}; transform: translateY(-1px); box-shadow: 0 12px 32px -12px ${TEAL}; }
        .salb-btn-ghost { background: transparent; color: ${TEXT}; border: 1px solid ${BORDER}; }
        .salb-btn-ghost:hover { border-color: ${TEAL}; color: ${TEAL}; }
        .salb-card {
          background: ${NAVY_CARD}; border: 1px solid ${BORDER}; border-radius: 20px;
          padding: 28px; box-shadow: 0 24px 60px -40px rgba(0,0,0,0.6);
        }
        .salb-link { color: ${TEXT_MUTED}; text-decoration: none; transition: color 150ms; font-size: 14px; }
        .salb-link:hover { color: #fff; }
        .salb-section { padding: 80px 24px; }
        .salb-container { max-width: 1120px; margin: 0 auto; }
        [data-fade] { opacity: 0; transform: translateY(12px); transition: opacity 700ms ease, transform 700ms ease; }
        .salb-in { opacity: 1; transform: translateY(0); }
        @media (max-width: 720px) {
          .salb-section { padding: 56px 20px; }
        }
      `}</style>

      <div className="salb-root">
        {/* Header */}
        <header style={{ position: "absolute", inset: "0 0 auto 0", zIndex: 10 }}>
          <div
            className="salb-container"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px" }}
          >
            <Link to="/" aria-label="SalbCare" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <img src="/pwa-icon-192.png" alt="" width={32} height={32} style={{ borderRadius: 8 }} />
              <span style={{ fontWeight: 700, fontSize: 17, color: "#fff", letterSpacing: "-0.01em" }}>SalbCare</span>
            </Link>
            <LanguageSwitcher value={lang} onChange={setLang} />
          </div>
        </header>

        {/* HERO */}
        <section
          className="salb-section"
          style={{
            paddingTop: 140,
            paddingBottom: 96,
            position: "relative",
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(63,208,189,0.10) 0%, transparent 60%)",
          }}
        >
          <div className="salb-container" style={{ textAlign: "center", maxWidth: 820 }}>
            <p className="salb-eyebrow" data-fade>{t.hero.eyebrow}</p>
            <h1
              className="salb-serif"
              data-fade
              style={{ fontSize: "clamp(36px, 6vw, 64px)", lineHeight: 1.05, margin: "20px 0 18px", color: "#fff" }}
            >
              {t.hero.headline}
            </h1>
            <p
              data-fade
              style={{ fontSize: "clamp(16px, 1.8vw, 19px)", color: TEXT_MUTED, lineHeight: 1.55, maxWidth: 640, margin: "0 auto" }}
            >
              {t.hero.subhead}
            </p>
            <div
              data-fade
              style={{ marginTop: 36, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}
            >
              <Link
                to="/kite"
                className="salb-btn salb-btn-primary"
                onClick={() => trackCtaClick("home_hero_kite", "homepage", { lang })}
              >
                {t.hero.ctaCare}
              </Link>
              <a
                href="#clinics"
                className="salb-btn salb-btn-ghost"
                onClick={() => trackCtaClick("home_hero_pro", "homepage", { lang })}
              >
                {t.hero.ctaClinic}
              </a>
            </div>
          </div>
        </section>

        {/* WHAT */}
        <section className="salb-section" style={{ paddingTop: 24 }}>
          <div className="salb-container" style={{ textAlign: "center" }}>
            <p
              data-fade
              className="salb-serif"
              style={{ fontSize: "clamp(22px, 2.6vw, 28px)", color: "#fff", maxWidth: 720, margin: "0 auto 40px" }}
            >
              {t.what.line}
            </p>
            <div
              data-fade
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
                marginTop: 24,
                textAlign: "left",
              }}
            >
              {t.what.cards.map((c, i) => (
                <div key={c} className="salb-card">
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: 10, background: "rgba(63,208,189,0.12)",
                      color: TEAL, display: "grid", placeItems: "center", marginBottom: 14, fontWeight: 700,
                    }}
                    aria-hidden
                  >
                    {["✓", "♥", "→"][i]}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>{c}</h3>
                  <p style={{ fontSize: 14.5, color: TEXT_MUTED, margin: 0, lineHeight: 1.55 }}>
                    {t.what.cardDescs[i]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KITE — active layer */}
        <section className="salb-section" id="travelers">
          <div className="salb-container" data-fade>
            <div
              className="salb-card"
              style={{
                padding: "40px clamp(24px, 4vw, 56px)",
                background:
                  `linear-gradient(155deg, ${NAVY_CARD} 0%, ${NAVY_BOTTOM} 100%), radial-gradient(circle at 90% 0%, rgba(201,164,92,0.15), transparent 55%)`,
                backgroundBlendMode: "screen",
                borderColor: "rgba(201,164,92,0.25)",
              }}
            >
              <p className="salb-eyebrow">{t.kite.eyebrow}</p>
              <h2
                className="salb-serif"
                style={{ fontSize: "clamp(28px, 4vw, 40px)", color: "#fff", lineHeight: 1.1, margin: "14px 0 18px" }}
              >
                {t.kite.title}
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "grid", gap: 10 }}>
                {t.kite.bullets.map((b) => (
                  <li key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", color: TEXT, fontSize: 15.5 }}>
                    <span style={{ color: TEAL, fontWeight: 700, marginTop: 1 }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <p style={{ color: TEXT_MUTED, fontSize: 14.5, margin: "0 0 8px" }}>{t.kite.trust}</p>
              <p style={{ color: TEXT_MUTED, fontSize: 13.5, margin: "0 0 24px", lineHeight: 1.55 }}>{t.kite.flow}</p>
              <Link
                to="/kite"
                className="salb-btn salb-btn-primary"
                onClick={() => trackCtaClick("home_kite_section", "homepage", { lang })}
              >
                {t.kite.cta}
              </Link>
            </div>
          </div>
        </section>

        {/* PRO — waitlist */}
        <section className="salb-section" id="clinics">
          <div className="salb-container" data-fade>
            <div
              className="salb-card"
              style={{
                padding: "40px clamp(24px, 4vw, 56px)",
                background:
                  `linear-gradient(155deg, ${NAVY_BOTTOM} 0%, ${NAVY_CARD} 100%), radial-gradient(circle at 90% 0%, rgba(63,208,189,0.14), transparent 55%)`,
                backgroundBlendMode: "screen",
                borderColor: "rgba(63,208,189,0.22)",
              }}
            >
              <p className="salb-eyebrow" style={{ color: TEAL }}>{t.pro.eyebrow}</p>
              <h2
                className="salb-serif"
                style={{ fontSize: "clamp(28px, 4vw, 40px)", color: "#fff", lineHeight: 1.1, margin: "14px 0 12px" }}
              >
                {t.pro.title}
              </h2>
              <p style={{ color: TEXT_MUTED, fontSize: 16, margin: "0 0 20px", lineHeight: 1.55 }}>{t.pro.intro}</p>
              <ul
                style={{
                  listStyle: "none", padding: 0, margin: "0 0 22px",
                  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10,
                }}
              >
                {t.pro.bullets.map((b) => (
                  <li key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", color: TEXT, fontSize: 15 }}>
                    <span style={{ color: TEAL, fontWeight: 700, marginTop: 1 }}>·</span>
                    {b}
                  </li>
                ))}
              </ul>
              <p
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "rgba(201,164,92,0.12)",
                  color: GOLD,
                  fontSize: 12.5,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  margin: "0 0 22px",
                }}
              >
                {t.pro.label}
              </p>
              <div>
                <a
                  href={waitlistHref}
                  className="salb-btn salb-btn-ghost"
                  onClick={() => trackCtaClick("home_pro_waitlist", "homepage", { lang })}
                >
                  {t.pro.cta}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="salb-section">
          <div className="salb-container" data-fade>
            <h2
              className="salb-serif"
              style={{ fontSize: "clamp(24px, 3vw, 32px)", color: "#fff", textAlign: "center", margin: "0 0 8px" }}
            >
              {t.how.title}
            </h2>
            <p
              style={{ color: TEXT_MUTED, fontSize: 15, textAlign: "center", margin: "0 0 32px" }}
            >
              {t.how.subtitle}
            </p>
            <ol
              style={{
                listStyle: "none", padding: 0, margin: 0,
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16,
              }}
            >
              {t.how.steps.map((s, i) => (
                <li key={s} className="salb-card" style={{ padding: 24 }}>
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "rgba(63,208,189,0.12)", color: TEAL,
                      display: "grid", placeItems: "center", fontWeight: 700, marginBottom: 14,
                    }}
                  >
                    {i + 1}
                  </div>
                  <p style={{ color: "#fff", fontSize: 15.5, margin: 0, lineHeight: 1.45 }}>{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* WHERE */}
        <section className="salb-section">
          <div className="salb-container" data-fade style={{ textAlign: "center", maxWidth: 640 }}>
            <p className="salb-eyebrow">{t.where.title}</p>
            <p
              className="salb-serif"
              style={{ fontSize: "clamp(22px, 2.6vw, 28px)", color: "#fff", margin: "14px 0 10px" }}
            >
              📍 {t.where.line}
            </p>
            <p style={{ color: TEXT_MUTED, fontSize: 15, margin: 0 }}>{t.where.next}</p>
          </div>
        </section>

        {/* TRUST */}
        <section className="salb-section">
          <div className="salb-container" data-fade style={{ textAlign: "center", maxWidth: 720 }}>
            <p
              className="salb-serif"
              style={{ fontSize: "clamp(22px, 2.6vw, 28px)", color: "#fff", margin: "0 0 10px" }}
            >
              {t.trust.title}
            </p>
            <p style={{ color: TEXT_MUTED, fontSize: 15, margin: "0 0 24px" }}>{t.trust.line}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {t.trust.badges.map((b) => (
                <span
                  key={b}
                  style={{
                    padding: "8px 14px", borderRadius: 999, border: `1px solid ${BORDER}`,
                    color: TEXT, fontSize: 13, background: NAVY_CARD,
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="salb-section" style={{ paddingTop: 40, paddingBottom: 96 }}>
          <div className="salb-container" data-fade style={{ textAlign: "center" }}>
            <h2
              className="salb-serif"
              style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "#fff", lineHeight: 1.1, margin: "0 0 28px" }}
            >
              {t.finalCta.headline}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              <Link
                to="/kite"
                className="salb-btn salb-btn-primary"
                onClick={() => trackCtaClick("home_final_kite", "homepage", { lang })}
              >
                {t.finalCta.ctaCare}
              </Link>
              <a
                href={waitlistHref}
                className="salb-btn salb-btn-ghost"
                onClick={() => trackCtaClick("home_final_pro", "homepage", { lang })}
              >
                {t.finalCta.ctaClinic}
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            borderTop: `1px solid ${BORDER}`,
            padding: "48px 24px 32px",
            background: NAVY_BOTTOM,
          }}
        >
          <div className="salb-container">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 32, marginBottom: 32,
              }}
            >
              <div>
                <Link to="/" aria-label="SalbCare" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <img src="/pwa-icon-192.png" alt="" width={28} height={28} style={{ borderRadius: 8 }} />
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>SalbCare</span>
                </Link>
                <p style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>{t.footerTag}</p>
              </div>

              <div>
                <h3 style={{ color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                  Products
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li><Link to="/kite" className="salb-link">SalbCare Kite</Link></li>
                  <li><a href={waitlistHref} className="salb-link">SalbCare Pro (waitlist)</a></li>
                </ul>
              </div>

              <div>
                <h3 style={{ color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                  Company
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li><Link to="/about" className="salb-link">About</Link></li>
                  <li><Link to="/contact" className="salb-link">Contact</Link></li>
                  <li><Link to="/journal" className="salb-link">Journal</Link></li>
                  <li><Link to="/terms" className="salb-link">Terms</Link></li>
                  <li><Link to="/privacy" className="salb-link">Privacy</Link></li>
                </ul>
              </div>

              <div>
                <h3 style={{ color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                  Connect
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li><a href="https://instagram.com/salbcare" target="_blank" rel="noopener noreferrer" className="salb-link">Instagram ↗</a></li>
                  <li><a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="salb-link">WhatsApp {WHATSAPP_DISPLAY} ↗</a></li>
                  <li><a href="mailto:biancadealbuquerquep@gmail.com" className="salb-link">Email ↗</a></li>
                </ul>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 20, color: TEXT_MUTED, fontSize: 12, textAlign: "center" }}>
              © {new Date().getFullYear()} SalbCare. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
