import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import KiteBookingModal, { type KiteProcedure } from "@/components/kite/KiteBookingModal";

const BOOKING_FEE = 50;

type Lang = "en" | "es";

const T = {
  en: {
    htmlLang: "en",
    title: "SalbDental — World-class care while you kite | Ilha do Guajiru",
    desc: "Dental, physiotherapy and online consultations in English & Spanish for kitesurfers and expats in Ilha do Guajiru, Ceará. Fraction of European prices.",
    nav: { dental: "Dental", physio: "Physio", online: "Telehealth", book: "Book Now" },
    hero: {
      welcome: "WELCOME · BIENVENIDOS",
      pin: "📍 Ilha do Guajiru, Ceará · Brazil",
      h1a: "Feel good.",
      h1b: "Kite better.",
      h1aEs: "Sentite bien.",
      h1bEs: "Kiteá mejor.",
      sub: "World-class dental, physiotherapy and telehealth — in English and Spanish, at a fraction of European prices.",
      subEs: "Atención dental, fisioterapia y teleconsulta — a una fracción de los precios europeos.",
      ctaIn: "See dental & physio →",
      ctaOnline: "Online consultation →",
      trust: ["European patients", "English & Spanish", "International cards"],
    },
    tabs: { dental: "🦷 Dental", physio: "💆 Physio & Recovery", online: "💻 Telehealth" },
    dentalIntro: "In-person care at our clinic in Ilha do Guajiru. Pay R$50 online to secure your slot — settle the rest at the clinic.",
    physioIntro: "Sore from kiting? Our physiotherapist specializes in kite-related recovery and sports massage.",
    onlineIntro: "Online consultations via Google Meet. Same day available. Pay in full, receive the Meet link within 2 hours.",
    inPersonBanner: "Your R$ 50 secures the appointment. Pay the remaining balance at the clinic on the day of your visit.",
    how: {
      h2: "How it works",
      inLabel: "In-person",
      onlineLabel: "Online",
      inSteps: ["1. Choose your procedure", "2. Pay R$ 50 booking fee", "3. Show up at the clinic", "4. Pay the remaining balance"],
      onlineSteps: ["1. Choose your consultation", "2. Pay in full", "3. Receive your Google Meet link", "4. Join from anywhere"],
    },
    testimonialsH2: "What kitesurfers say",
    testimonials: [
      { name: "Lars M.", flag: "🇩🇪", text: "Quick cleaning between sessions. English-speaking dentist, super clean clinic, paid €30 instead of €120 back home." },
      { name: "Sophie T.", flag: "🇫🇷", text: "Booked an online consultation from my pousada. Got the Meet link in less than an hour. Felt heard." },
      { name: "Pieter V.", flag: "🇳🇱", text: "Crashed hard, shoulder was wrecked. Three physio sessions later I was back on the water." },
    ],
    finalH2: "Book your appointment today.",
    card: {
      total: "total",
      euCompare: (eu: number) => `€${eu} in Europe`,
      tagFull: "Full payment",
      tagPartial: "R$50 now + rest at clinic",
      ctaOnline: (n: number) => `Book & Pay R$ ${n} →`,
      ctaIn: (n: number) => `Reserve for R$ ${n} →`,
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
    title: "SalbDental — Atención de primer nivel mientras haces kite | Ilha do Guajiru",
    desc: "Odontología, fisioterapia y consultas online en inglés y español para kitesurfistas y expatriados en Ilha do Guajiru, Ceará. Una fracción de los precios europeos.",
    nav: { dental: "Dental", physio: "Fisio", online: "Telesalud", book: "Reservar" },
    hero: {
      welcome: "BIENVENIDOS · WELCOME",
      pin: "📍 Ilha do Guajiru, Ceará · Brasil",
      h1a: "Sentite bien.",
      h1b: "Kiteá mejor.",
      h1aEs: "Feel good.",
      h1bEs: "Kite better.",
      sub: "Atención dental, fisioterapia y teleconsulta de primer nivel — en inglés y español, a una fracción de los precios europeos.",
      subEs: "World-class dental, physiotherapy and telehealth — in English and Spanish, at a fraction of European prices.",
      ctaIn: "Ver dental y fisio →",
      ctaOnline: "Consulta online →",
      trust: ["Pacientes europeos", "Inglés y español", "Tarjetas internacionales"],
    },
    tabs: { dental: "🦷 Dental", physio: "💆 Fisio y recuperación", online: "💻 Telesalud" },
    dentalIntro: "Atención presencial en nuestra clínica de Ilha do Guajiru. Paga R$50 online para reservar tu turno — el resto se abona en la clínica.",
    physioIntro: "¿Adolorido del kite? Nuestro fisioterapeuta se especializa en recuperación post-kite y masaje deportivo.",
    onlineIntro: "Consultas online vía Google Meet. Disponibilidad el mismo día. Pago completo, enlace de Meet en hasta 2 horas.",
    inPersonBanner: "Tus R$ 50 reservan la cita. Paga el saldo restante en la clínica el día de tu visita.",
    how: {
      h2: "Cómo funciona",
      inLabel: "Presencial",
      onlineLabel: "Online",
      inSteps: ["1. Elige el procedimiento", "2. Paga R$ 50 de reserva", "3. Acude a la clínica", "4. Paga el saldo restante"],
      onlineSteps: ["1. Elige tu consulta", "2. Paga el total", "3. Recibe tu enlace de Google Meet", "4. Conéctate desde cualquier lugar"],
    },
    testimonialsH2: "Lo que dicen los kitesurfistas",
    testimonials: [
      { name: "Lars M.", flag: "🇩🇪", text: "Limpieza rápida entre sesiones. Dentista en inglés, clínica impecable, pagué €30 en lugar de €120 en casa." },
      { name: "Sophie T.", flag: "🇫🇷", text: "Reservé una consulta online desde mi pousada. Recibí el enlace de Meet en menos de una hora. Me sentí escuchada." },
      { name: "Pieter V.", flag: "🇳🇱", text: "Caí fuerte y me destrocé el hombro. Tres sesiones de fisio después estaba de vuelta en el agua." },
    ],
    finalH2: "Reserva tu cita hoy.",
    card: {
      total: "total",
      euCompare: (eu: number) => `€${eu} en Europa`,
      tagFull: "Pago completo",
      tagPartial: "R$50 ahora + resto en la clínica",
      ctaOnline: (n: number) => `Reservar y pagar R$ ${n} →`,
      ctaIn: (n: number) => `Reservar por R$ ${n} →`,
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
  { id: "dental-cleaning",  type: "presencial", total: 180, eu: 120 },
  { id: "dental-whitening", type: "presencial", total: 480, eu: 350 },
  { id: "dental-exam",      type: "presencial", total: 120, eu: 90 },
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
    // Capture pousada ref
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
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f7f3ee", color: "#1a1612" }}>
      <Helmet>
        <html lang={t.htmlLang} />
        <title>{t.title}</title>
        <meta name="description" content={t.desc} />
        <link rel="canonical" href="https://salbcare.com/kite" />
        <link rel="alternate" hrefLang="en" href="https://salbcare.com/kite?lang=en" />
        <link rel="alternate" hrefLang="es" href="https://salbcare.com/kite?lang=es" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
        <meta property="og:title" content={t.title} />
        <meta property="og:description" content={t.desc} />
        <meta property="og:url" content="https://salbcare.com/kite" />
      </Helmet>

      <style>{`
        .kite-card { transition: transform .2s ease, box-shadow .2s ease; }
        .kite-card:hover { transform: translateY(-4px); box-shadow: 0 14px 30px -12px rgba(26,22,18,0.18); }
        .kite-h { font-family: 'Playfair Display', Georgia, serif; }
      `}</style>

      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all ${
          scrolled ? "bg-white/90 backdrop-blur border-b border-black/5 shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <a href="#top" className="text-xl font-bold tracking-tight" style={{ color: scrolled ? "#1a1612" : "#fff" }}>
            Salb<span style={{ color: "#2c6e49" }}>Dental</span>
          </a>
          <div className="flex items-center gap-4 md:gap-7 text-sm font-medium" style={{ color: scrolled ? "#1a1612" : "#fff" }}>
            <button onClick={() => scrollTo("dental")} className="hidden md:inline hover:opacity-70">{t.nav.dental}</button>
            <button onClick={() => scrollTo("physio")} className="hidden md:inline hover:opacity-70">{t.nav.physio}</button>
            <button onClick={() => scrollTo("online")} className="hidden md:inline hover:opacity-70">{t.nav.online}</button>

            {/* Language toggle */}
            <div
              className={`flex items-center rounded-full p-0.5 text-xs font-semibold border ${
                scrolled ? "border-black/10 bg-black/5" : "border-white/30 bg-white/10"
              }`}
              aria-label="Language"
            >
              {(["en", "es"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded-full transition ${
                    lang === l
                      ? "bg-[#2c6e49] text-white"
                      : scrolled ? "text-[#1a1612]/70" : "text-white/80"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollTo("services")}
              className="px-4 py-2 rounded-full bg-[#2c6e49] text-white hover:bg-[#1a3a2a]"
            >
              {t.nav.book}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        id="top"
        className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-5"
        style={{ background: "linear-gradient(135deg, #1a3a2a 0%, #2c6e49 100%)", color: "#fff" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-white/90 text-[11px] font-semibold tracking-[0.18em] mb-5">
            {t.hero.welcome}
          </span>
          <h1 className="kite-h text-4xl md:text-6xl font-bold leading-[1.05] mb-2">
            {t.hero.h1a} {t.hero.h1b}
          </h1>
          <p className="kite-h text-2xl md:text-3xl text-white/55 font-medium italic leading-tight mb-5">
            {t.hero.h1aEs} {t.hero.h1bEs}
          </p>
          <p className="text-base md:text-lg text-white/85 max-w-2xl mx-auto mb-1">
            {t.hero.sub}
          </p>
          <p className="text-sm md:text-base text-white/55 max-w-2xl mx-auto mb-7 italic">
            {t.hero.subEs}
          </p>
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/85 text-xs font-medium mb-8">
            {t.hero.pin}
          </span>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => scrollTo("in-person")} className="px-7 py-3 rounded-full bg-white text-[#1a3a2a] font-semibold hover:bg-white/90">
              {t.hero.ctaIn}
            </button>
            <button onClick={() => scrollTo("telehealth")} className="px-7 py-3 rounded-full bg-transparent border border-white/60 text-white font-semibold hover:bg-white/10">
              {t.hero.ctaOnline}
            </button>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/75">
            {t.hero.trust.map((it, i) => (
              <span key={it} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden>·</span>}
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
            <TabsList className="grid grid-cols-3 w-full max-w-2xl mx-auto mb-10 bg-white border border-black/5 p-1 rounded-full h-auto">
              <TabsTrigger value="dental" className="rounded-full data-[state=active]:bg-[#2c6e49] data-[state=active]:text-white py-2.5 text-sm md:text-base">{t.tabs.dental}</TabsTrigger>
              <TabsTrigger value="physio" className="rounded-full data-[state=active]:bg-[#2c6e49] data-[state=active]:text-white py-2.5 text-sm md:text-base">{t.tabs.physio}</TabsTrigger>
              <TabsTrigger value="online" className="rounded-full data-[state=active]:bg-[#2c6e49] data-[state=active]:text-white py-2.5 text-sm md:text-base">{t.tabs.online}</TabsTrigger>
            </TabsList>

            <TabsContent value="dental" id="dental">
              <div className="grid md:grid-cols-3 gap-5">
                {DENTAL_IDS.map((p) => (
                  <ProcedureCard key={p.id} id={p.id} type={p.type} total={p.total} eu={p.eu} t={t} onBook={openBooking} />
                ))}
              </div>
              <InfoBanner text={t.inPersonBanner} />
            </TabsContent>

            <TabsContent value="physio" id="physio">
              <p className="text-center max-w-2xl mx-auto text-[#5a564f] mb-8">{t.physioIntro}</p>
              <div className="grid md:grid-cols-2 gap-5">
                {PHYSIO_IDS.map((p) => (
                  <ProcedureCard key={p.id} id={p.id} type={p.type} total={p.total} eu={p.eu} t={t} onBook={openBooking} />
                ))}
              </div>
              <InfoBanner text={t.inPersonBanner} />
            </TabsContent>

            <TabsContent value="online" id="online">
              <p className="text-center max-w-2xl mx-auto text-[#5a564f] mb-8">{t.onlineIntro}</p>
              <div className="grid md:grid-cols-2 gap-5">
                {ONLINE_IDS.map((p) => (
                  <ProcedureCard key={p.id} id={p.id} type={p.type} total={p.total} t={t} onBook={openBooking} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: "#1a1612", color: "#f7f3ee" }} className="px-5 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="kite-h text-3xl md:text-4xl text-center mb-12">{t.how.h2}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-white/10 rounded-2xl p-8">
              <p className="text-xs uppercase tracking-widest text-[#2c6e49] mb-3 font-semibold">{t.how.inLabel}</p>
              <ol className="space-y-3 text-white/85">
                {t.how.inSteps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </div>
            <div className="border border-white/10 rounded-2xl p-8">
              <p className="text-xs uppercase tracking-widest text-[#2c6e49] mb-3 font-semibold">{t.how.onlineLabel}</p>
              <ol className="space-y-3 text-white/85">
                {t.how.onlineSteps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-5 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="kite-h text-3xl md:text-4xl text-center mb-12">{t.testimonialsH2}</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {t.testimonials.map((tx) => (
              <div key={tx.name} className="bg-white border border-black/5 rounded-2xl p-6">
                <p className="text-[#1a1612]/85 mb-4 leading-relaxed">"{tx.text}"</p>
                <p className="text-sm font-semibold">{tx.name} <span className="ml-1">{tx.flag}</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-20" style={{ background: "linear-gradient(135deg, #1a3a2a 0%, #2c6e49 100%)" }}>
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="kite-h text-3xl md:text-5xl mb-8">{t.finalH2}</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => scrollTo("dental")} className="px-6 py-3 rounded-full bg-white text-[#1a3a2a] font-semibold hover:bg-white/90">{t.tabs.dental}</button>
            <button onClick={() => scrollTo("physio")} className="px-6 py-3 rounded-full bg-white text-[#1a3a2a] font-semibold hover:bg-white/90">{t.tabs.physio}</button>
            <button onClick={() => scrollTo("online")} className="px-6 py-3 rounded-full bg-white text-[#1a3a2a] font-semibold hover:bg-white/90">{t.tabs.online}</button>
          </div>
        </div>
      </section>

      <footer style={{ background: "#1a1612", color: "#f7f3ee" }} className="px-5 py-10 text-center text-sm">
        SalbDental by SalbCare · Ilha do Guajiru · salbcare.com
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
      <h3 className="kite-h text-xl mb-3 text-[#1a1612]">{label}</h3>
      <div className="mb-4">
        <p className="text-2xl font-bold text-[#1a1612]">
          R$ {total}
          <span className="text-sm font-normal text-[#5a564f] ml-1">{t.card.total}</span>
        </p>
        {eu && <p className="text-sm text-gray-400 line-through mt-0.5">{t.card.euCompare(eu)}</p>}
      </div>
      <div className="mb-5">
        {isOnline ? (
          <span className="inline-block px-2 py-1 rounded bg-[#2c6e49]/10 text-[#2c6e49] text-xs font-semibold">{t.card.tagFull}</span>
        ) : (
          <span className="inline-block px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-semibold">{t.card.tagPartial}</span>
        )}
      </div>
      <button
        onClick={() => onBook(id, type, total)}
        className="mt-auto w-full px-4 py-3 rounded-full bg-[#2c6e49] text-white font-semibold hover:bg-[#1a3a2a] transition"
      >
        {isOnline ? t.card.ctaOnline(amountCharged) : t.card.ctaIn(amountCharged)}
      </button>
    </div>
  );
}

function InfoBanner({ text }: { text: string }) {
  return (
    <div className="mt-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 px-5 py-4 text-sm text-center">
      {text}
    </div>
  );
}
