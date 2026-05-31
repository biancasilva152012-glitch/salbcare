import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import BrandLogo from "@/components/shared/BrandLogo";
import LanguageSwitcher, { detectInitialLang, type HubLang } from "@/components/shared/LanguageSwitcher";
import SharedFooter from "@/components/shared/SharedFooter";
import JournalSection from "@/components/landing/JournalSection";
import { trackCtaClick } from "@/hooks/useTracking";


const COPY: Record<HubLang, {
  navAbout: string; navContact: string;
  eyebrow: string; headline: string; subhead: string;
  trust: [string, string, string];
  proEyebrow: string; proTitle: string; proSub: string; proBullets: string; proCta: string; proSecondary: string;
  kiteEyebrow: string; kiteTitle: string; kiteSub: string; kiteBullets: string; kiteCta: string; kiteSecondary: string;
  storyTitle: string; story: string;
}> = {
  en: {
    navAbout: "About", navContact: "Contact",
    eyebrow: "HEALTH, MADE HUMAN",
    headline: "One mission. Different doors.",
    subhead: "SalbCare builds healthcare experiences for the moments traditional systems fail.",
    trust: ["Built in Brazil", "Available worldwide", "Trusted by health professionals"],
    proEyebrow: "FOR HEALTH PROFESSIONALS",
    proTitle: "Run your practice with confidence",
    proSub: "The all-in-one platform for autonomous psychologists, nutritionists, physicians and physiotherapists. Manage patients, schedule appointments, run telehealth, and stay tax-compliant.",
    proBullets: "✓ Digital records · ✓ E-prescriptions · ✓ Stripe billing · ✓ Mentora Financeira AI",
    proCta: "Explore SalbCare Pro →",
    proSecondary: "Login to your account",
    kiteEyebrow: "FOR INTERNATIONAL TRAVELERS",
    kiteTitle: "Feel good. Kite better.",
    kiteSub: "World-class dental, physiotherapy and telehealth in Ilha do Guajiru, Brazil — in English and Spanish, at a fraction of European prices.",
    kiteBullets: "✓ English & Spanish · ✓ International cards · ✓ R$50 to book · ✓ Pay rest at clinic",
    kiteCta: "Explore SalbCare Kite →",
    kiteSecondary: "Book a visit",
    storyTitle: "The brand behind both",
    story: "SalbCare is a healthcare platform built around one belief: access to good care shouldn't depend on where you are, what language you speak, or how much you earn. We build different products for different people — but the mission is always the same.",
  },
  pt: {
    navAbout: "Sobre", navContact: "Contato",
    eyebrow: "SAÚDE, FEITA HUMANA",
    headline: "Uma missão. Portas diferentes.",
    subhead: "A SalbCare constrói experiências de saúde para os momentos em que os sistemas tradicionais falham.",
    trust: ["Feita no Brasil", "Disponível no mundo", "Confiada por profissionais da saúde"],
    proEyebrow: "PARA PROFISSIONAIS DA SAÚDE",
    proTitle: "Gerencie sua clínica com confiança",
    proSub: "A plataforma completa para psicólogos, nutricionistas, médicos e fisioterapeutas autônomos. Prontuários, agenda, teleconsulta e compliance fiscal.",
    proBullets: "✓ Prontuário digital · ✓ Receita eletrônica · ✓ Cobrança Stripe · ✓ Mentora Financeira IA",
    proCta: "Conhecer SalbCare Pro →",
    proSecondary: "Entrar na minha conta",
    kiteEyebrow: "PARA VIAJANTES INTERNACIONAIS",
    kiteTitle: "Feel good. Kite better.",
    kiteSub: "Atendimento odontológico, fisioterapia e teleconsulta de classe mundial na Ilha do Guajiru — em inglês e espanhol, a uma fração dos preços europeus.",
    kiteBullets: "✓ Inglês & Espanhol · ✓ Cartão internacional · ✓ R$50 para reservar · ✓ Pague o restante na clínica",
    kiteCta: "Conhecer SalbCare Kite →",
    kiteSecondary: "Agendar visita",
    storyTitle: "A marca por trás",
    story: "A SalbCare nasceu de uma crença: o acesso a um bom cuidado não deve depender de onde você está, do idioma que fala ou de quanto ganha. Construímos produtos diferentes para pessoas diferentes — mas a missão é sempre a mesma.",
  },
  es: {
    navAbout: "Nosotros", navContact: "Contacto",
    eyebrow: "SALUD, MÁS HUMANA",
    headline: "Una misión. Puertas diferentes.",
    subhead: "SalbCare construye experiencias de salud para los momentos en que los sistemas tradicionales fallan.",
    trust: ["Hecho en Brasil", "Disponible mundialmente", "Confiado por profesionales"],
    proEyebrow: "PARA PROFESIONALES DE SALUD",
    proTitle: "Gestiona tu consulta con confianza",
    proSub: "La plataforma todo-en-uno para psicólogos, nutricionistas, médicos y fisioterapeutas autónomos.",
    proBullets: "✓ Historial digital · ✓ Recetas electrónicas · ✓ Pagos Stripe · ✓ Mentora Financiera IA",
    proCta: "Explorar SalbCare Pro →",
    proSecondary: "Entrar a mi cuenta",
    kiteEyebrow: "PARA VIAJEROS INTERNACIONALES",
    kiteTitle: "Feel good. Kite better.",
    kiteSub: "Odontología, fisioterapia y teleconsulta de clase mundial en Ilha do Guajiru, Brasil — en inglés y español, a una fracción de los precios europeos.",
    kiteBullets: "✓ Inglés & Español · ✓ Tarjetas internacionales · ✓ R$50 para reservar · ✓ Paga el resto en la clínica",
    kiteCta: "Explorar SalbCare Kite →",
    kiteSecondary: "Reservar visita",
    storyTitle: "La marca detrás",
    story: "SalbCare es una plataforma construida sobre una creencia: el acceso a buena salud no debe depender de dónde estés, qué idioma hables, o cuánto ganes.",
  },
};

export default function Hub() {
  const [lang, setLang] = useState<HubLang>("en");
  useEffect(() => setLang(detectInitialLang()), []);
  const t = COPY[lang];

  // Pro featured first for PT; Kite featured first for everyone else.
  const proFirst = lang === "pt";
  const cards = useMemo(() => (proFirst ? ["pro", "kite"] : ["kite", "pro"]), [proFirst]);

  return (
    <>
      <Helmet>
        <title>SalbCare — Healthcare, made human</title>
        <meta
          name="description"
          content="Healthcare platform serving health professionals in Brazil and international travelers in Ilha do Guajiru."
        />
        <link rel="canonical" href="https://salbcare.com/" />
        <meta property="og:title" content="SalbCare — Healthcare, made human" />
        <meta property="og:description" content="Healthcare platform serving professionals in Brazil and travelers worldwide." />
        <meta property="og:url" content="https://salbcare.com/" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-brand-dark text-white font-body">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10">
          <div className="container mx-auto px-6 py-5 flex items-center justify-between">
            <BrandLogo variant="white" to="/" />
            <nav className="flex items-center gap-5 text-sm">
              <Link to="/about" className="text-white/70 hover:text-white transition-colors hidden sm:inline">
                {t.navAbout}
              </Link>
              <Link to="/contact" className="text-white/70 hover:text-white transition-colors hidden sm:inline">
                {t.navContact}
              </Link>
              <LanguageSwitcher value={lang} onChange={setLang} />
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section
          className="relative min-h-[75vh] md:min-h-screen flex items-center"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at top, hsl(var(--brand-dark)) 0%, hsl(var(--brand-darker)) 80%)",
          }}
        >
          <div className="container mx-auto px-6 pt-32 pb-20 md:pt-40 md:pb-32 text-center max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kite-gold mb-5">
              {t.eyebrow}
            </p>
            <h1 className="font-heading text-4xl md:text-6xl font-semibold tracking-tight text-white leading-[1.05] text-balance">
              {t.headline}
            </h1>
            <p className="mt-5 text-base md:text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
              {t.subhead}
            </p>
            <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-wider text-white/50">
              {t.trust.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-kite-gold" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Product distribution */}
        <section className="bg-brand-darker py-16 md:py-24">
          <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl">
            {cards.map((c) =>
              c === "pro" ? <ProCard key="pro" t={t} lang={lang} /> : <KiteCard key="kite" t={t} lang={lang} />
            )}
          </div>
        </section>

        {/* Brand story */}
        <section className="bg-brand-dark py-20 md:py-28">
          <div className="container mx-auto px-6 max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kite-gold mb-5">
              {t.storyTitle}
            </p>
            <p className="font-heading text-xl md:text-2xl text-white/85 leading-relaxed text-balance">
              {t.story}
            </p>
          </div>
        </section>

        {/* Journal — featured essays from The SalbCare Journal */}
        <JournalSection />

        <SharedFooter />

      </div>
    </>
  );
}

function ProCard({ t, lang }: { t: typeof COPY["en"]; lang: HubLang }) {
  return (
    <article
      className="group relative rounded-2xl p-8 md:p-10 overflow-hidden border border-white/10 transition-shadow hover:shadow-2xl"
      style={{
        backgroundImage:
          "linear-gradient(155deg, hsl(var(--brand-dark)) 0%, hsl(var(--brand-darker)) 60%), radial-gradient(circle at 80% 0%, hsl(var(--pro-accent) / 0.25) 0%, transparent 60%)",
        backgroundBlendMode: "screen",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pro-accent mb-4">
        {t.proEyebrow}
      </p>
      <h2 className="font-heading text-2xl md:text-3xl font-semibold text-white leading-tight mb-3">
        {t.proTitle}
      </h2>
      <p className="text-white/65 text-sm md:text-base leading-relaxed mb-5">{t.proSub}</p>
      <p className="text-xs text-white/50 mb-8">{t.proBullets}</p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Link
          to="/pro"
          onClick={() => trackCtaClick("hub_pro_card", "hub", { lang })}
          className="inline-flex items-center justify-center rounded-full bg-pro-accent hover:bg-pro-accent-light text-brand-darker font-semibold px-5 py-2.5 text-sm transition-colors"
        >
          {t.proCta}
        </Link>
        <Link
          to="/login"
          onClick={() => trackCtaClick("hub_pro_login", "hub", { lang })}
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          {t.proSecondary} →
        </Link>
      </div>
    </article>
  );
}

function KiteCard({ t, lang }: { t: typeof COPY["en"]; lang: HubLang }) {
  return (
    <article
      className="group relative rounded-2xl p-8 md:p-10 overflow-hidden border border-kite-gold/20 transition-shadow hover:shadow-2xl"
      style={{
        backgroundImage:
          "linear-gradient(155deg, hsl(var(--brand-darker)) 0%, hsl(var(--brand-dark)) 100%), radial-gradient(circle at 80% 0%, hsl(var(--kite-gold) / 0.18) 0%, transparent 60%)",
        backgroundBlendMode: "screen",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-kite-gold mb-4">
        {t.kiteEyebrow}
      </p>
      <h2 className="font-heading italic text-2xl md:text-3xl font-semibold text-white leading-tight mb-3">
        {t.kiteTitle}
      </h2>
      <p className="text-white/65 text-sm md:text-base leading-relaxed mb-5">{t.kiteSub}</p>
      <p className="text-xs text-white/50 mb-8">{t.kiteBullets}</p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Link
          to="/kite"
          onClick={() => trackCtaClick("hub_kite_card", "hub", { lang })}
          className="inline-flex items-center justify-center rounded-full bg-kite-gold hover:bg-kite-gold-light text-brand-darker font-semibold px-5 py-2.5 text-sm transition-colors"
        >
          {t.kiteCta}
        </Link>
        <Link
          to="/kite?utm_source=hub&utm_medium=cta"
          onClick={() => trackCtaClick("hub_kite_book", "hub", { lang })}
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          {t.kiteSecondary} →
        </Link>
      </div>
    </article>
  );
}
