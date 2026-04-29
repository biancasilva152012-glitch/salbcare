// build: 2026-04-27 — SalbScore narrative reformulation
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Menu, X, Shield,
  Building2, Key, CreditCard, Car, Plane, BarChart3,
  Hash, FileText, Clock, Star, FileCheck, Wallet, Bot,
  Calendar, Video, ClipboardList, Calculator, Brain, Users,
  CheckCircle2,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import SEOHead from "@/components/SEOHead";
import { trackCtaClick, trackUnified } from "@/hooks/useTracking";
import { useState } from "react";
// Fotos dos depoimentos servidas pelo bucket público "testimonials" no Supabase Storage.
// Upload manual via painel: sarah-almeida.{jpg,png}, mayara-barros.{jpg,png}, cinara-costa.{jpg,png}.
const TESTIMONIAL_BUCKET = "https://fevrdqmqmbahmeaymplq.supabase.co/storage/v1/object/public/testimonials";
const testimonialSarah = `${TESTIMONIAL_BUCKET}/mayara-barros.jpg`;
const testimonialMayara = `${TESTIMONIAL_BUCKET}/sarah-almeida.jpg`;
const testimonialCinara = `${TESTIMONIAL_BUCKET}/cinara-costa.jpg`;

/* ─────────────────────────────────────────────
 * DESIGN TOKENS — única fonte de verdade
 * ───────────────────────────────────────────── */
const C = {
  bg: "#0B1623",
  card: "#111E2D",
  cardElev: "#172538",
  cardHover: "#141F30",
  teal: "#00B4A0",
  tealHover: "#00D4BE",
  tealOnDark: "#0B1623",
  text: "#F4F7FB",
  textMuted: "#94A3B8",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  borderTeal: "rgba(0,180,160,0.28)",
  borderTealHover: "rgba(0,180,160,0.45)",
  tealTint: "rgba(0,180,160,0.12)",
  navBg: "rgba(11,22,35,0.85)",
  gold: "#E8C547",
  bgLight: "#F5F5F7",
  bgLightInk: "#0B1623",
  bgLightMuted: "#475467",
  bgLightBorder: "rgba(11,22,35,0.08)",
} as const;

const S = {
  sectionY: "py-20 sm:py-28",
  sectionYTight: "py-16 sm:py-20",
  cardPad: 28,
  cardPadLg: 32,
  radius: 16,
  radiusBtn: 10,
  radiusSmBtn: 8,
} as const;

const T = {
  fast: "150ms ease",
  card: "200ms ease",
} as const;

const reveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const Mark = ({ light = false }: { light?: boolean }) => (
  <span
    aria-hidden
    style={{
      display: "block",
      width: 48, height: 2, borderRadius: 2,
      background: light ? C.teal : C.teal,
      margin: "0 auto 24px",
    }}
  />
);

const initialsOf = (name: string) =>
  name.replace(/^Dra?\.?\s+/i, "").split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

const TestimonialAvatar = ({ src, name }: { src: string; name: string }) => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [currentSrc, setCurrentSrc] = useState(src);
  const triedPng = currentSrc.endsWith(".png");
  return (
    <div style={{ position: "relative", width: 56, height: 56, borderRadius: "9999px", border: "2px solid #ffffff", background: C.cardElev, flexShrink: 0, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
      {status === "loading" && (
        <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "9999px", background: `linear-gradient(90deg, ${C.cardElev} 0%, ${C.cardHover} 50%, ${C.cardElev} 100%)`, backgroundSize: "200% 100%", animation: "salbShimmer 1.4s ease-in-out infinite" }} />
      )}
      {status !== "error" && (
        <img src={currentSrc} alt={`Foto de ${name}`} loading="lazy" decoding="async" width={56} height={56}
          onLoad={() => setStatus("loaded")}
          onError={() => {
            if (!triedPng) {
              setStatus("loading");
              setCurrentSrc(currentSrc.replace(/\.jpg$/, ".png"));
            } else {
              setStatus("error");
            }
          }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", borderRadius: "9999px", opacity: status === "loaded" ? 1 : 0, transition: "opacity 220ms ease" }} />
      )}
      {status === "error" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.teal, fontWeight: 700, fontSize: 14, background: C.cardElev, borderRadius: "9999px" }}>
          {initialsOf(name)}
        </div>
      )}
    </div>
  );
};

/* Track helper para CTAs principais — eventos padronizados */
const fireCta = (ctaName: string, location: string, extras: Record<string, unknown> = {}) => {
  trackCtaClick(ctaName, location, extras);
  trackUnified("landing_cta_click", { cta_name: ctaName, cta_location: location, ...extras });
};

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* JSON-LD: Organization + Product (SalbScore) + FAQPage */
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "SalbCare",
        url: "https://salbcare.com.br",
        logo: "https://salbcare.com.br/apple-touch-icon.png",
        sameAs: [],
      },
      {
        "@type": "Product",
        name: "SalbScore",
        description: "Identidade financeira do profissional de saúde autônomo. Nota de 0 a 1000 construída a partir do histórico real de atendimentos, recebimentos via Pix e tempo de atuação na plataforma.",
        brand: { "@type": "Brand", name: "SalbCare" },
        category: "Financial Identity",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "O Comprovante de Renda SalbCare substitui contracheque?", acceptedAnswer: { "@type": "Answer", text: "Para a maioria das finalidades como aluguel e parcelamentos, sim. Para finalidades específicas como financiamento imobiliário, recomendamos apresentar junto com declaração contábil. O Comprovante está em desenvolvimento no roadmap 2026." } },
          { "@type": "Question", name: "Em quanto tempo meu SalbScore fica relevante?", acceptedAnswer: { "@type": "Answer", text: "Em 30 dias de uso ativo seu histórico já é consistente. Em 6 meses, atinge faixa Estabelecido. Em 12 meses, a maioria dos profissionais alcança faixa Premium." } },
          { "@type": "Question", name: "E se eu já tenho contador?", acceptedAnswer: { "@type": "Answer", text: "A SalbCare complementa o contador. Contador faz IRPF e impostos. SalbCare constrói seu histórico financeiro profissional verificável em PDF — algo que contador comum não emite." } },
          { "@type": "Question", name: "Funciona para MEI, autônomo PF, Simples Nacional?", acceptedAnswer: { "@type": "Answer", text: "Funciona para todos os regimes. A IA detecta o seu e calcula tudo de forma adequada." } },
          { "@type": "Question", name: "E se eu cancelar? Perco meu SalbScore?", acceptedAnswer: { "@type": "Answer", text: "Seu histórico fica salvo. Reativando, você continua de onde parou." } },
          { "@type": "Question", name: "Meus dados estão seguros?", acceptedAnswer: { "@type": "Answer", text: "Sim. 100% LGPD. Criptografia em repouso, RLS no banco, auditoria de acesso. Você pode pedir exclusão total a qualquer momento." } },
        ],
      },
    ],
  };

  return (
    <>
      <SEOHead
        title="SalbCare — A primeira plataforma que enxerga a renda do profissional de saúde autônomo"
        description="Construa seu SalbScore, organize sua renda real e pare de ser invisível pro sistema financeiro brasileiro. 7 dias grátis, sem cartão."
        canonical="/"
        jsonLd={jsonLd}
      />

      <style>{`
        .salb-h { font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; color: ${C.text}; }
        .salb-h-light { font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; color: ${C.bgLightInk}; }
        .salb-sub { font-weight: 400; line-height: 1.65; color: ${C.textMuted}; }

        .salb-nav-link { color: ${C.textMuted}; font-weight: 500; transition: color ${T.fast}; }
        .salb-nav-link:hover, .salb-nav-link:focus-visible { color: ${C.text}; }

        .salb-btn-outline {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: ${C.teal};
          border: 1px solid ${C.borderTeal};
          border-radius: ${S.radiusSmBtn}px; padding: 8px 18px;
          font-size: 14px; font-weight: 600;
          transition: background ${T.fast}, border-color ${T.fast}, color ${T.fast};
        }
        .salb-btn-outline:hover, .salb-btn-outline:focus-visible {
          border-color: ${C.teal}; background: ${C.tealTint};
        }

        .salb-btn-outline-light {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: #fff; color: ${C.teal};
          border: 1.5px solid ${C.teal};
          border-radius: ${S.radiusBtn}px; padding: 14px 26px;
          font-size: 15px; font-weight: 700;
          transition: background ${T.fast}, color ${T.fast};
        }
        .salb-btn-outline-light:hover, .salb-btn-outline-light:focus-visible {
          background: ${C.teal}; color: #fff;
        }

        .salb-btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: ${C.teal}; color: ${C.tealOnDark};
          border-radius: ${S.radiusBtn}px; padding: 15px 32px;
          font-size: 15px; font-weight: 700;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
          transition: background ${T.fast};
        }
        .salb-btn-primary:hover, .salb-btn-primary:focus-visible { background: ${C.tealHover}; }

        .salb-btn-primary-sm {
          display: inline-flex; align-items: center; justify-content: center;
          background: ${C.teal}; color: ${C.tealOnDark};
          border-radius: ${S.radiusSmBtn}px; padding: 8px 18px;
          font-size: 14px; font-weight: 700;
          transition: background ${T.fast};
        }
        .salb-btn-primary-sm:hover, .salb-btn-primary-sm:focus-visible { background: ${C.tealHover}; }

        .salb-card {
          background: ${C.card}; border: 1px solid ${C.border};
          border-radius: ${S.radius}px; padding: ${S.cardPadLg}px;
          transition: border-color ${T.card}, background ${T.card};
        }
        .salb-card:hover { border-color: ${C.borderTealHover}; background: ${C.cardHover}; }

        .salb-card-light {
          background: #fff;
          border: 1px solid ${C.bgLightBorder};
          border-radius: ${S.radius}px;
          padding: 24px;
          transition: border-color ${T.card}, transform ${T.card};
        }
        .salb-card-light:hover { border-color: ${C.teal}; transform: translateY(-2px); }

        .salb-grid-bg {
          background-color: ${C.bg};
          background-image: repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.018) 79px, rgba(255,255,255,0.018) 80px);
        }

        .salb-faq-item {
          background: ${C.card}; border: 1px solid ${C.border};
          border-radius: 12px; padding: 0 20px;
          transition: border-color ${T.card};
        }
        .salb-faq-item[data-state="open"] { border-color: ${C.borderTeal}; }

        @media (prefers-contrast: more) {
          .salb-card, .salb-faq-item { border-color: ${C.borderStrong}; }
          .salb-nav-link { color: ${C.text}; }
          .salb-btn-outline { border-color: ${C.teal}; }
        }

        @media (prefers-reduced-motion: reduce) {
          .salb-nav-link, .salb-btn-outline, .salb-btn-primary, .salb-btn-primary-sm,
          .salb-card, .salb-card-light, .salb-faq-item { transition: none !important; }
        }

        /* SalbScore ring fill: 720/1000 = 72% of circumference (2*PI*92 ≈ 578) → offset = 578*0.28 ≈ 162 */
        @keyframes salbScoreRing { to { stroke-dashoffset: 162; } }
        @keyframes salbScoreNumber {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes salbShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .salb-score-glow {
          filter: drop-shadow(0 0 24px ${C.teal}66);
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
        {/* ── Navbar ── */}
        <nav style={{ position: "sticky", top: 0, zIndex: 100, background: C.navBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}` }}>
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-2">
              <Shield size={20} color={C.teal} strokeWidth={2.4} />
              <span style={{ fontWeight: 800, color: C.text, letterSpacing: "-0.02em", fontSize: 17 }}>SalbCare</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#salbscore" className="salb-nav-link text-sm">SalbScore</a>
              <Link to="/para-profissionais" className="salb-nav-link text-sm">Para Profissionais</Link>
              <a href="#planos" className="salb-nav-link text-sm">Planos</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login?source=landing-nav"
                onClick={() => fireCta("login", "landing_nav", { source: "landing-nav" })}
                className="salb-btn-outline"
              >
                Já tenho conta
              </Link>
              <Link
                to="/register?source=landing-nav"
                onClick={() => fireCta("register", "landing_nav", { source: "landing-nav" })}
                className="salb-btn-primary-sm"
              >
                Começar grátis
              </Link>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu" aria-expanded={mobileMenuOpen} style={{ color: C.text, background: "transparent" }}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden px-4 py-4 space-y-3" style={{ borderTop: `1px solid ${C.border}`, background: C.bg }}>
              <a href="#salbscore" onClick={() => setMobileMenuOpen(false)} className="salb-nav-link block text-sm">SalbScore</a>
              <Link to="/para-profissionais" onClick={() => setMobileMenuOpen(false)} className="salb-nav-link block text-sm">Para Profissionais</Link>
              <a href="#planos" onClick={() => setMobileMenuOpen(false)} className="salb-nav-link block text-sm">Planos</a>
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login?source=landing-nav-mobile"
                  onClick={() => { fireCta("login", "landing_nav_mobile", { source: "landing-nav-mobile" }); setMobileMenuOpen(false); }}
                  className="salb-btn-outline">Já tenho conta</Link>
                <Link to="/register?source=landing-nav-mobile"
                  onClick={() => { fireCta("register", "landing_nav_mobile", { source: "landing-nav-mobile" }); setMobileMenuOpen(false); }}
                  className="salb-btn-primary-sm">Começar grátis</Link>
              </div>
            </motion.div>
          )}
        </nav>

        {/* ── 1. HERO ── */}
        <section className="salb-grid-bg">
          <div className="mx-auto max-w-5xl px-5 sm:px-6 pt-14 pb-16 sm:pt-24 sm:pb-24">
            <motion.div variants={stagger} initial="hidden" animate="show" className="text-center max-w-3xl mx-auto">
              <motion.div variants={reveal}><Mark /></motion.div>

              <motion.h1 variants={reveal} className="salb-h" style={{ fontSize: "clamp(36px, 7vw, 64px)" }}>
                Sua <span style={{ color: C.teal }}>vitrine</span> para pacientes.
                <br />
                Seu <span style={{ color: C.teal }}>controle</span> para gestão.
              </motion.h1>

              <motion.p variants={reveal}
                style={{ fontSize: "clamp(17px, 2.2vw, 21px)", maxWidth: 680, margin: "24px auto 0", color: C.text, opacity: 0.92, fontWeight: 500, lineHeight: 1.5 }}>
                Mais de <strong style={{ color: C.teal, opacity: 1 }}>500 profissionais</strong> já organizaram sua prática e estão construindo seu <strong style={{ color: C.teal, opacity: 1 }}>SalbScore</strong> — a identidade financeira que o banco nunca te deu.
              </motion.p>

              <motion.ul variants={reveal} className="flex flex-wrap items-center justify-center"
                style={{ gap: "10px 14px", marginTop: 24, listStyle: "none", padding: 0 }}>
                {[
                  { Icon: Wallet, text: "100% das suas consultas no seu bolso" },
                  { Icon: FileCheck, text: "Comprovante de Renda SalbCare" },
                  { Icon: Bot, text: "IA financeira que conhece seus números" },
                ].map((b) => (
                  <li key={b.text}
                    style={{ color: C.text, fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8,
                      background: C.tealTint, border: `1px solid ${C.borderTeal}`, borderRadius: 999, padding: "6px 12px" }}>
                    <b.Icon size={14} color={C.teal} aria-hidden />
                    {b.text}
                  </li>
                ))}
              </motion.ul>

              {/* Social proof bar discreto */}
              <motion.p variants={reveal}
                style={{ marginTop: 18, color: C.textMuted, fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span aria-hidden style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: "#22c55e", boxShadow: "0 0 0 4px rgba(34,197,94,0.18)" }} />
                47 profissionais cadastrados esta semana
              </motion.p>

              <motion.div variants={reveal} className="flex flex-col items-center" style={{ marginTop: 32, gap: 12 }}>
                <Link to="/register?source=landing-hero"
                  onClick={() => fireCta("register", "landing_hero", { source: "landing-hero" })}
                  className="salb-btn-primary"
                  style={{ minHeight: 56, padding: "16px 36px", fontSize: 16, width: "100%", maxWidth: 360 }}
                  data-track="hero_cta_register">
                  Começar grátis por 7 dias
                  <ArrowRight size={18} />
                </Link>
                <p style={{ color: C.textMuted, fontSize: 13 }}>
                  Sem cartão de crédito · Cancele quando quiser
                </p>
                <Link to="/login?source=landing-hero"
                  onClick={() => fireCta("login", "landing_hero", { source: "landing-hero" })}
                  className="salb-nav-link"
                  style={{ fontSize: 13, marginTop: 4, textDecoration: "underline", textUnderlineOffset: 4 }}>
                  Já tenho conta · Fazer login
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── 1.5 NOVO BLOCO CTA — SalbScore ── */}
        <section aria-label="SalbScore — sua identidade financeira" style={{ background: C.bg, paddingTop: 32, paddingBottom: 32 }}>
          <div className="mx-auto max-w-5xl px-5 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                background: "#0D1B2A",
                borderRadius: 24,
                border: `1px solid ${C.border}`,
                boxShadow: "0 20px 60px -20px rgba(0,180,160,0.25), 0 0 0 1px rgba(0,180,160,0.10) inset",
                padding: "clamp(28px, 5vw, 56px)",
              }}
            >
              {/* Badge topo */}
              <div className="flex justify-center" style={{ marginBottom: 20 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(0,180,160,0.12)",
                    border: "1px solid rgba(0,180,160,0.35)",
                    color: C.teal,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    padding: "6px 14px",
                    borderRadius: 999,
                  }}
                >
                  <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: C.teal, boxShadow: "0 0 0 4px rgba(0,180,160,0.18)" }} />
                  Novo • Exclusivo SalbCare
                </span>
              </div>

              {/* Título */}
              <h2
                className="text-center"
                style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  color: "#ffffff",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  fontSize: "clamp(26px, 4.4vw, 40px)",
                  maxWidth: 760,
                  margin: "0 auto",
                }}
              >
                Seu score já está sendo calculado —{" "}
                <span style={{ color: C.teal }}>você ainda não sabe quanto vale.</span>
              </h2>

              {/* Subtítulo */}
              <p
                className="text-center"
                style={{
                  marginTop: 18,
                  color: "rgba(255,255,255,0.78)",
                  fontSize: "clamp(15px, 2vw, 17px)",
                  lineHeight: 1.6,
                  maxWidth: 720,
                  marginInline: "auto",
                }}
              >
                O <strong style={{ color: "#fff" }}>SalbScore™</strong> é a primeira identidade financeira do
                profissional de saúde autônomo brasileiro. Enquanto você atende, a SalbCare constrói seu histórico:
                pacientes, receita, conformidade com CRM/CRP/CRN, tempo de atuação. Resultado: um número de{" "}
                <strong style={{ color: C.teal }}>0 a 1000</strong> que o banco, a imobiliária e o consulado vão aceitar.
              </p>

              {/* 3 bullets em teal */}
              <ul
                style={{
                  marginTop: 28,
                  display: "grid",
                  gap: 10,
                  maxWidth: 620,
                  marginInline: "auto",
                  listStyle: "none",
                  padding: 0,
                }}
              >
                {[
                  "Substitui contracheque para aluguel, financiamento e visto",
                  "Comprova renda real em Pix sem depender de contador",
                  "Quanto mais tempo na SalbCare, mais alto e mais valioso fica",
                ].map((b) => (
                  <li
                    key={b}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      color: "rgba(255,255,255,0.92)",
                      fontSize: 15,
                      lineHeight: 1.55,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        flexShrink: 0,
                        marginTop: 3,
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,180,160,0.18)",
                        color: C.teal,
                        fontWeight: 800,
                        fontSize: 11,
                      }}
                    >
                      ✓
                    </span>
                    {b}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex flex-col items-center" style={{ marginTop: 32, gap: 10 }}>
                <Link
                  to="/cadastro?source=landing-salbscore-cta"
                  onClick={() => fireCta("register", "landing_salbscore_cta", { source: "landing-salbscore-cta" })}
                  className="salb-btn-primary"
                  style={{
                    minHeight: 56,
                    padding: "16px 32px",
                    fontSize: 16,
                    width: "100%",
                    maxWidth: 420,
                    fontWeight: 700,
                  }}
                  data-track="landing_salbscore_cta_register"
                >
                  Começar a construir meu SalbScore
                  <ArrowRight size={18} />
                </Link>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                  Grátis nos primeiros 10 pacientes. Sem cartão de crédito.
                </p>
                <p
                  style={{
                    marginTop: 10,
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    textAlign: "center",
                    maxWidth: 480,
                    lineHeight: 1.5,
                  }}
                >
                  <span aria-hidden>⚡</span>
                  Score disponível apenas para quem usa a SalbCare — não existe em nenhuma outra plataforma.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <section style={{ background: C.cardElev, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
          <div className="mx-auto max-w-6xl px-5 sm:px-6 py-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <p style={{ color: C.text, fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
                Profissionais de saúde de várias cidades brasileiras já constroem seu <strong style={{ color: C.teal }}>SalbScore</strong>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
                style={{ color: C.textMuted, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em" }}>
                {["CRM", "CRP", "CRN", "CRO", "CREFITO", "CFFa"].map((c) => (
                  <span key={c} style={{ padding: "4px 10px", border: `1px solid ${C.border}`, borderRadius: 6 }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. VOCÊ É INVISÍVEL PRO BANCO? (núcleo emocional) ── */}
        <section style={{ background: C.bgLight }} className={S.sectionY} aria-label="Você é invisível pro banco?">
          <div className="mx-auto max-w-5xl px-5 sm:px-6">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="text-center" style={{ marginBottom: 48 }}>
              <motion.h2 variants={reveal} className="salb-h-light" style={{ fontSize: "clamp(30px, 5vw, 48px)" }}>
                Você atende. Você fatura.
                <br />
                Você recebe via Pix.
              </motion.h2>
              <motion.p variants={reveal} style={{ marginTop: 18, fontSize: "clamp(17px, 2.4vw, 22px)", color: C.bgLightMuted, fontWeight: 500, lineHeight: 1.45 }}>
                Mas pro sistema financeiro brasileiro, você não existe.
              </motion.p>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
              className="grid gap-5 sm:gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
              {[
                { Icon: Building2, t: "Pediu empréstimo no banco?", d: "Tratada como CLT sem registro ou MEI sem histórico." },
                { Icon: Key, t: "Tentou alugar consultório ou apartamento?", d: "Pediram 3 fiadores e contracheque que você não tem." },
                { Icon: CreditCard, t: "Pediu cartão com limite decente?", d: "Recusado. Sua renda em Pix não conta pro sistema." },
                { Icon: Car, t: "Quis financiar equipamento ou carro?", d: "Juros de quem o banco considera 'risco alto'." },
                { Icon: Plane, t: "Tentou tirar visto ou financiar imóvel?", d: "Pesadelo de declarações, contador caro, papelada infinita." },
                { Icon: BarChart3, t: "Pediu crédito pra abrir clínica?", d: "Exigiram garantia real. Sua história profissional não conta." },
              ].map((p) => (
                <motion.div key={p.t} variants={reveal} className="salb-card-light">
                  <span aria-hidden style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "#FEF7E6", marginBottom: 16 }}>
                    <p.Icon size={22} color="#D97706" />
                  </span>
                  <h3 style={{ color: C.bgLightInk, fontWeight: 700, fontSize: 17, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                    {p.t}
                  </h3>
                  <p style={{ color: C.bgLightMuted, fontSize: 14.5, lineHeight: 1.6, marginTop: 8 }}>
                    {p.d}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div initial={reveal.hidden} whileInView={reveal.show} viewport={{ once: true, margin: "-60px" }}
              className="text-center" style={{ marginTop: 48 }}>
              <p style={{ color: C.bgLightInk, fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, lineHeight: 1.4, maxWidth: 720, margin: "0 auto" }}>
                Você fatura todo mês via Pix e ainda assim é invisível pro banco.
                <br />
                <span style={{ color: C.teal }}>A SalbCare nasceu pra mudar isso.</span>
              </p>
              <div style={{ marginTop: 28 }}>
                <Link to="/register?source=landing-invisivel"
                  onClick={() => fireCta("register", "landing_invisivel", { source: "landing-invisivel" })}
                  className="salb-btn-outline-light">
                  Quero parar de ser invisível
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── 4. APRESENTANDO O SALBSCORE ── */}
        <section id="salbscore"
          style={{ background: `linear-gradient(135deg, ${C.bg} 0%, #0E2235 60%, rgba(0,180,160,0.10) 100%)`, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
          className={S.sectionY} aria-label="Apresentando o SalbScore">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
              className="text-center" style={{ marginBottom: 48 }}>
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.p variants={reveal} style={{ color: C.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 12 }}>
                O diferencial SalbCare
              </motion.p>
              <motion.h2 variants={reveal} className="salb-h" style={{ fontSize: "clamp(30px, 5vw, 48px)" }}>
                Apresentando o SalbScore
              </motion.h2>
              <motion.p variants={reveal}
                style={{ marginTop: 18, fontSize: "clamp(16px, 2vw, 19px)", color: C.text, opacity: 0.85, maxWidth: 660, marginInline: "auto", lineHeight: 1.55 }}>
                Sua identidade financeira de profissional de saúde, construída a cada paciente atendido.
              </motion.p>
            </motion.div>

            <motion.div initial={reveal.hidden} whileInView={reveal.show} viewport={{ once: true, margin: "-80px" }}
              className="grid gap-10 md:gap-14 md:grid-cols-2 items-center"
              style={{ background: C.card, border: `1px solid ${C.borderTeal}`, borderRadius: 24, padding: "clamp(28px, 4vw, 56px)" }}>

              {/* Score Ring animado */}
              <div className="flex justify-center">
                <div style={{ position: "relative", width: 280, height: 280 }} className="salb-score-glow">
                  <svg width="280" height="280" viewBox="0 0 220 220" aria-hidden>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={C.teal} />
                        <stop offset="100%" stopColor={C.gold} />
                      </linearGradient>
                    </defs>
                    <circle cx="110" cy="110" r="92" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
                    <circle cx="110" cy="110" r="92" fill="none"
                      stroke="url(#scoreGrad)" strokeWidth="14" strokeLinecap="round"
                      strokeDasharray="578" strokeDashoffset="578"
                      transform="rotate(-90 110 110)"
                      style={{ animation: "salbScoreRing 1.8s cubic-bezier(0.22,1,0.36,1) forwards", animationDelay: "0.2s" }} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "salbScoreNumber 0.8s 1.4s both" }}>
                    <span style={{ color: C.teal, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>SalbScore</span>
                    <span style={{ color: C.text, fontSize: 84, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>720</span>
                    <span style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginTop: 10, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                      Faixa Estabelecido
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 blocos */}
              <div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {[
                    { Icon: Hash, t: "Uma nota de 0 a 1000", d: "Calculada a partir do seu histórico real na plataforma: atendimentos, recebimentos via Pix, tempo de atuação e conformidade no conselho profissional." },
                    { Icon: FileText, t: "Documentos oficiais que você emite quando quiser", d: "Comprovante de Renda SalbCare, Declaração de Atividade Profissional e Selo Verificado Público — todos com QR Code de verificação." },
                    { Icon: Clock, t: "Quanto mais tempo na SalbCare, mais valiosa fica sua nota", d: "Cada mês de uso compõe seu histórico. Seu SalbScore é seu — e ninguém mais constrói por você." },
                  ].map((b) => (
                    <li key={b.t} style={{ display: "flex", gap: 14, padding: "16px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span aria-hidden style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: C.tealTint, flexShrink: 0 }}>
                        <b.Icon size={18} color={C.teal} />
                      </span>
                      <div>
                        <p style={{ color: C.text, fontWeight: 700, fontSize: 16, lineHeight: 1.35 }}>{b.t}</p>
                        <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.6, marginTop: 6 }}>{b.d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Card destacado navy */}
            <motion.div initial={reveal.hidden} whileInView={reveal.show} viewport={{ once: true, margin: "-60px" }}
              style={{ marginTop: 32, background: C.cardElev, border: `1px solid ${C.borderTeal}`, borderRadius: S.radius, padding: "28px 32px", textAlign: "center" }}>
              <p style={{ color: C.text, fontSize: "clamp(17px, 2.2vw, 22px)", fontWeight: 600, lineHeight: 1.5 }}>
                Você não tem contracheque. Mas tem algo melhor:
                <br />
                <span style={{ color: C.teal }}>histórico real, verificável, em PDF, com selo SalbCare.</span>
              </p>
            </motion.div>

            <div className="text-center" style={{ marginTop: 32 }}>
              <Link to="/register?source=landing-salbscore"
                onClick={() => fireCta("register", "landing_salbscore", { source: "landing-salbscore" })}
                className="salb-btn-primary"
                style={{ minHeight: 56, padding: "16px 32px" }}
                data-track="salbscore_cta_register">
                Construir meu SalbScore
                <ArrowRight size={18} />
              </Link>
              <p style={{ marginTop: 14 }}>
                <Link to="/salbscore?source=landing-salbscore-link"
                  onClick={() => fireCta("salbscore_link", "landing_salbscore", { source: "landing-salbscore-link" })}
                  className="salb-nav-link" style={{ fontSize: 13, textDecoration: "underline", textUnderlineOffset: 4 }}>
                  Entender como o SalbScore é calculado →
                </Link>
              </p>
            </div>

            <p style={{ color: C.textMuted, fontSize: 12, textAlign: "center", marginTop: 24, maxWidth: 640, marginInline: "auto", lineHeight: 1.5 }}>
              A SalbCare é uma plataforma de gestão e organização financeira. Não é instituição financeira.
              Os documentos refletem dados registrados pelo próprio profissional na plataforma.
            </p>
          </div>
        </section>

        {/* ── 5. O QUE VOCÊ EMITE COM SEU SALBSCORE ── */}
        <section style={{ background: C.bg }} className={S.sectionY} aria-label="Documentos do SalbScore">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
              className="text-center" style={{ marginBottom: 48 }}>
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2 variants={reveal} className="salb-h" style={{ fontSize: "clamp(28px, 4.5vw, 44px)" }}>
                3 documentos que mudam o jogo
              </motion.h2>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
              className="grid gap-5 md:grid-cols-3">
              {[
                { emoji: "📄", t: "Comprovante de Renda SalbCare", d: "PDF oficial com QR Code de verificação. Mostra média mensal de recebimentos comprovados pela plataforma. Pensado para imobiliárias e bancos parceiros." },
                { emoji: "🏆", t: "Certidão de Atividade Profissional", d: "Comprova tempo de atuação, volume mensal de atendimentos e conselho profissional ativo. Útil para credenciamento e parcerias." },
                { emoji: "⭐", t: "Selo Verificado Público", d: "Página pública com seu SalbScore e dados profissionais. URL única que você usa no Instagram, no consultório, na assinatura de e-mail." },
              ].map((doc) => (
                <motion.div key={doc.t} variants={reveal} className="salb-card flex flex-col" style={{ padding: 28 }}>
                  <span aria-hidden style={{ fontSize: 32, lineHeight: 1, marginBottom: 16 }}>{doc.emoji}</span>
                  <h3 style={{ color: C.text, fontWeight: 700, fontSize: 18, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                    {doc.t}
                  </h3>
                  <p style={{ color: C.textMuted, fontSize: 14.5, lineHeight: 1.6, marginTop: 10, flex: 1 }}>
                    {doc.d}
                  </p>
                  <p style={{ marginTop: 16, color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Em breve · Roadmap 2026
                  </p>
                </motion.div>
              ))}
            </motion.div>

            <p style={{ color: C.textMuted, fontSize: 13, textAlign: "center", marginTop: 28, maxWidth: 600, marginInline: "auto", lineHeight: 1.6 }}>
              Em desenvolvimento. Quem já constrói histórico hoje terá <strong style={{ color: C.text }}>prioridade no acesso</strong> quando os documentos forem liberados.
            </p>
          </div>
        </section>

        {/* ── 5b. SALBSCORE — IDENTIDADE FINANCEIRA ── */}
        <section id="salbscore-identidade" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }} className={S.sectionY} aria-label="SalbScore — sua identidade financeira">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="text-center mb-10">
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2 variants={reveal} className="salb-h" style={{ fontSize: "clamp(28px, 4.4vw, 44px)", maxWidth: 820, marginInline: "auto" }}>
                SalbScore™ — Sua identidade financeira como profissional de saúde
              </motion.h2>
              <motion.p variants={reveal} style={{ color: C.textMuted, fontSize: 16, lineHeight: 1.6, marginTop: 14, maxWidth: 680, marginInline: "auto" }}>
                O sistema financeiro brasileiro foi feito para CLT. O <strong style={{ color: C.text }}>SalbScore</strong> foi feito para você.
              </motion.p>
            </motion.div>

            {/* Problema */}
            <motion.ul initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-12" style={{ listStyle: "none", padding: 0 }}>
              {[
                "Banco nega crédito porque sua renda em Pix é “invisível”.",
                "Imobiliária exige contracheque que você não tem.",
                "Financeiras cobram juros abusivos por falta de histórico comprovado.",
              ].map((txt) => (
                <motion.li key={txt} variants={reveal}
                  style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: S.radius, padding: "16px 18px", color: C.text, fontSize: 14.5, lineHeight: 1.55 }}>
                  <span style={{ color: C.teal, fontWeight: 700, marginRight: 8 }}>•</span>{txt}
                </motion.li>
              ))}
            </motion.ul>

            {/* Solução: card de score + 3 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_1fr] gap-8 items-start">
              {/* Card de score visual estilo FICO */}
              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: S.radius, padding: 28, textAlign: "center" }}>
                <div style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}>SalbScore</div>
                <div style={{ marginTop: 10, fontSize: 64, fontWeight: 800, color: C.teal, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  742<span style={{ color: C.textMuted, fontSize: 18, fontWeight: 500, marginLeft: 6 }}>/ 1000</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 14, color: C.text, fontWeight: 600 }}>Faixa Estabelecido</div>
                {/* Barra 0-1000 */}
                <div style={{ marginTop: 18, height: 8, background: C.cardElev, borderRadius: 999, overflow: "hidden", position: "relative" }}>
                  <div style={{ width: "74.2%", height: "100%", background: C.teal, borderRadius: 999 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: C.textMuted }}>
                  <span>0</span><span>500</span><span>1000</span>
                </div>
                <div style={{ marginTop: 18, padding: "10px 12px", background: C.cardElev, borderRadius: 10, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                  Gerado automaticamente com seus dados da plataforma — quanto mais você usa, mais alto fica.
                </div>
              </motion.div>

              {/* 3 colunas de benefícios */}
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { t: "Comprovante de Renda Digital", d: "Substitui contracheque para aluguéis, financiamentos e vistos." },
                  { t: "Certidão de Atividade Profissional", d: "Comprova pacientes ativos, tempo de atuação e conformidade com CRM/CRP/CRN." },
                  { t: "Score de Crédito SalbCare", d: "Número verificável por parceiros financeiros via QR Code." },
                ].map((b) => (
                  <motion.div key={b.t} variants={reveal}
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: S.radius, padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ color: C.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>SalbScore</div>
                    <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, lineHeight: 1.35 }}>{b.t}</h3>
                    <p style={{ color: C.textMuted, fontSize: 13.5, lineHeight: 1.55 }}>{b.d}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <Link to="/cadastro" onClick={() => fireCta("quero_construir_meu_salbscore", "salbscore_identidade")}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.teal, color: "#ffffff", fontWeight: 700, fontSize: 15, padding: "14px 28px", borderRadius: 12, textDecoration: "none", transition: `background ${T.fast}` }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#00a08e")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = C.teal)}>
                Quero construir meu SalbScore →
              </Link>
            </div>
          </div>
        </section>

        {/* ── 6. DEPOIMENTOS ── */}
        <section style={{ background: C.card, borderTop: `1px solid ${C.border}` }} className={S.sectionY}>

          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
              className="text-center mb-14">
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2 variants={reveal} className="salb-h" style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>
                Profissionais que pararam de ser invisíveis
              </motion.h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { photo: testimonialSarah, name: "Dra. Sarah T.", role: "Médica", quote: "Finalmente uma plataforma que não fica com parte das minhas consultas." },
                { photo: testimonialMayara, name: "Vitória F.", role: "Dentista", quote: "Configurei tudo em uma tarde. Já recebi meus primeiros pacientes." },
                { photo: testimonialCinara, name: "Cinara C.", role: "Nutricionista", quote: "O Carnê-Leão sozinho já vale a assinatura inteira." },
              ].map((t, i) => (
                <motion.div key={t.name} initial={reveal.hidden} whileInView={reveal.show} viewport={{ once: true, margin: "-60px" }} transition={{ delay: i * 0.08 }}
                  className="flex flex-col gap-6"
                  style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: S.radius, padding: S.cardPad, transition: `border-color ${T.card}` }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = C.borderTealHover)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = C.border)}>
                  <p style={{ color: C.text, fontSize: 15, lineHeight: 1.65 }}>{t.quote}</p>
                  <div className="flex items-center gap-3 mt-auto">
                    <TestimonialAvatar src={t.photo} name={t.name} />
                    <div className="flex flex-col">
                      <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{t.name}</span>
                      <span style={{ color: C.textMuted, fontSize: 13 }}>{t.role}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <p style={{ marginTop: 32, color: C.textMuted, fontSize: 13.5, textAlign: "center", maxWidth: 620, marginInline: "auto", lineHeight: 1.6 }}>
              Em breve, depoimentos de quem já usou o Comprovante SalbCare pra alugar imóvel,
              conseguir cartão e financiar equipamento.
            </p>
          </div>
        </section>

        {/* ── 7. COMO FUNCIONA ── */}
        <section id="como-funciona" style={{ background: C.bg }} className={S.sectionY}>
          <div className="mx-auto max-w-5xl px-5 sm:px-6">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
              className="text-center mb-12">
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2 variants={reveal} className="salb-h" style={{ fontSize: "clamp(28px, 4.5vw, 44px)" }}>
                Em 3 passos você está dentro
              </motion.h2>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
              className="grid gap-5 md:grid-cols-3">
              {[
                { n: "1", t: "Cadastre-se e valide seu conselho profissional", d: "Em menos de 1 minuto. Validamos automaticamente seu CRM, CRP, CRN, CRO, CREFITO ou outro registro." },
                { n: "2", t: "Atenda seus pacientes pela plataforma", d: "Cada atendimento agendado, cada Pix recebido e cada paciente que retorna alimenta seu SalbScore. Você só precisa atender — a SalbCare cuida do resto." },
                { n: "3", t: "Use seu SalbScore quando precisar", d: "Visualize seu histórico organizado e prepare-se para emitir Comprovantes em PDF (em breve), com QR Code para garantir autenticidade." },
              ].map((s) => (
                <motion.div key={s.n} variants={reveal} className="salb-card flex flex-col" style={{ padding: S.cardPad }}>
                  <span style={{ width: 44, height: 44, borderRadius: 999, background: C.tealTint, border: `1px solid ${C.borderTeal}`,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    color: C.teal, fontWeight: 800, fontSize: 18, marginBottom: 18 }}>
                    {s.n}
                  </span>
                  <h3 style={{ color: C.text, fontWeight: 700, fontSize: 17, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                    {s.t}
                  </h3>
                  <p style={{ color: C.textMuted, fontSize: 14.5, lineHeight: 1.6, marginTop: 10 }}>
                    {s.d}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── 8. IA FINANCEIRA ── */}
        <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }} className={S.sectionY}>
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
              className="text-center mb-10">
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2 variants={reveal} className="salb-h" style={{ fontSize: "clamp(26px, 4vw, 40px)" }}>
                Por que sua IA SalbCare não é uma IA comum
              </motion.h2>
              <motion.p variants={reveal} style={{ marginTop: 16, fontSize: 16.5, color: C.textMuted, lineHeight: 1.65, maxWidth: 600, marginInline: "auto" }}>
                Ela conhece seus números. Seus pacientes. Seu regime tributário. Seu fluxo de caixa.
                Você pergunta no WhatsApp e ela responde com cálculo real, não palpite.
              </motion.p>
            </motion.div>

            {/* Mockup de WhatsApp */}
            <motion.div initial={reveal.hidden} whileInView={reveal.show} viewport={{ once: true, margin: "-60px" }}
              style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: S.radius, padding: 24 }}>
              <div className="flex flex-col gap-3">
                {/* Você */}
                <div className="flex justify-end">
                  <div style={{ background: "#005C4B", color: "#fff", borderRadius: "14px 14px 4px 14px", padding: "10px 14px", maxWidth: "85%", fontSize: 14.5, lineHeight: 1.5 }}>
                    Posso comprovar minha renda dos últimos 6 meses?
                  </div>
                </div>
                {/* IA */}
                <div className="flex justify-start">
                  <div style={{ background: C.cardElev, color: C.text, borderRadius: "14px 14px 14px 4px", padding: "12px 14px", maxWidth: "90%", fontSize: 14.5, lineHeight: 1.55, border: `1px solid ${C.borderTeal}` }}>
                    <p style={{ color: C.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>IA SalbCare</p>
                    Sim. Sua média de recebimentos foi <strong>R$ 14.320/mês</strong>, com 78 pacientes únicos atendidos.
                    Seu SalbScore atual é <strong style={{ color: C.teal }}>720 (faixa Estabelecido)</strong>.
                    Quer que eu prepare o relatório agora?
                  </div>
                </div>
                {/* Você */}
                <div className="flex justify-end">
                  <div style={{ background: "#005C4B", color: "#fff", borderRadius: "14px 14px 4px 14px", padding: "10px 14px", fontSize: 14.5 }}>
                    Sim, por favor.
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.p initial={reveal.hidden} whileInView={reveal.show} viewport={{ once: true, margin: "-60px" }}
              style={{ marginTop: 24, color: C.text, fontSize: 16, fontWeight: 600, textAlign: "center", lineHeight: 1.55 }}>
              Diferente do ChatGPT, ela não responde no genérico.
              <br />
              <span style={{ color: C.teal }}>Ela responde sobre você.</span>
            </motion.p>
          </div>
        </section>

        {/* ── 9. PLANOS ── */}
        <section id="planos" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }} className={S.sectionY}>
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
              className="text-center" style={{ marginBottom: 40 }}>
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2 variants={reveal} className="salb-h" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>
                Escolha o plano que combina com seu momento
              </motion.h2>
              <motion.p variants={reveal} className="salb-sub mx-auto" style={{ fontSize: 16, maxWidth: 540, marginTop: 16 }}>
                Comece grátis. Faça upgrade quando quiser. Sem fidelidade, sem comissão.
              </motion.p>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  name: "Grátis", price: "R$ 0", cadence: "para começar",
                  desc: "Pra quem está conhecendo a plataforma.",
                  features: ["Até 10 pacientes", "Agenda + Prontuário básico", "Vitrine pública", "Construção do seu histórico SalbScore"],
                  cta: "Criar conta grátis", to: "/register?source=landing-planos-free", variant: "outline" as const, plan: "free",
                },
                {
                  name: "Essencial", price: "R$ 89", cadence: "por mês",
                  desc: "Pra quem quer crescer com gestão completa.",
                  features: ["Pacientes ilimitados", "Teleconsulta integrada", "Receita e Atestado Digital", "Controle financeiro completo", "IA Mentora financeira no WhatsApp", "Histórico SalbScore com insights mensais"],
                  cta: "Assinar Essencial", to: "/checkout?plan=basic&source=landing-planos-essencial", variant: "primary" as const, popular: true, plan: "essencial",
                },
                {
                  name: "Premium", price: "Em breve", cadence: "lista de espera",
                  desc: "Comprovante de Renda, Certidão e Selo Verificado.",
                  features: ["Tudo do Essencial", "Comprovante de Renda SalbCare ilimitado", "Certidão de Atividade Profissional", "Selo Verificado Público com QR Code", "Prioridade no diretório de profissionais"],
                  cta: "Entrar na lista", to: "/parcerias?source=landing-planos-premium", variant: "outline" as const, plan: "premium",
                },
              ].map((plan, i) => (
                <motion.div key={plan.name}
                  initial={reveal.hidden} whileInView={reveal.show} viewport={{ once: true, margin: "-60px" }} transition={{ delay: i * 0.08 }}
                  className="salb-card flex flex-col"
                  style={{ padding: 28, position: "relative",
                    ...(plan.popular ? { borderColor: C.teal, background: C.cardElev, boxShadow: `0 0 0 1px ${C.teal}, 0 20px 60px -20px ${C.teal}55` } : {}) }}>
                  {plan.popular && (
                    <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                      background: C.teal, color: C.tealOnDark, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", padding: "4px 12px", borderRadius: 999 }}>
                      Mais escolhido
                    </span>
                  )}

                  <p style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{plan.name}</p>
                  <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ color: C.text, fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em" }}>{plan.price}</span>
                    <span style={{ color: C.textMuted, fontSize: 13 }}>{plan.cadence}</span>
                  </div>
                  <p style={{ color: C.textMuted, fontSize: 14, marginTop: 10, lineHeight: 1.5 }}>{plan.desc}</p>

                  <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 24px", flex: 1 }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ color: C.text, fontSize: 14, lineHeight: 1.5, padding: "7px 0", display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span aria-hidden style={{ flexShrink: 0, width: 16, height: 16, borderRadius: 999,
                          background: C.tealTint, border: `1px solid ${C.borderTeal}`, color: C.teal,
                          fontSize: 10, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                          ✓
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to={plan.to}
                    onClick={() => fireCta(`plano_${plan.plan}`, "landing_planos", { plan: plan.plan, source: `landing-planos-${plan.plan}` })}
                    className={plan.variant === "primary" ? "salb-btn-primary" : "salb-btn-outline"}
                    style={{ width: "100%", minHeight: 48,
                      ...(plan.variant === "primary" ? { padding: "14px 20px", fontSize: 15 } : { padding: "12px 20px", fontSize: 14 }) }}
                    data-track={`planos_cta_${plan.plan}`}>
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </div>

            <p style={{ color: C.textMuted, fontSize: 13, textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
              7 dias grátis · Sem cartão no cadastro · Cancele quando quiser · 100% das suas consultas continuam suas
            </p>
          </div>
        </section>

        {/* ── 10. A REALIDADE — Antes vs Depois ── */}
        <section style={{ background: C.cardElev, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }} className={S.sectionY}>
          <div className="mx-auto max-w-5xl px-5 sm:px-6">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
              className="text-center mb-12">
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2 variants={reveal} className="salb-h" style={{ fontSize: "clamp(28px, 4.5vw, 44px)" }}>
                Você cuida de pessoas.
                <br />
                Mas quem cuida do seu negócio?
              </motion.h2>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* ANTES */}
              <motion.div initial={reveal.hidden} whileInView={reveal.show} viewport={{ once: true, margin: "-60px" }}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: S.radius, padding: 28 }}>
                <p style={{ color: "#F87171", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 18 }}>
                  Sem SalbCare
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {[
                    "Renda invisível pro banco",
                    "Sem comprovante pra alugar imóvel",
                    "Cartão recusado, limite ridículo",
                    "Imposto pago no escuro",
                    "Agenda no WhatsApp e caderno",
                    "Trabalhar muito, não conseguir provar",
                  ].map((item) => (
                    <li key={item} style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.5, padding: "9px 0", display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span aria-hidden style={{ color: "#F87171", fontWeight: 800, fontSize: 16, marginTop: -1 }}>✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* DEPOIS */}
              <motion.div initial={reveal.hidden} whileInView={reveal.show} viewport={{ once: true, margin: "-60px" }} transition={{ delay: 0.1 }}
                style={{ background: C.card, border: `1px solid ${C.borderTeal}`, borderRadius: S.radius, padding: 28, boxShadow: `0 0 0 1px ${C.teal}33` }}>
                <p style={{ color: C.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 18 }}>
                  Com SalbCare
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {[
                    "SalbScore que te torna visível",
                    "Comprovante de Renda Oficial em PDF (em breve)",
                    "Histórico financeiro construído mês a mês",
                    "IA que mostra clareza dos seus números",
                    "Agenda profissional automática",
                    "Sua história profissional reconhecida",
                  ].map((item) => (
                    <li key={item} style={{ color: C.text, fontSize: 15, lineHeight: 1.5, padding: "9px 0", display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span aria-hidden style={{ color: C.teal, fontWeight: 800, fontSize: 16, marginTop: -1 }}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <div className="text-center" style={{ marginTop: 32 }}>
              <Link to="/register?source=landing-realidade"
                onClick={() => fireCta("register", "landing_realidade", { source: "landing-realidade" })}
                className="salb-btn-primary"
                style={{ minHeight: 56, padding: "16px 32px" }}>
                Quero ser visível
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── 11. FAQ ── */}
        <section style={{ background: C.bg }} className={S.sectionYTight}>
          <div className="mx-auto max-w-2xl px-5 sm:px-6">
            <motion.h2 initial={reveal.hidden} whileInView={reveal.show} viewport={{ once: true, margin: "-60px" }}
              className="salb-h text-center mb-12" style={{ fontSize: "clamp(26px, 3.5vw, 38px)" }}>
              Perguntas frequentes
            </motion.h2>
            <Accordion type="single" collapsible className="space-y-3"
              onValueChange={(v) => v && trackUnified("faq_open", { question_id: v, location: "landing_faq" })}>
              {[
                { q: "O Comprovante de Renda SalbCare substitui contracheque?", a: "Para a maioria das finalidades (aluguel, parcelamentos, comprovação geral), sim. Para finalidades específicas como financiamento imobiliário ou processos formais, recomendamos apresentar junto com declaração contábil — nosso contador parceiro emite ambos. O Comprovante está em desenvolvimento e entra em produção no roadmap 2026." },
                { q: "Em quanto tempo meu SalbScore fica relevante?", a: "Em 30 dias de uso ativo seu histórico já fica consistente. Em 6 meses, atinge faixa Estabelecido. Em 12 meses, a maioria dos profissionais alcança faixa Premium. Cinco ações já alimentam seu histórico hoje: cadastrar seu conselho, marcar consultas, lançar recebimentos, confirmar atendimentos e atualizar despesas." },
                { q: "E se eu já tenho contador?", a: "A SalbCare complementa o contador. Contador faz IRPF e impostos. SalbCare constrói seu histórico financeiro profissional verificável em PDF — algo que contador comum não emite." },
                { q: "Funciona para MEI, autônomo PF, Simples Nacional?", a: "Funciona para todos os regimes. A IA detecta o seu e calcula tudo de forma adequada." },
                { q: "E se eu cancelar? Perco meu SalbScore?", a: "Seu histórico fica salvo. Reativando, você continua de onde parou. Comprovantes oficiais serão emitidos com plano Premium ativo, quando o módulo entrar no ar." },
                { q: "Meus dados estão seguros?", a: "Sim. 100% LGPD. Criptografia em repouso, RLS no banco, auditoria de acesso. Você pode pedir exclusão total a qualquer momento." },
              ].map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="salb-faq-item">
                  <AccordionTrigger className="text-left hover:no-underline py-4" style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4" style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.65 }}>
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ── 12. CTA FINAL ── */}
        <section style={{ background: `linear-gradient(135deg, ${C.bg} 0%, ${C.cardElev} 50%, ${C.teal} 220%)`, borderTop: `1px solid ${C.borderTeal}` }} className={S.sectionY}>
          <div className="mx-auto max-w-4xl px-5 sm:px-6">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger}
              style={{ background: `linear-gradient(135deg, ${C.cardElev} 0%, rgba(0,180,160,0.18) 100%)`,
                border: `1px solid ${C.borderTeal}`, borderRadius: 24, padding: "clamp(36px, 6vw, 64px)", textAlign: "center" }}>
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2 variants={reveal} className="salb-h" style={{ fontSize: "clamp(28px, 4.5vw, 44px)" }}>
                Você não precisa de contracheque pra ser reconhecida.
              </motion.h2>
              <motion.p variants={reveal}
                style={{ marginTop: 18, color: C.text, opacity: 0.85, fontSize: "clamp(16px, 2.2vw, 20px)", lineHeight: 1.55, maxWidth: 620, marginInline: "auto" }}>
                Você precisa de uma plataforma que enxergue o que você constrói.
                <br />
                <strong style={{ color: C.teal, opacity: 1 }}>A SalbCare enxerga.</strong>
              </motion.p>
              <motion.div variants={reveal} className="mt-10 flex flex-col items-center" style={{ gap: 12 }}>
                <Link to="/register?source=landing-cta-final"
                  onClick={() => fireCta("register", "landing_cta_final", { source: "landing-cta-final" })}
                  style={{ background: "#fff", color: C.bgLightInk, borderRadius: S.radiusBtn, padding: "18px 36px",
                    fontSize: 16, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 10,
                    minHeight: 56, transition: `transform ${T.fast}` }}
                  data-track="cta_final_register">
                  Começar agora — 7 dias grátis
                  <ArrowRight size={18} />
                </Link>
                <p style={{ color: C.text, opacity: 0.7, fontSize: 13 }}>
                  Sem cartão · Sem fidelidade · Suporte humano em português
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ background: C.bg, borderTop: `1px solid ${C.border}` }} className="py-12">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex items-center gap-2">
                <Shield size={16} color={C.teal} strokeWidth={2.4} />
                <span style={{ fontWeight: 800, color: C.text, letterSpacing: "-0.02em", fontSize: 15 }}>SalbCare</span>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                <Link to="/salbscore" className="salb-nav-link">SalbScore</Link>
                <Link to="/terms" className="salb-nav-link">Termos</Link>
                <Link to="/privacy" className="salb-nav-link">Privacidade</Link>
                <Link to="/planos" className="salb-nav-link">Planos</Link>
                <Link to="/para-profissionais" className="salb-nav-link">Para Profissionais</Link>
                <Link to="/blog" className="salb-nav-link">Blog</Link>
              </div>
              <p style={{ color: C.textMuted, fontSize: 13 }}>
                © {new Date().getFullYear()} SalbCare. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
