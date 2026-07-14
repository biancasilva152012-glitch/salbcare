import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Mail, ShieldCheck } from "lucide-react";
import logoSalb from "/pwa-icon-512.png";
import LanguageSwitcher, { HubLang, detectInitialLang } from "@/components/shared/LanguageSwitcher";

const BRAND = { teal: "#00B4A0", tealDark: "#008C7C", ink: "#0D1B2A", cream: "#F8F9FA" };

const WHATSAPP_NUMBER = "5588996924700";
const PARTNER_EMAIL = "biancadealbuquerquep@gmail.com";

type Copy = {
  htmlLang: string;
  title: string;
  metaDesc: string;
  back: string;
  badge: string;
  h1: string;
  lead: string;
  sub: string;
  ctaWhats: string;
  ctaEmail: string;
  waMsg: string;
  emailSubject: string;
  emailBody: string;
  features: { h: string; b: string }[];
  footer: string;
};

const COPY: Record<HubLang, Copy> = {
  en: {
    htmlLang: "en",
    title: "Become a SalbCare Partner | SalbCare Local Partner Network",
    metaDesc:
      "Join the SalbCare Local Partner Network. Trusted healthcare and local partners connecting with international patients and tourists.",
    back: "Back",
    badge: "SALBCARE LOCAL PARTNER NETWORK",
    h1: "Become a SalbCare Partner",
    lead:
      "Are you a healthcare professional, hotel, pousada, restaurant or local business interested in partnering with SalbCare?",
    sub: "We select our partners carefully to create a trusted network for our community.",
    ctaWhats: "WhatsApp",
    ctaEmail: "Email",
    waMsg:
      "Hello SalbCare team, I would like to know more about becoming a partner and joining the SalbCare Local Partner Network.",
    emailSubject: "Partnership Opportunity - SalbCare",
    emailBody:
      "Hello SalbCare team,\n\nI am interested in becoming a partner and joining the SalbCare Local Partner Network.\n\nI would like to receive more information about partnership opportunities.\n\nThank you.",
    features: [
      { h: "Curated network", b: "Every partner is selected and verified by the SalbCare team." },
      { h: "International reach", b: "Connect with tourists, kitesurfers and international patients." },
      { h: "Trusted concierge", b: "SalbCare acts as the bridge between visitors and local businesses." },
    ],
    footer: "Wherever you are, SalbCare connects you with trusted local partners.",
  },
  pt: {
    htmlLang: "pt-BR",
    title: "Torne-se Parceiro SalbCare | Rede SalbCare Local Partner Network",
    metaDesc:
      "Junte-se à Rede SalbCare Local Partner Network. Profissionais de saúde e parceiros locais confiáveis conectados a pacientes e turistas internacionais.",
    back: "Voltar",
    badge: "SALBCARE LOCAL PARTNER NETWORK",
    h1: "Torne-se Parceiro SalbCare",
    lead:
      "Você é um profissional de saúde, hotel, pousada, restaurante ou negócio local interessado em fazer parceria com a SalbCare?",
    sub: "Selecionamos nossos parceiros com cuidado para criar uma rede confiável para a nossa comunidade.",
    ctaWhats: "WhatsApp",
    ctaEmail: "E-mail",
    waMsg:
      "Olá equipe SalbCare, gostaria de saber mais sobre como me tornar parceiro e fazer parte da Rede SalbCare Local Partner Network.",
    emailSubject: "Oportunidade de Parceria SalbCare",
    emailBody:
      "Olá equipe SalbCare,\n\nTenho interesse em me tornar parceiro e fazer parte da Rede SalbCare Local Partner Network.\n\nGostaria de receber mais informações sobre as oportunidades de parceria.\n\nObrigado.",
    features: [
      { h: "Rede curada", b: "Cada parceiro é selecionado e verificado pela equipe SalbCare." },
      { h: "Alcance internacional", b: "Conecte-se com turistas, kitesurfistas e pacientes internacionais." },
      { h: "Concierge de confiança", b: "A SalbCare atua como ponte entre visitantes e negócios locais." },
    ],
    footer: "Onde você estiver, a SalbCare conecta você a parceiros locais de confiança.",
  },
  es: {
    htmlLang: "es",
    title: "Conviértete en Socio SalbCare | Red SalbCare Local Partner Network",
    metaDesc:
      "Únete a la Red SalbCare Local Partner Network. Profesionales de salud y socios locales confiables conectados con pacientes y turistas internacionales.",
    back: "Volver",
    badge: "SALBCARE LOCAL PARTNER NETWORK",
    h1: "Conviértete en Socio SalbCare",
    lead:
      "¿Eres un profesional de salud, hotel, posada, restaurante o negocio local interesado en asociarte con SalbCare?",
    sub: "Seleccionamos a nuestros socios con cuidado para crear una red confiable para nuestra comunidad.",
    ctaWhats: "WhatsApp",
    ctaEmail: "Correo",
    waMsg:
      "Hola equipo SalbCare, me gustaría saber más sobre cómo convertirme en socio y formar parte de la Red SalbCare Local Partner Network.",
    emailSubject: "Oportunidad de Alianza SalbCare",
    emailBody:
      "Hola equipo SalbCare,\n\nTengo interés en convertirme en socio y formar parte de la Red SalbCare Local Partner Network.\n\nMe gustaría recibir más información sobre las oportunidades de alianza.\n\nGracias.",
    features: [
      { h: "Red curada", b: "Cada socio es seleccionado y verificado por el equipo SalbCare." },
      { h: "Alcance internacional", b: "Conecta con turistas, kitesurfistas y pacientes internacionales." },
      { h: "Concierge de confianza", b: "SalbCare actúa como puente entre visitantes y negocios locales." },
    ],
    footer: "Donde estés, SalbCare te conecta con socios locales de confianza.",
  },
};

export default function Partnership() {
  const [lang, setLang] = useState<HubLang>(detectInitialLang);
  const t = COPY[lang];

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.waMsg)}`;
  const mailUrl = `mailto:${PARTNER_EMAIL}?subject=${encodeURIComponent(
    t.emailSubject,
  )}&body=${encodeURIComponent(t.emailBody)}`;

  return (
    <div className="min-h-screen" style={{ background: BRAND.cream, color: BRAND.ink }}>
      <Helmet>
        <html lang={t.htmlLang} />
        <title>{t.title}</title>
        <meta name="description" content={t.metaDesc} />
        <link rel="canonical" href="https://salbcare.com/partnership" />
      </Helmet>

      <header className="px-5 py-5 border-b border-black/[0.06] bg-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <Link to="/kite" className="inline-flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher
              value={lang}
              onChange={setLang}
              className="!border-black/10 !bg-black/[0.03]"
            />
            <div className="flex items-center gap-2">
              <img src={logoSalb} alt="SalbCare" width={28} height={28} style={{ width: 28, height: 28 }} />
              <span className="font-semibold">SalbCare</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-5 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] px-3 py-1.5 rounded-full mb-6"
            style={{ background: `${BRAND.teal}15`, color: BRAND.tealDark }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {t.badge}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: BRAND.ink }}>
            {t.h1}
          </h1>

          <p className="text-lg md:text-xl leading-relaxed mb-4" style={{ color: BRAND.ink, opacity: 0.85 }}>
            {t.lead}
          </p>

          <p className="text-base leading-relaxed mb-10" style={{ color: BRAND.ink, opacity: 0.65 }}>
            {t.sub}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 hover:brightness-110"
              style={{
                background: "#25D366",
                color: "#fff",
                minHeight: 56,
                padding: "0 28px",
                fontSize: 15,
              }}
            >
              <MessageCircle className="h-5 w-5" />
              {t.ctaWhats}
            </a>
            <a
              href={mailUrl}
              className="inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 hover:brightness-110"
              style={{
                background: BRAND.ink,
                color: "#fff",
                minHeight: 56,
                padding: "0 28px",
                fontSize: 15,
              }}
            >
              <Mail className="h-5 w-5" />
              {t.ctaEmail}
            </a>
          </div>

          <div className="mt-16 grid sm:grid-cols-3 gap-4 text-left">
            {t.features.map((f) => (
              <div key={f.h} className="p-5 rounded-2xl bg-white border border-black/[0.06]">
                <div className="font-semibold mb-1" style={{ color: BRAND.ink }}>
                  {f.h}
                </div>
                <div className="text-sm" style={{ color: BRAND.ink, opacity: 0.65 }}>
                  {f.b}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer
        className="px-5 py-10 text-center text-sm"
        style={{ background: BRAND.ink, color: BRAND.cream }}
      >
        {t.footer}
      </footer>
    </div>
  );
}
