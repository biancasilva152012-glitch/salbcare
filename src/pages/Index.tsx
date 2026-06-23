// build: 2026-06-15. Warm coastal rewrite. No em-dashes, no buzzwords. Kite live, Pro waitlist.
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";

import SEOHead from "@/components/SEOHead";
import { trackViewContent, trackCtaClick, setupScrolledHalfwayTracking } from "@/hooks/useTracking";
import LanguageSwitcher, { detectInitialLang, type HubLang } from "@/components/shared/LanguageSwitcher";
import { buildWhatsAppUrl, WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import heroGuajiru from "@/assets/hero-guajiru-kite.jpg";

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
    headlineAccent: string;
    subhead: string;
    ctaCare: string;
    ctaClinic: string;
  };
  origin: { eyebrow: string; title: string; body: string; signature: string };
  what: { title: string; line: string; cards: [string, string, string]; cardDescs: [string, string, string] };
  cycle: {
    eyebrow: string;
    title: string;
    body: string;
    demand: { title: string; body: string };
    supply: { title: string; body: string };
  };
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
      eyebrow: "BORN ON THE COAST OF BRAZIL",
      headline: "Healthcare without borders.",
      headlineAccent: "Built for people everywhere.",
      subhead:
        "SalbCare is the infrastructure of care for people in motion. We start where the world travels, and we follow it home.",
      ctaCare: "I need care",
      ctaClinic: "I'm a clinic",
    },
    origin: {
      eyebrow: "OUR STORY",
      title: "It started on a beach in Ceará.",
      body:
        "A dentist watching travelers from all over the world arrive in Ilha do Guajiru, a small kite spot in the Brazilian northeast. Some got hurt. Some got sick. None knew where to go, who to trust, or how to be understood. So we built the thing we wished existed. A small, human network that travels with the patient.",
      signature: "Bianca Albuquerque, dental surgeon with an MBA in business management, in Ceará.",
    },
    what: {
      title: "What is SalbCare",
      line: "We connect travelers who need care with trusted local clinics on the coast.",
      cards: ["Find care", "Your language", "Fair price"],
      cardDescs: [
        "A verified clinic near you, checked by us one by one.",
        "English and Spanish on the line. No translation apps.",
        "See the cost before you book. No surprises later.",
      ],
    },
    cycle: {
      eyebrow: "HOW SALBCARE WORKS",
      title: "Travelers create demand. Clinics become the network.",
      body:
        "SalbCare is one company with two sides. Together they form a cycle. Care follows the patient. Clinics grow with them.",
      demand: {
        title: "SalbCare Kite",
        body: "The traveler side. We help people get cared for in places they don't know, in a language they understand.",
      },
      supply: {
        title: "SalbCare Pro",
        body: "The clinic side. The infrastructure that lets local clinics receive patients from anywhere in the world.",
      },
    },
    kite: {
      eyebrow: "FOR TRAVELERS · SALBCARE KITE",
      title: "Care you can trust, wherever you land.",
      bullets: [
        "English and Spanish",
        "Same-day appointments",
        "Dental, physiotherapy and telehealth",
        "Reserve online, pay the rest at the clinic",
      ],
      trust: "Verified care in Ilha do Guajiru, Ceará.",
      flow: "You reserve online with R$50. Our team confirms your appointment. Right now, our founder, a dentist on the ground, takes care of every patient herself.",
      cta: "Book care →",
    },
    pro: {
      eyebrow: "FOR CLINICS · SALBCARE PRO",
      title: "Reach patients from around the world.",
      intro: "A new market for your clinic. Not another management tool.",
      bullets: [
        "International patients",
        "Multilingual communication",
        "Telehealth",
        "International payments",
        "Grow beyond local demand",
      ],
      label: "Opening next season. Join the waitlist.",
      cta: "Join the clinic waitlist",
    },
    how: {
      title: "How it works",
      subtitle: "The patient journey to your clinic.",
      steps: [
        "The patient chooses what they need.",
        "Books online with SalbCare and pays R$50.",
        "Visits the clinic.",
        "Pays the rest there. No paperwork.",
      ],
    },
    where: {
      title: "Where we are",
      line: "We are in Ilha do Guajiru, Ceará.",
      next: "More of the coast soon. Preá, Jericoacoara, Pipa.",
    },
    trust: {
      title: "Founded and run by a dentist in Guajiru.",
      line: "Real, human, on the ground. No fake testimonials, no stock photos.",
      badges: ["English and Spanish", "International cards welcome", "Verified care"],
    },
    finalCta: {
      headline: "Travel freely. We will take care of your health.",
      ctaCare: "Book care",
      ctaClinic: "Clinic waitlist",
    },
    footerTag: "Care that travels with you.",
  },
  pt: {
    nav: { care: "Preciso de atendimento", clinics: "Sou uma clínica" },
    hero: {
      eyebrow: "NASCEMOS NO LITORAL DO BRASIL",
      headline: "Saúde sem fronteiras.",
      headlineAccent: "Feita para gente em qualquer lugar.",
      subhead:
        "A SalbCare é a infraestrutura de saúde para pessoas em movimento. Começamos onde o mundo viaja, e seguimos junto até em casa.",
      ctaCare: "Preciso de atendimento",
      ctaClinic: "Sou uma clínica",
    },
    origin: {
      eyebrow: "NOSSA HISTÓRIA",
      title: "Começou numa praia no Ceará.",
      body:
        "Uma dentista vendo turistas do mundo todo chegarem na Ilha do Guajiru, um pequeno spot de kite no nordeste do Brasil. Uns se machucavam. Outros ficavam doentes. Ninguém sabia para onde ir, em quem confiar ou como se fazer entender. Então construímos o que faltava. Uma rede pequena, humana, que viaja com o paciente.",
      signature: "Bianca Albuquerque, cirurgiã-dentista com MBA em gestão de negócios, no Ceará.",
    },
    what: {
      title: "O que é a SalbCare",
      line: "A gente conecta viajantes que precisam de cuidado a clínicas locais de confiança no litoral.",
      cards: ["Encontre atendimento", "No seu idioma", "Preço justo"],
      cardDescs: [
        "Uma clínica verificada perto de você, conferida por nós, uma a uma.",
        "Inglês e espanhol no atendimento. Sem tradutor.",
        "Você vê o preço antes de reservar. Sem surpresa depois.",
      ],
    },
    cycle: {
      eyebrow: "COMO A SALBCARE FUNCIONA",
      title: "Viajantes geram demanda. Clínicas viram a rede.",
      body:
        "A SalbCare é uma empresa com dois lados. Juntos formam um ciclo. O cuidado segue o paciente. As clínicas crescem com ele.",
      demand: {
        title: "SalbCare Kite",
        body: "O lado do viajante. Ajudamos pessoas a serem cuidadas em lugares que não conhecem, num idioma que entendem.",
      },
      supply: {
        title: "SalbCare Pro",
        body: "O lado da clínica. A infraestrutura que permite que clínicas locais recebam pacientes do mundo todo.",
      },
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
      flow: "Você reserva online com R$50. Nosso time confirma o horário. Hoje, quem atende é a nossa fundadora, dentista no local.",
      cta: "Reservar atendimento →",
    },
    pro: {
      eyebrow: "PARA CLÍNICAS · SALBCARE PRO",
      title: "Receba pacientes do mundo todo.",
      intro: "Um novo mercado para sua clínica. Não é mais um software de gestão.",
      bullets: [
        "Pacientes internacionais",
        "Comunicação multilíngue",
        "Teleconsulta",
        "Pagamentos internacionais",
        "Crescer além da demanda local",
      ],
      label: "Abrindo na próxima temporada. Entre na lista de espera.",
      cta: "Entrar na lista de espera",
    },
    how: {
      title: "Como funciona",
      subtitle: "A jornada do paciente até a sua clínica.",
      steps: [
        "O paciente escolhe o que precisa.",
        "Reserva online pela SalbCare e paga R$50.",
        "Visita a clínica.",
        "Paga o restante lá. Sem papelada.",
      ],
    },
    where: {
      title: "Onde estamos",
      line: "Estamos na Ilha do Guajiru, Ceará.",
      next: "Mais litoral em breve. Preá, Jericoacoara, Pipa.",
    },
    trust: {
      title: "Fundada e tocada por uma dentista no Guajiru.",
      line: "Real, humano, no chão. Sem depoimento fabricado, sem foto de banco.",
      badges: ["Inglês e Espanhol", "Cartão internacional aceito", "Atendimento verificado"],
    },
    finalCta: {
      headline: "Viaje tranquilo. A gente cuida da sua saúde.",
      ctaCare: "Reservar atendimento",
      ctaClinic: "Lista de espera de clínicas",
    },
    footerTag: "Cuidado que viaja com você.",
  },
  es: {
    nav: { care: "Necesito atención", clinics: "Soy una clínica" },
    hero: {
      eyebrow: "NACIMOS EN LA COSTA DE BRASIL",
      headline: "Salud sin fronteras.",
      headlineAccent: "Hecha para gente en cualquier lugar.",
      subhead:
        "SalbCare es la infraestructura de salud para personas en movimiento. Empezamos donde el mundo viaja y lo seguimos hasta casa.",
      ctaCare: "Necesito atención",
      ctaClinic: "Soy una clínica",
    },
    origin: {
      eyebrow: "NUESTRA HISTORIA",
      title: "Empezó en una playa de Ceará.",
      body:
        "Una dentista viendo a viajeros de todo el mundo llegar a Ilha do Guajiru, un pequeño spot de kite en el noreste de Brasil. Algunos se lastimaban. Otros se enfermaban. Nadie sabía a dónde ir, en quién confiar ni cómo hacerse entender. Así que construimos lo que faltaba. Una red pequeña, humana, que viaja con el paciente.",
      signature: "Bianca Albuquerque, cirujana dentista con MBA en gestión de negocios, en Ceará.",
    },
    what: {
      title: "Qué es SalbCare",
      line: "Conectamos a viajeros que necesitan atención con clínicas locales de confianza en la costa.",
      cards: ["Encuentra atención", "Tu idioma", "Precio justo"],
      cardDescs: [
        "Una clínica verificada cerca de ti, revisada por nosotros, una por una.",
        "Inglés y español al teléfono. Sin traductor.",
        "Ves el precio antes de reservar. Sin sorpresas después.",
      ],
    },
    cycle: {
      eyebrow: "CÓMO FUNCIONA SALBCARE",
      title: "Los viajeros generan demanda. Las clínicas son la red.",
      body:
        "SalbCare es una empresa con dos lados. Juntos forman un ciclo. El cuidado sigue al paciente. Las clínicas crecen con él.",
      demand: {
        title: "SalbCare Kite",
        body: "El lado del viajero. Ayudamos a personas a recibir atención en lugares que no conocen, en un idioma que entienden.",
      },
      supply: {
        title: "SalbCare Pro",
        body: "El lado de la clínica. La infraestructura que permite a clínicas locales recibir pacientes de todo el mundo.",
      },
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
      flow: "Reservas online con R$50. Nuestro equipo confirma tu cita. Hoy, quien atiende es nuestra fundadora, dentista en el lugar.",
      cta: "Reservar atención →",
    },
    pro: {
      eyebrow: "PARA CLÍNICAS · SALBCARE PRO",
      title: "Atiende a pacientes de todo el mundo.",
      intro: "Un nuevo mercado para tu clínica. No otro software de gestión.",
      bullets: [
        "Pacientes internacionales",
        "Comunicación multilingüe",
        "Teleconsulta",
        "Pagos internacionales",
        "Crece más allá de la demanda local",
      ],
      label: "Abre la próxima temporada. Únete a la lista de espera.",
      cta: "Unirme a la lista de espera",
    },
    how: {
      title: "Cómo funciona",
      subtitle: "El recorrido del paciente hasta tu clínica.",
      steps: [
        "El paciente elige lo que necesita.",
        "Reserva online por SalbCare y paga R$50.",
        "Visita la clínica.",
        "Paga el resto allí. Sin papeleo.",
      ],
    },
    where: {
      title: "Dónde estamos",
      line: "Estamos en Ilha do Guajiru, Ceará.",
      next: "Más costa pronto. Preá, Jericoacoara, Pipa.",
    },
    trust: {
      title: "Fundada y llevada por una dentista en Guajiru.",
      line: "Real, humano, sobre el terreno. Sin testimonios falsos, sin fotos de banco.",
      badges: ["Inglés y Español", "Tarjetas internacionales", "Atención verificada"],
    },
    finalCta: {
      headline: "Viaja tranquilo. Nosotros cuidamos de tu salud.",
      ctaCare: "Reservar atención",
      ctaClinic: "Lista de espera de clínicas",
    },
    footerTag: "Atención que viaja contigo.",
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
    url: "https://salbcare.com",
    logo: "https://salbcare.com/pwa-icon-512.png",
    description:
      "Healthcare infrastructure for people in motion. Trusted care for international travelers, starting in Ilha do Guajiru, Ceará.",
  };

  return (
    <>
      <SEOHead
        title="SalbCare | Healthcare Without Borders"
        description="SalbCare connects travelers to trusted dental and health care on Brazil's kite coast in Guajiru, Ceará. Quality care, simple booking. Care, without borders."
        keywords="healthcare brazil, dental care brazil, health tourism brazil, medical tourism brazil, dentist guajiru, dentist ceara, kitesurf guajiru, care without borders, salbcare"
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
            paddingTop: 160,
            paddingBottom: 110,
            position: "relative",
            overflow: "hidden",
            backgroundImage: `linear-gradient(180deg, rgba(11,28,38,0.72) 0%, rgba(11,28,38,0.88) 55%, ${NAVY_BOTTOM} 100%), url(${heroGuajiru})`,
            backgroundSize: "cover",
            backgroundPosition: "center 35%",
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
              <span style={{ display: "block", color: TEAL, fontStyle: "italic", fontWeight: 500 }}>
                {t.hero.headlineAccent}
              </span>
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

        {/* ORIGIN — emotional storytelling */}
        <section className="salb-section" style={{ paddingTop: 24, paddingBottom: 24 }}>
          <div className="salb-container" data-fade style={{ maxWidth: 760 }}>
            <p className="salb-eyebrow">{t.origin.eyebrow}</p>
            <h2
              className="salb-serif"
              style={{ fontSize: "clamp(28px, 4vw, 40px)", color: "#fff", lineHeight: 1.15, margin: "14px 0 22px" }}
            >
              {t.origin.title}
            </h2>
            <p style={{ color: TEXT, fontSize: "clamp(16px, 1.7vw, 18px)", lineHeight: 1.7, margin: "0 0 18px" }}>
              {t.origin.body}
            </p>
            <p style={{ color: GOLD, fontSize: 13.5, fontStyle: "italic", margin: 0 }}>{t.origin.signature}</p>
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

        {/* CYCLE — two sides of one company */}
        <section className="salb-section" style={{ paddingTop: 32 }}>
          <div className="salb-container" data-fade>
            <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
              <p className="salb-eyebrow">{t.cycle.eyebrow}</p>
              <h2
                className="salb-serif"
                style={{ fontSize: "clamp(26px, 3.4vw, 36px)", color: "#fff", lineHeight: 1.15, margin: "14px 0 14px" }}
              >
                {t.cycle.title}
              </h2>
              <p style={{ color: TEXT_MUTED, fontSize: 16, lineHeight: 1.6, margin: 0 }}>{t.cycle.body}</p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
                alignItems: "stretch",
              }}
            >
              <div className="salb-card" style={{ borderColor: "rgba(201,164,92,0.28)" }}>
                <p className="salb-eyebrow" style={{ color: GOLD }}>DEMAND</p>
                <h3 className="salb-serif" style={{ fontSize: 22, color: "#fff", margin: "10px 0 8px" }}>
                  {t.cycle.demand.title}
                </h3>
                <p style={{ color: TEXT_MUTED, fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{t.cycle.demand.body}</p>
              </div>
              <div className="salb-card" style={{ borderColor: "rgba(63,208,189,0.28)" }}>
                <p className="salb-eyebrow" style={{ color: TEAL }}>INFRASTRUCTURE</p>
                <h3 className="salb-serif" style={{ fontSize: 22, color: "#fff", margin: "10px 0 8px" }}>
                  {t.cycle.supply.title}
                </h3>
                <p style={{ color: TEXT_MUTED, fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{t.cycle.supply.body}</p>
              </div>
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
              {t.where.line}
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
                  Care
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  <li><Link to="/kite" className="salb-link">Book care (Kite season)</Link></li>
                </ul>
              </div>

              <div>
                <h3 style={{ color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                  Legal
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
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
