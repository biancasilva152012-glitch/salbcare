import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import KiteBookingModal, { type KiteProcedure } from "@/components/kite/KiteBookingModal";
import logoSalb from "/pwa-icon-512.png";
import { Globe, Lock } from "lucide-react";

const BOOKING_FEE = 50;

type Lang = "en" | "es";

// SalbCare brand palette (matches main site)
const BRAND = {
  teal: "#00B4A0",
  tealDark: "#008C7C",
  ink: "#0D1B2A",
  cream: "#F8F9FA",
  muted: "#6B7280",
};

const T = {
  en: {
    htmlLang: "en",
    title: "SalbCare International — World-class care while you kite | Ilha do Guajiru",
    desc: "Dental, physiotherapy and online consultations in English & Spanish for kitesurfers and expats in Ilha do Guajiru, Ceará. A fraction of European prices.",
    nav: { dental: "Dental", physio: "Physio & Recovery", online: "Telehealth", book: "Book", bookFull: "Book now" },
    hero: {
      welcome: "WELCOME · BIENVENIDOS",
      pin: "Ilha do Guajiru · Ceará · Brazil",
      h1a: "Feel good.",
      h1b: "Kite better.",
      sub: "World-class dental, physiotherapy and telehealth — in English and Spanish, at a fraction of European prices.",
      ctaIn: "See dental & physio",
      ctaOnline: "Book a telehealth visit",
      trust: ["European patients", "English & Spanish", "International cards"],
    },
    tabs: { dental: "Dental", physio: "Physio & Recovery", online: "Telehealth" },
    dentalIntro: "In-person care at our clinic in Ilha do Guajiru. Pay R$50 online to reserve your spot — settle the balance at the clinic.",
    physioIntro: "Sore from kiting? Our physiotherapist specializes in kite recovery and sports massage.",
    onlineIntro: "Telehealth visits over Google Meet. Same-day availability. Pay in full and get your Meet link within 2 hours.",
    inPersonBanner: "Your R$50 holds the appointment. Pay the remaining balance at the clinic on the day of your visit.",
    how: {
      h2: "How it works",
      inLabel: "IN-PERSON",
      onlineLabel: "TELEHEALTH",
      inSteps: ["Choose your procedure", "Pay the R$50 booking fee", "Visit the clinic", "Pay the remaining balance"],
      onlineSteps: ["Choose your consultation", "Pay in full", "Receive your Google Meet link", "Join from anywhere"],
    },
    testimonialsH2: "What kitesurfers say",
    testimonials: [
      { name: "Lars M.", flag: "🇩🇪", text: "Quick cleaning between sessions. English-speaking dentist, super clean clinic." },
      { name: "Sophie T.", flag: "🇫🇷", text: "Booked an online consultation from my pousada. Got the Meet link in less than an hour. Felt heard." },
      { name: "Pieter V.", flag: "🇳🇱", text: "Crashed hard, shoulder was wrecked. Three physio sessions later, I was back IN the water." },
    ],
    finalH2: "Book your appointment today.",
    card: {
      total: "total",
      euCompare: (eu: number) => `€${eu} in Europe`,
      tagFull: "Full payment",
      tagPartial: "R$50 now, balance at the clinic",
      ctaOnline: (n: number) => `Book & pay R$${n}`,
      ctaIn: (n: number) => `Reserve for R$${n}`,
    },
    procedures: {
      "dental-cleaning":  "Cleaning & Check-up",
      "dental-whitening": "Teeth Whitening",
      "dental-exam":      "Complete Oral Exam",
      "physio-kite-recovery": "Kite Recovery Session",
      "physio-massage":       "Sports Massage (60 min)",
      "physio-postural":      "Postural Assessment",
      "physio-package":       "Full Recovery Package (3 sessions)",
      "telehealth-psychology":    "Psychology",
      "telehealth-nutrition":     "Nutrition",
      "telehealth-physio-online": "Physiotherapy (online)",
      "telehealth-medicine":      "General Medicine",
    } as Record<string, string>,
  },
  es: {
    htmlLang: "es",
    title: "SalbCare International — Atención de primer nivel mientras haces kite | Ilha do Guajiru",
    desc: "Odontología, fisioterapia y consultas online en inglés y español para kitesurfistas y expatriados en Ilha do Guajiru, Ceará. Una fracción de los precios europeos.",
    nav: { dental: "Dental", physio: "Fisio", online: "Telesalud", book: "Reservar", bookFull: "Reservar" },
    hero: {
      welcome: "BIENVENIDOS · WELCOME",
      pin: "Ilha do Guajiru · Ceará · Brasil",
      h1a: "Sentite bien.",
      h1b: "Kiteá mejor.",
      sub: "Atención dental, fisioterapia y teleconsulta de primer nivel — en inglés y español, a una fracción de los precios europeos.",
      ctaIn: "Ver dental y fisio",
      ctaOnline: "Consulta online",
      trust: ["Pacientes europeos", "Inglés y español", "Tarjetas internacionales"],
    },
    tabs: { dental: "Dental", physio: "Fisio y recuperación", online: "Telesalud" },
    dentalIntro: "Atención presencial en nuestra clínica de Ilha do Guajiru. Paga R$50 online para reservar tu turno — el resto se abona en la clínica.",
    physioIntro: "¿Adolorido del kite? Nuestro fisioterapeuta se especializa en recuperación post-kite y masaje deportivo.",
    onlineIntro: "Consultas online vía Google Meet. Disponibilidad el mismo día. Pago completo, enlace de Meet en hasta 2 horas.",
    inPersonBanner: "Tus R$50 reservan la cita. Paga el saldo restante en la clínica el día de tu visita.",
    how: {
      h2: "Cómo funciona",
      inLabel: "PRESENCIAL",
      onlineLabel: "EN LÍNEA",
      inSteps: ["Elige tu procedimiento", "Paga la tarifa de reserva de R$50", "Asiste a la clínica", "Paga el saldo restante"],
      onlineSteps: ["Elige tu consulta", "Paga el valor total", "Recibe tu enlace de Google Meet", "Conéctate desde cualquier lugar"],
    },
    testimonialsH2: "Lo que dicen los kitesurfistas",
    testimonials: [
      { name: "Lars M.", flag: "🇩🇪", text: "Limpieza rápida entre sesiones. Dentista en inglés, clínica impecable." },
      { name: "Sophie T.", flag: "🇫🇷", text: "Reservé una consulta online desde mi pousada. Recibí el enlace de Meet en menos de una hora. Me sentí escuchada." },
      { name: "Pieter V.", flag: "🇳🇱", text: "Me caí fuerte, hombro destrozado. Tres sesiones de fisio después, estaba DE VUELTA en el agua." },
    ],
    finalH2: "Reserva tu cita hoy.",
    card: {
      total: "total",
      euCompare: (eu: number) => `€${eu} en Europa`,
      tagFull: "Pago completo",
      tagPartial: "R$50 ahora, saldo en la clínica",
      ctaOnline: (n: number) => `Reservar y pagar R$${n}`,
      ctaIn: (n: number) => `Reservar por R$${n}`,
    },
    procedures: {
      "dental-cleaning":  "Limpieza y revisión",
      "dental-whitening": "Blanqueamiento dental",
      "dental-exam":      "Examen bucal completo",
      "physio-kite-recovery": "Sesión de recuperación post-kite",
      "physio-massage":       "Masaje deportivo (60 min)",
      "physio-postural":      "Evaluación postural",
      "physio-package":       "Paquete recuperación completa (3 sesiones)",
      "telehealth-psychology":    "Psicología",
      "telehealth-nutrition":     "Nutrición",
      "telehealth-physio-online": "Fisioterapia (online)",
      "telehealth-medicine":      "Medicina general",
    } as Record<string, string>,
  },
} as const;

const DENTAL_IDS: { id: string; type: "presencial"; total: number; eu: number }[] = [
  { id: "dental-cleaning",  type: "presencial", total: 200, eu: 120 },
  { id: "dental-whitening", type: "presencial", total: 480, eu: 350 },
  { id: "dental-exam",      type: "presencial", total: 200, eu: 90 },
];
const PHYSIO_IDS: { id: string; type: "presencial"; total: number; eu: number }[] = [
  { id: "physio-kite-recovery", type: "presencial", total: 200, eu: 90 },
  { id: "physio-massage",       type: "presencial", total: 180, eu: 80 },
  { id: "physio-postural",      type: "presencial", total: 160, eu: 70 },
  { id: "physio-package",       type: "presencial", total: 480, eu: 240 },
];
const ONLINE_IDS: { id: string; type: "online"; total: number }[] = [
  { id: "telehealth-psychology",    type: "online", total: 280 },
  { id: "telehealth-nutrition",     type: "online", total: 220 },
  { id: "telehealth-physio-online", type: "online", total: 240 },
  { id: "telehealth-medicine",      type: "online", total: 200 },
];

export default function Kite() {
  const [scrolled, setScrolled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<KiteProcedure | null>(null);
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem("kite_lang") as Lang | null;
    if (saved === "en" || saved === "es") return saved;
    const browser = navigator.language?.toLowerCase() || "";
    return browser.startsWith("es") ? "es" : "en";
  });

  const t = T[lang];

  useEffect(() => {
    try { localStorage.setItem("kite_lang", lang); } catch {}
  }, [lang]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      const safe = ref.slice(0, 64);
      try { localStorage.setItem("pousada_ref", safe); } catch {}
      try {
        const flag = `qr_scan_tracked_${safe}`;
        if (!sessionStorage.getItem(flag)) {
          sessionStorage.setItem(flag, "1");
          import("@/integrations/supabase/client").then(({ supabase }) => {
            supabase.rpc("increment_qr_scan" as any, { _slug: safe }).then(() => {});
          });
        }
      } catch {}
    }
    const langParam = params.get("lang");
    if (langParam === "es" || langParam === "en") setLang(langParam);

    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openBooking = (id: string, type: "presencial" | "online", total: number) => {
    const label = t.procedures[id] || id;
    const amountCharged = type === "online" ? total : BOOKING_FEE;
    setSelected({ id, label, type, amountCharged, totalPrice: total });
    setModalOpen(true);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        background: BRAND.cream,
        color: BRAND.ink,
        fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1',
      }}
    >
      <Helmet>
        <html lang={t.htmlLang} />
        <title>{t.title}</title>
        <meta name="description" content={t.desc} />
        <link rel="canonical" href="https://salbcare.com/kite" />
        <link rel="alternate" hrefLang="en" href="https://salbcare.com/kite?lang=en" />
        <link rel="alternate" hrefLang="es" href="https://salbcare.com/kite?lang=es" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap"
          rel="stylesheet"
        />
        <meta property="og:title" content={t.title} />
        <meta property="og:description" content={t.desc} />
        <meta property="og:url" content="https://salbcare.com/kite" />
      </Helmet>

      <style>{`
        .kite-h {
          font-family: 'Playfair Display', Georgia, serif;
          font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
          letter-spacing: -0.01em;
          line-height: 1.1;
          overflow-wrap: break-word;
          hyphens: manual;
          text-wrap: balance;
        }
        .kite-card {
          transition: transform 200ms cubic-bezier(0.2,0,0,1), box-shadow 200ms cubic-bezier(0.2,0,0,1);
          box-shadow: 0 1px 3px rgba(13,27,42,0.04), 0 4px 12px rgba(13,27,42,0.04);
        }
        .kite-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(13,27,42,0.05), 0 12px 32px rgba(13,27,42,0.08);
        }
        .kite-focus:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(0,180,160,0.35);
        }
        .price-tnum { font-feature-settings: "tnum" 1, "lnum" 1; }
        @media (max-width: 380px) {
          .hide-xs { display: none; }
        }
      `}</style>

      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled ? "bg-white/95 backdrop-blur border-b border-black/5 shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link
            to="/"
            aria-label="SalbCare — Home"
            className="kite-focus flex items-center gap-2 rounded-md"
          >
            <img src={logoSalb} alt="SalbCare" width={32} height={32} style={{ width: 32, height: 32 }} />
            <span
              className="text-base sm:text-lg font-bold tracking-tight"
              style={{ color: scrolled ? BRAND.ink : "#fff" }}
            >
              SalbCare
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-5 text-sm font-medium">
            <button
              onClick={() => scrollTo("services")}
              className="kite-focus hidden md:inline rounded-md hover:opacity-70 px-1"
              style={{ color: scrolled ? BRAND.ink : "#fff" }}
            >
              {t.nav.dental}
            </button>
            <button
              onClick={() => scrollTo("online-section")}
              className="kite-focus hidden md:inline rounded-md hover:opacity-70 px-1"
              style={{ color: scrolled ? BRAND.ink : "#fff" }}
            >
              {t.nav.online}
            </button>

            {/* Language toggle — collapses to globe on very small screens */}
            <div
              className={`flex items-center rounded-full p-0.5 text-xs font-semibold border ${
                scrolled ? "border-black/10 bg-black/[0.04]" : "border-white/30 bg-white/10"
              }`}
              aria-label="Language"
            >
              <Globe className="hide-xs hidden sm:hidden w-3.5 h-3.5 mx-1.5 opacity-60" aria-hidden />
              {(["en", "es"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`kite-focus px-2.5 py-1 rounded-full transition-all duration-200 ${
                    lang === l
                      ? "text-white"
                      : scrolled ? "text-[#0D1B2A]/65" : "text-white/80"
                  }`}
                  style={lang === l ? { background: BRAND.teal } : undefined}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollTo("services")}
              className="kite-focus rounded-full text-white font-semibold transition-all duration-200 hover:brightness-110"
              style={{
                background: BRAND.teal,
                padding: "8px 16px",
                boxShadow: "0 4px 14px rgba(0,180,160,0.30)",
              }}
            >
              <span className="hidden sm:inline">{t.nav.bookFull}</span>
              <span className="sm:hidden">{t.nav.book}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        id="top"
        className="relative"
        style={{
          background: `linear-gradient(135deg, ${BRAND.ink} 0%, #1a3a4a 50%, ${BRAND.tealDark} 100%)`,
          color: "#fff",
        }}
      >
        <div
          className="mx-auto text-center px-6 md:px-12 pt-[104px] md:pt-[120px] pb-14 md:pb-20 flex flex-col items-center"
          style={{ maxWidth: 1200 }}
        >
          <span
            className="inline-block px-3 py-1.5 rounded-full bg-white/15 text-white/90 font-semibold"
            style={{ fontSize: 11, letterSpacing: "0.15em" }}
          >
            {t.hero.welcome}
          </span>

          <h1
            className="kite-h font-bold"
            style={{
              marginTop: 24,
              fontSize: "clamp(40px, 9vw, 76px)",
              wordSpacing: "normal",
              maxWidth: 720,
            }}
          >
            {t.hero.h1a}{" "}
            <span style={{ display: "inline-block" }}>{t.hero.h1b}</span>
          </h1>

          <p
            className="text-white/85"
            style={{
              marginTop: 24,
              maxWidth: "38ch",
              fontSize: "clamp(15px, 2.2vw, 18px)",
              lineHeight: 1.5,
            }}
          >
            {t.hero.sub}
          </p>

          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/85 text-xs font-medium whitespace-nowrap"
            style={{ marginTop: 16 }}
          >
            📍 {t.hero.pin}
          </span>

          <div
            className="flex flex-col sm:flex-row justify-center w-full sm:w-auto gap-3 sm:gap-4"
            style={{ marginTop: 32, maxWidth: 480 }}
          >
            <button
              onClick={() => scrollTo("services")}
              className="kite-focus rounded-full font-semibold transition-all duration-200 hover:brightness-105 w-full sm:w-auto"
              style={{
                background: "#fff",
                color: BRAND.ink,
                minHeight: 56,
                padding: "0 28px",
              }}
            >
              {t.hero.ctaIn} →
            </button>
            <button
              onClick={() => scrollTo("online-section")}
              className="kite-focus rounded-full font-semibold transition-all duration-200 hover:bg-white/10 w-full sm:w-auto"
              style={{
                background: "transparent",
                color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.55)",
                minHeight: 56,
                padding: "0 28px",
              }}
            >
              {t.hero.ctaOnline} →
            </button>
          </div>

          <div
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/75"
            style={{ marginTop: 24 }}
          >
            {t.hero.trust.map((it, i) => (
              <span key={it} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden className="opacity-50">·</span>}
                <span>{it}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section id="services" className="px-5 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="dental">
            <div className="overflow-x-auto -mx-5 px-5 mb-10" style={{ scrollbarWidth: "none" }}>
              <TabsList
                className="inline-flex w-auto sm:w-full sm:max-w-2xl sm:mx-auto bg-white border border-black/5 p-1 rounded-full h-auto gap-1"
                style={{ boxShadow: "0 1px 3px rgba(13,27,42,0.04)" }}
              >
                {(["dental", "physio", "online"] as const).map((k) => (
                  <TabsTrigger
                    key={k}
                    value={k}
                    className="kite-focus rounded-full py-2.5 px-5 text-sm md:text-base font-semibold transition-all duration-200 data-[state=active]:text-white data-[state=inactive]:opacity-60"
                    style={{
                      // active background applied via data attribute selector below
                    }}
                  >
                    {t.tabs[k]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <style>{`
              [data-state="active"].kite-focus { background: ${BRAND.teal}; color: #fff; }
            `}</style>

            <TabsContent value="dental">
              <div id="in-person" />
              <p className="text-center max-w-2xl mx-auto mb-8" style={{ color: BRAND.muted }}>
                {t.dentalIntro}
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                {DENTAL_IDS.map((p) => (
                  <ProcedureCard key={p.id} id={p.id} type={p.type} total={p.total} eu={p.eu} t={t} onBook={openBooking} />
                ))}
              </div>
              <InfoBanner text={t.inPersonBanner} />
            </TabsContent>

            <TabsContent value="physio">
              <p className="text-center max-w-2xl mx-auto mb-8" style={{ color: BRAND.muted }}>
                {t.physioIntro}
              </p>
              <div className="grid sm:grid-cols-2 gap-5">
                {PHYSIO_IDS.map((p) => (
                  <ProcedureCard key={p.id} id={p.id} type={p.type} total={p.total} eu={p.eu} t={t} onBook={openBooking} />
                ))}
              </div>
              <InfoBanner text={t.inPersonBanner} />
            </TabsContent>

            <TabsContent value="online">
              <div id="online-section" />
              <p className="text-center max-w-2xl mx-auto mb-8" style={{ color: BRAND.muted }}>
                {t.onlineIntro}
              </p>
              <div className="grid sm:grid-cols-2 gap-5">
                {ONLINE_IDS.map((p) => (
                  <ProcedureCard key={p.id} id={p.id} type={p.type} total={p.total} t={t} onBook={openBooking} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: BRAND.ink, color: BRAND.cream }} className="px-5 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="kite-h text-3xl md:text-4xl text-center mb-12">{t.how.h2}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { label: t.how.inLabel, steps: t.how.inSteps },
              { label: t.how.onlineLabel, steps: t.how.onlineSteps },
            ].map((col) => (
              <div
                key={col.label}
                style={{
                  background: "#0F2A33",
                  border: "1px solid rgba(42, 191, 191, 0.15)",
                  borderRadius: 12,
                  padding: 32,
                }}
              >
                <p
                  className="text-xs uppercase mb-6 font-semibold"
                  style={{ color: "#2ABFBF", letterSpacing: "0.15em" }}
                >
                  {col.label}
                </p>
                <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
                  {col.steps.map((s, i) => (
                    <li key={s} style={{ display: "flex", gap: 12, color: "#fff", lineHeight: 1.6 }}>
                      <span style={{ color: "#2ABFBF", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-5 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="kite-h text-3xl md:text-4xl text-center mb-12">{t.testimonialsH2}</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {t.testimonials.map((tx) => (
              <div key={tx.name} className="kite-card bg-white border border-black/5 rounded-2xl p-6">
                <p className="mb-4 leading-relaxed" style={{ color: BRAND.ink, opacity: 0.85 }}>
                  "{tx.text}"
                </p>
                <p className="text-sm font-semibold">
                  {tx.name} <span className="ml-1">{tx.flag}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="px-5 py-20"
        style={{ background: `linear-gradient(135deg, ${BRAND.ink} 0%, ${BRAND.tealDark} 100%)` }}
      >
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="kite-h text-3xl md:text-5xl mb-8">{t.finalH2}</h2>
          <button
            onClick={() => scrollTo("services")}
            className="kite-focus rounded-full font-semibold transition-all duration-200 hover:brightness-105"
            style={{
              background: "#fff",
              color: BRAND.ink,
              minHeight: 56,
              padding: "0 32px",
              fontSize: 16,
            }}
          >
            {t.nav.bookFull} →
          </button>
        </div>
      </section>

      <footer style={{ background: BRAND.ink, color: BRAND.cream }} className="px-5 py-10 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src={logoSalb} alt="SalbCare" width={24} height={24} style={{ width: 24, height: 24 }} />
          <span className="font-semibold">SalbCare International</span>
        </div>
        <div className="opacity-70">Ilha do Guajiru · salbcare.com</div>
      </footer>

      <KiteBookingModal open={modalOpen} onOpenChange={setModalOpen} procedure={selected} lang={lang} />
    </div>
  );
}

function ProcedureCard({
  id, type, total, eu, t, onBook,
}: {
  id: string;
  type: "presencial" | "online";
  total: number;
  eu?: number;
  t: (typeof T)[Lang];
  onBook: (id: string, type: "presencial" | "online", total: number) => void;
}) {
  const isOnline = type === "online";
  const label = t.procedures[id] || id;
  const amountCharged = isOnline ? total : BOOKING_FEE;
  return (
    <div className="kite-card bg-white border border-black/5 rounded-2xl p-6 flex flex-col">
      <h3 className="kite-h text-xl mb-4" style={{ color: BRAND.ink }}>{label}</h3>

      <div className="mb-4">
        <p className="price-tnum text-2xl font-bold" style={{ color: BRAND.ink }}>
          R$ {total}
          <span className="text-sm font-normal ml-1" style={{ color: BRAND.muted }}>{t.card.total}</span>
        </p>
      </div>

      <div className="mb-6">
        {isOnline ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(0,180,160,0.10)",
              color: BRAND.tealDark,
              padding: "8px 14px",
            }}
          >
            <Lock className="w-3 h-3" aria-hidden />
            {t.card.tagFull}
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-full text-xs font-semibold"
            style={{
              background: "#FEF3C7",
              color: "#92400E",
              padding: "8px 14px",
            }}
          >
            <Lock className="w-3 h-3" aria-hidden />
            {t.card.tagPartial}
          </span>
        )}
      </div>

      <button
        onClick={() => onBook(id, type, total)}
        className="kite-focus mt-auto w-full rounded-full text-white font-semibold transition-all duration-200 hover:brightness-110"
        style={{
          background: BRAND.teal,
          minHeight: 48,
          boxShadow: "0 4px 14px rgba(0,180,160,0.30)",
        }}
      >
        {isOnline ? t.card.ctaOnline(amountCharged) : t.card.ctaIn(amountCharged)} →
      </button>
    </div>
  );
}

function InfoBanner({ text }: { text: string }) {
  return (
    <div
      className="mt-8 rounded-xl px-5 py-4 text-sm text-center"
      style={{ background: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E" }}
    >
      {text}
    </div>
  );
}
