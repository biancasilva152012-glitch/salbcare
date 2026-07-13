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
  trust: { title: string; line: string; badges: [string, string, string, string] };
  finalCta: { headline: string; ctaCare: string; ctaClinic: string };
  footerTag: string;
};

const COPY: Record<HubLang, Copy> = {
  en: {
    nav: { care: "Find a professional", clinics: "I'm a healthcare professional" },
    hero: {
      eyebrow: "HEALTHCARE MARKETPLACE",
      headline: "Care that connects.",
      headlineAccent: "Caring for those who care and those who need care.",
      subhead:
        "SalbCare is a digital ecosystem that connects patients to trusted healthcare professionals. Simple to find care. Powerful to grow a practice.",
      ctaCare: "Find a professional",
      ctaClinic: "I'm a healthcare professional",
    },
    origin: {
      eyebrow: "THE PROBLEM WE SOLVE",
      title: "Finding the right care should not feel like guesswork.",
      body:
        "Patients spend hours searching for someone they can trust, in a language they understand, at a price they can plan for. Healthcare professionals spend even more hours trying to be found, to manage schedules, and to grow a real practice. SalbCare removes that friction. One ecosystem, two sides, one shared goal: care that actually reaches the person who needs it.",
      signature: "Founded by Bianca Albuquerque, dental surgeon with an MBA in business management.",
    },
    what: {
      title: "How SalbCare works",
      line: "One platform. Two sides. A cycle of care that scales.",
      cards: ["Verified professionals", "Guided by our team", "Built to scale"],
      cardDescs: [
        "Every professional is reviewed by our curation team before appearing on the marketplace.",
        "A real human helps patients choose, book, and follow up. No cold interfaces, no dead ends.",
        "Multi-specialty, multi-region, multi-language. Ready for wherever care needs to reach next.",
      ],
    },
    cycle: {
      eyebrow: "THE ECOSYSTEM",
      title: "Two sides. One brand. A network that compounds.",
      body:
        "SalbCare is one marketplace with two entry points. Patients find care they can trust. Professionals gain visibility, patients and tools to run a modern practice. Every appointment strengthens both sides.",
      demand: {
        title: "For patients · SalbCare Kite",
        body: "The patient entry point. Find, book and stay with a verified professional, in your language, wherever you are.",
      },
      supply: {
        title: "For professionals · SalbCare Pro",
        body: "The professional entry point. A curated showcase, a growing patient base, and the tools to manage and expand your practice.",
      },
    },
    kite: {
      eyebrow: "FOR PATIENTS · SALBCARE KITE",
      title: "Care you can trust, in your language, wherever you are.",
      bullets: [
        "Verified professionals across dental, physiotherapy and telehealth",
        "Personalized guidance from a real person, not a chatbot",
        "Multilingual support in Portuguese, English and Spanish",
        "Transparent pricing before you book",
      ],
      trust: "Every professional is reviewed by SalbCare before joining the marketplace.",
      flow: "You choose the care you need, we help you book with the right professional, and stay with you through the follow-up.",
      cta: "Find a professional →",
    },
    pro: {
      eyebrow: "FOR PROFESSIONALS · SALBCARE PRO",
      title: "Grow your practice on a marketplace built for healthcare.",
      intro: "SalbCare Pro is where verified healthcare professionals meet patients actively looking for care. Get visibility, acquire new patients and manage your practice from one place.",
      bullets: [
        "New patients from a marketplace that already carries the SalbCare trust",
        "A curated digital presence that positions your practice",
        "Multilingual patient conversations, ready out of the box",
        "Telehealth and in-person, from the same profile",
        "Simple tools to manage appointments, records and growth",
      ],
      label: "Applications open. Join the curated network.",
      cta: "Apply as a professional",
    },
    how: {
      title: "How the journey works",
      subtitle: "Simple for patients. Structured for professionals.",
      steps: [
        "The patient chooses the type of care they need.",
        "SalbCare connects them to a verified professional.",
        "They book, meet and receive personalized care.",
        "The professional grows their practice with every visit.",
      ],
    },
    where: {
      title: "Where SalbCare is going",
      line: "A marketplace built to scale across specialties and regions.",
      next: "Starting on the coast of Brazil. Expanding to more cities, more specialties, and international patients.",
    },
    trust: {
      title: "A brand built on trust, technology and human care.",
      line: "Verified professionals, personalized support and a platform designed for real healthcare, not generic bookings.",
      badges: ["Verified professionals", "Multilingual support", "Secure by design", "Human curation"],
    },
    finalCta: {
      headline: "One ecosystem for those who care and those who need care.",
      ctaCare: "Find a professional",
      ctaClinic: "I'm a healthcare professional",
    },
    footerTag: "The healthcare marketplace that connects care to people.",
  },
  pt: {
    nav: { care: "Encontrar profissional", clinics: "Sou profissional de saúde" },
    hero: {
      eyebrow: "MARKETPLACE DE SAÚDE",
      headline: "Cuidado que conecta.",
      headlineAccent: "Cuidando de quem cuida e de quem precisa.",
      subhead:
        "A SalbCare é um ecossistema digital que conecta pacientes a profissionais de saúde de confiança. Simples para encontrar cuidado. Potente para crescer uma carreira.",
      ctaCare: "Encontrar profissional",
      ctaClinic: "Sou profissional de saúde",
    },
    origin: {
      eyebrow: "O PROBLEMA QUE RESOLVEMOS",
      title: "Encontrar o cuidado certo não deveria ser um jogo de sorte.",
      body:
        "Pacientes gastam horas procurando alguém em quem confiar, num idioma que entendem, com um preço que cabe no planejamento. Profissionais de saúde gastam ainda mais tempo tentando ser encontrados, organizar a agenda e fazer a carreira crescer. A SalbCare tira essa fricção do caminho. Um ecossistema, dois lados, um objetivo: cuidado que chega até quem precisa.",
      signature: "Fundada por Bianca Albuquerque, cirurgiã-dentista com MBA em gestão de negócios.",
    },
    what: {
      title: "Como a SalbCare funciona",
      line: "Uma plataforma. Dois lados. Um ciclo de cuidado que escala.",
      cards: ["Profissionais verificados", "Guiado pelo nosso time", "Feito para escalar"],
      cardDescs: [
        "Todo profissional passa pela curadoria SalbCare antes de aparecer no marketplace.",
        "Um humano de verdade ajuda o paciente a escolher, agendar e acompanhar. Sem beco sem saída.",
        "Multi-especialidade, multi-região, multi-idioma. Pronta para onde o cuidado precisa ir.",
      ],
    },
    cycle: {
      eyebrow: "O ECOSSISTEMA",
      title: "Dois lados. Uma marca. Uma rede que se reforça.",
      body:
        "A SalbCare é um marketplace com duas portas de entrada. Pacientes encontram cuidado de confiança. Profissionais ganham visibilidade, pacientes e as ferramentas para tocar uma prática moderna. Cada consulta fortalece os dois lados.",
      demand: {
        title: "Para pacientes · SalbCare Kite",
        body: "A porta do paciente. Encontre, agende e acompanhe seu cuidado com profissionais verificados, no seu idioma.",
      },
      supply: {
        title: "Para profissionais · SalbCare Pro",
        body: "A porta do profissional. Uma vitrine com curadoria, uma base de pacientes que cresce e as ferramentas para gerir e expandir.",
      },
    },
    kite: {
      eyebrow: "PARA PACIENTES · SALBCARE KITE",
      title: "Cuidado de confiança, no seu idioma, onde você estiver.",
      bullets: [
        "Profissionais verificados em odontologia, fisioterapia e teleconsulta",
        "Orientação personalizada com gente de verdade, sem chatbot",
        "Atendimento em português, inglês e espanhol",
        "Preço transparente antes de agendar",
      ],
      trust: "Todo profissional é avaliado pela SalbCare antes de entrar no marketplace.",
      flow: "Você escolhe o cuidado que precisa, a gente conecta ao profissional certo e acompanha o retorno.",
      cta: "Encontrar profissional →",
    },
    pro: {
      eyebrow: "PARA PROFISSIONAIS · SALBCARE PRO",
      title: "Faça sua carreira crescer em um marketplace feito para saúde.",
      intro: "O SalbCare Pro é onde profissionais de saúde verificados encontram pacientes que estão ativamente buscando cuidado. Visibilidade, novos pacientes e gestão da sua prática em um só lugar.",
      bullets: [
        "Novos pacientes de um marketplace que já carrega a confiança da marca SalbCare",
        "Presença digital com curadoria que posiciona sua prática",
        "Atendimento multilíngue com o paciente, pronto para usar",
        "Teleconsulta e presencial, no mesmo perfil",
        "Ferramentas simples para agenda, prontuário e crescimento",
      ],
      label: "Inscrições abertas. Entre para a rede com curadoria.",
      cta: "Candidatar como profissional",
    },
    how: {
      title: "Como a jornada funciona",
      subtitle: "Simples para o paciente. Estruturado para o profissional.",
      steps: [
        "O paciente escolhe o tipo de cuidado que precisa.",
        "A SalbCare conecta a um profissional verificado.",
        "Ele agenda, é atendido e recebe cuidado personalizado.",
        "O profissional cresce a sua prática a cada atendimento.",
      ],
    },
    where: {
      title: "Para onde a SalbCare vai",
      line: "Um marketplace pensado para escalar por especialidades e regiões.",
      next: "Começamos no litoral do Brasil. Expandindo para novas cidades, novas especialidades e pacientes internacionais.",
    },
    trust: {
      title: "Uma marca construída em confiança, tecnologia e cuidado humano.",
      line: "Profissionais verificados, atendimento personalizado e uma plataforma feita para saúde de verdade, não para agendamento genérico.",
      badges: ["Profissionais verificados", "Atendimento multilíngue", "Seguro por padrão", "Curadoria humana"],
    },
    finalCta: {
      headline: "Um ecossistema para quem cuida e para quem precisa de cuidado.",
      ctaCare: "Encontrar profissional",
      ctaClinic: "Sou profissional de saúde",
    },
    footerTag: "O marketplace de saúde que conecta cuidado a pessoas.",
  },
  es: {
    nav: { care: "Encontrar profesional", clinics: "Soy profesional de salud" },
    hero: {
      eyebrow: "MARKETPLACE DE SALUD",
      headline: "Cuidado que conecta.",
      headlineAccent: "Cuidando a quien cuida y a quien necesita cuidado.",
      subhead:
        "SalbCare es un ecosistema digital que conecta pacientes con profesionales de salud de confianza. Simple para encontrar atención. Potente para hacer crecer una carrera.",
      ctaCare: "Encontrar profesional",
      ctaClinic: "Soy profesional de salud",
    },
    origin: {
      eyebrow: "EL PROBLEMA QUE RESOLVEMOS",
      title: "Encontrar la atención correcta no debería ser un juego de suerte.",
      body:
        "Los pacientes pasan horas buscando a alguien de confianza, en un idioma que entienden y a un precio que pueden planificar. Los profesionales de salud pasan aún más tiempo intentando ser encontrados, organizar su agenda y hacer crecer su práctica. SalbCare elimina esa fricción. Un ecosistema, dos lados, un mismo objetivo: cuidado que llega a quien lo necesita.",
      signature: "Fundada por Bianca Albuquerque, cirujana dentista con MBA en gestión de negocios.",
    },
    what: {
      title: "Cómo funciona SalbCare",
      line: "Una plataforma. Dos lados. Un ciclo de cuidado que escala.",
      cards: ["Profesionales verificados", "Guiado por nuestro equipo", "Hecho para escalar"],
      cardDescs: [
        "Cada profesional pasa por la curaduría SalbCare antes de aparecer en el marketplace.",
        "Un humano de verdad ayuda al paciente a elegir, reservar y hacer seguimiento. Sin callejones sin salida.",
        "Multi-especialidad, multi-región, multi-idioma. Lista para donde el cuidado necesite llegar.",
      ],
    },
    cycle: {
      eyebrow: "EL ECOSISTEMA",
      title: "Dos lados. Una marca. Una red que se refuerza.",
      body:
        "SalbCare es un marketplace con dos puertas de entrada. Los pacientes encuentran atención de confianza. Los profesionales ganan visibilidad, pacientes y herramientas para llevar una práctica moderna. Cada consulta fortalece ambos lados.",
      demand: {
        title: "Para pacientes · SalbCare Kite",
        body: "La puerta del paciente. Encuentra, reserva y acompaña tu atención con profesionales verificados, en tu idioma.",
      },
      supply: {
        title: "Para profesionales · SalbCare Pro",
        body: "La puerta del profesional. Una vitrina curada, una base de pacientes que crece y las herramientas para gestionar y expandir.",
      },
    },
    kite: {
      eyebrow: "PARA PACIENTES · SALBCARE KITE",
      title: "Atención de confianza, en tu idioma, donde estés.",
      bullets: [
        "Profesionales verificados en odontología, fisioterapia y teleconsulta",
        "Orientación personalizada con personas reales, sin chatbot",
        "Atención en portugués, inglés y español",
        "Precio transparente antes de reservar",
      ],
      trust: "Cada profesional es evaluado por SalbCare antes de entrar al marketplace.",
      flow: "Eliges la atención que necesitas, nosotros te conectamos con el profesional adecuado y acompañamos el seguimiento.",
      cta: "Encontrar profesional →",
    },
    pro: {
      eyebrow: "PARA PROFESIONALES · SALBCARE PRO",
      title: "Haz crecer tu práctica en un marketplace hecho para la salud.",
      intro: "SalbCare Pro es donde profesionales de salud verificados encuentran pacientes que buscan atención activamente. Visibilidad, nuevos pacientes y gestión de tu práctica en un solo lugar.",
      bullets: [
        "Nuevos pacientes de un marketplace que ya carga la confianza de la marca SalbCare",
        "Presencia digital curada que posiciona tu práctica",
        "Atención multilingüe con el paciente, lista para usar",
        "Teleconsulta y presencial, desde el mismo perfil",
        "Herramientas simples para agenda, historia clínica y crecimiento",
      ],
      label: "Inscripciones abiertas. Únete a la red curada.",
      cta: "Postularme como profesional",
    },
    how: {
      title: "Cómo funciona el recorrido",
      subtitle: "Simple para el paciente. Estructurado para el profesional.",
      steps: [
        "El paciente elige el tipo de atención que necesita.",
        "SalbCare lo conecta con un profesional verificado.",
        "Reserva, es atendido y recibe cuidado personalizado.",
        "El profesional hace crecer su práctica en cada consulta.",
      ],
    },
    where: {
      title: "Hacia dónde va SalbCare",
      line: "Un marketplace pensado para escalar por especialidades y regiones.",
      next: "Empezamos en la costa de Brasil. Expandiendo a nuevas ciudades, nuevas especialidades y pacientes internacionales.",
    },
    trust: {
      title: "Una marca construida en confianza, tecnología y cuidado humano.",
      line: "Profesionales verificados, atención personalizada y una plataforma pensada para salud real, no para reservas genéricas.",
      badges: ["Profesionales verificados", "Atención multilingüe", "Seguro por diseño", "Curaduría humana"],
    },
    finalCta: {
      headline: "Un ecosistema para quien cuida y para quien necesita cuidado.",
      ctaCare: "Encontrar profesional",
      ctaClinic: "Soy profesional de salud",
    },
    footerTag: "El marketplace de salud que conecta cuidado con personas.",
  },
};

// Pro CTAs now route to /pro (noindex). Waitlist mailto kept here as reference for next season:
// mailto:biancadealbuquerquep@gmail.com?subject=SalbCare%20Pro%20%E2%80%94%20Clinic%20Waitlist

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
        description="SalbCare connects international travelers on Brazil's kite coast with trusted local health and wellness care. Book in minutes, care without borders."
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
              <Link
                to="/partnership"
                className="salb-btn salb-btn-ghost"
                onClick={() => trackCtaClick("home_hero_pro", "homepage", { lang })}
              >
                {t.hero.ctaClinic}
              </Link>
            </div>
            <div
              data-fade
              style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}
            >
              <a
                href="https://chat.whatsapp.com/KVHchlB6w6d1CWpI8I3EBZ"
                target="_blank"
                rel="noopener noreferrer"
                className="salb-btn salb-btn-ghost"
                onClick={() => trackCtaClick("home_hero_whatsapp_community", "homepage", { lang })}
              >
                Join WhatsApp Community
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
              <Link
                to="/kite"
                className="salb-card salb-cycle-card"
                style={{ borderColor: "rgba(201,164,92,0.28)", cursor: "pointer", textDecoration: "none", display: "block" }}
                onClick={() => trackCtaClick("home_cycle_kite", "homepage", { lang })}
              >
                <p className="salb-eyebrow" style={{ color: GOLD }}>DEMAND</p>
                <h3 className="salb-serif" style={{ fontSize: 22, color: "#fff", margin: "10px 0 8px" }}>
                  {t.cycle.demand.title}
                </h3>
                <p style={{ color: TEXT_MUTED, fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{t.cycle.demand.body}</p>
              </Link>
              <Link
                to="/partnership"
                className="salb-card salb-cycle-card"
                style={{ borderColor: "rgba(63,208,189,0.28)", cursor: "pointer", textDecoration: "none", display: "block" }}
                onClick={() => trackCtaClick("home_cycle_pro", "homepage", { lang })}
              >
                <p className="salb-eyebrow" style={{ color: TEAL }}>INFRASTRUCTURE</p>
                <h3 className="salb-serif" style={{ fontSize: 22, color: "#fff", margin: "10px 0 8px" }}>
                  {t.cycle.supply.title}
                </h3>
                <p style={{ color: TEXT_MUTED, fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{t.cycle.supply.body}</p>
              </Link>
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
                <Link
                  to="/partnership"
                  className="salb-btn salb-btn-ghost"
                  onClick={() => trackCtaClick("home_pro_waitlist", "homepage", { lang })}
                >
                  {t.pro.cta}
                </Link>
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
              <Link
                to="/partnership"
                className="salb-btn salb-btn-ghost"
                onClick={() => trackCtaClick("home_final_pro", "homepage", { lang })}
              >
                {t.finalCta.ctaClinic}
              </Link>
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
