import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Menu, X,
  FileText, Search, Video,
  UserPlus, Globe, LayoutDashboard, Shield,
  type LucideIcon,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import SEOHead from "@/components/SEOHead";
import { trackCtaClick } from "@/hooks/useTracking";
import { useState } from "react";
import testimonialSarah from "@/assets/testimonial-sarah.jpeg";
import testimonialMayara from "@/assets/testimonial-mayara.jpeg";
import testimonialCinara from "@/assets/testimonial-cinara.jpeg";


/* ─────────────────────────────────────────────
 * DESIGN TOKENS — única fonte de verdade
 * Contraste validado AA sobre C.bg #0B1623:
 *   text  #F4F7FB → 16.4:1 (AAA)
 *   muted #94A3B8 →  7.0:1 (AAA p/ texto normal)
 *   teal  #00B4A0 →  4.8:1 (AA p/ texto normal)
 * ───────────────────────────────────────────── */
const C = {
  bg: "#0B1623",
  card: "#111E2D",
  cardElev: "#172538",
  cardHover: "#141F30",
  teal: "#00B4A0",
  tealHover: "#00D4BE",
  tealOnDark: "#0B1623",          // texto sobre teal (mais sofisticado que branco puro)
  text: "#F4F7FB",                // ↑ contraste vs #F0F4F8
  textMuted: "#94A3B8",           // ↑ contraste vs #7A8FA6 (passa AA)
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  borderTeal: "rgba(0,180,160,0.28)",
  borderTealHover: "rgba(0,180,160,0.45)",
  tealTint: "rgba(0,180,160,0.12)",
  navBg: "rgba(11,22,35,0.85)",
} as const;

const S = {
  // Espaçamentos verticais consistentes
  sectionY: "py-20 sm:py-28",
  sectionYTight: "py-16 sm:py-20",
  cardPad: 28,
  cardPadLg: 32,
  radius: 16,
  radiusBtn: 10,
  radiusSmBtn: 8,
} as const;

const T = {
  // Transitions canônicas — apenas 3 durações no projeto
  fast: "150ms ease",
  card: "200ms ease",
} as const;

/* Scroll reveal — único preset, sem bounce/spring */
const reveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const Mark = () => (
  <span
    aria-hidden
    style={{
      display: "block",
      width: 48, height: 2,
      borderRadius: 2,
      background: C.teal,
      margin: "0 auto 24px",
    }}
  />
);

/* Helper para evitar `<items[i].icon />` (TS) */
const IconRender = ({ icon: I, size = 20 }: { icon: LucideIcon; size?: number }) => (
  <I size={size} color={C.teal} />
);

/* Iniciais p/ fallback de avatar */
const initialsOf = (name: string) =>
  name
    .replace(/^Dra?\.?\s+/i, "")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const TestimonialAvatar = ({ src, name }: { src: string; name: string }) => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div
      style={{
        position: "relative",
        width: 56,
        height: 56,
        borderRadius: "9999px",
        border: `2px solid ${C.teal}`,
        background: C.cardElev,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Skeleton circular pulsante — visível enquanto loading */}
      {status === "loading" && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "9999px",
            background: `linear-gradient(90deg, ${C.cardElev} 0%, ${C.cardHover} 50%, ${C.cardElev} 100%)`,
            backgroundSize: "200% 100%",
            animation: "salbShimmer 1.4s ease-in-out infinite",
          }}
        />
      )}

      {/* Imagem real — só aparece com fade quando carregada */}
      {status !== "error" && (
        <img
          src={src}
          alt={`Foto de ${name}`}
          loading="lazy"
          decoding="async"
          width={56}
          height={56}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            borderRadius: "9999px",
            opacity: status === "loaded" ? 1 : 0,
            transition: "opacity 220ms ease",
          }}
        />
      )}

      {/* Fallback de iniciais — só se imagem falhar de verdade */}
      {status === "error" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.teal,
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.02em",
            background: C.cardElev,
            borderRadius: "9999px",
          }}
        >
          {initialsOf(name)}
        </div>
      )}
    </div>
  );
};

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <SEOHead
        title="SalbCare | Gestão e Saúde"
        description="Consultório digital para profissionais de saúde autônomos. Agenda, prontuário, teleconsulta e mentoria financeira. Sem comissão. Cancele quando quiser."
        canonical="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "SalbCare",
          url: "https://salbcare.com.br",
          description: "Consultório digital para profissionais de saúde. Sem comissão.",
          applicationCategory: "HealthApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "89", priceCurrency: "BRL" },
        }}
      />

      <style>{`
        .salb-h { font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; color: ${C.text}; }
        .salb-sub { font-weight: 400; line-height: 1.65; color: ${C.textMuted}; }

        .salb-nav-link {
          color: ${C.textMuted};
          font-weight: 500;
          transition: color ${T.fast};
        }
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
          border-color: ${C.teal};
          background: ${C.tealTint};
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
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
          transition: background ${T.fast};
        }
        .salb-btn-primary-sm:hover, .salb-btn-primary-sm:focus-visible { background: ${C.tealHover}; }

        .salb-card {
          background: ${C.card};
          border: 1px solid ${C.border};
          border-radius: ${S.radius}px;
          padding: ${S.cardPadLg}px;
          transition: border-color ${T.card}, background ${T.card};
        }
        .salb-card:hover { border-color: ${C.borderTealHover}; background: ${C.cardHover}; }

        .salb-icon-box {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: ${C.tealTint};
          border: 1px solid ${C.borderTeal};
          display: inline-flex; align-items: center; justify-content: center;
          color: ${C.teal};
        }

        .salb-divider-v { background: ${C.border}; width: 1px; align-self: stretch; }

        .salb-grid-bg {
          background-color: ${C.bg};
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 79px,
            rgba(255,255,255,0.018) 79px,
            rgba(255,255,255,0.018) 80px
          );
        }

        .salb-faq-item {
          background: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 12px;
          padding: 0 20px;
          transition: border-color ${T.card};
        }
        .salb-faq-item[data-state="open"] { border-color: ${C.borderTeal}; }

        /* Modo alto contraste — reforça bordas e texto */
        @media (prefers-contrast: more) {
          .salb-card,
          .salb-faq-item { border-color: ${C.borderStrong}; }
          .salb-nav-link { color: ${C.text}; }
          .salb-btn-outline { border-color: ${C.teal}; }
        }

        /* Respeita reduced-motion — desabilita transitions */
        @media (prefers-reduced-motion: reduce) {
          .salb-nav-link,
          .salb-btn-outline,
          .salb-btn-primary,
          .salb-btn-primary-sm,
          .salb-card,
          .salb-faq-item { transition: none !important; }
        }

        /* SalbScore ring fill animation (0 → 720 ≈ 80% of 578) */
        @keyframes salbScoreRing {
          to { stroke-dashoffset: 116; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes salbScoreRing { to { stroke-dashoffset: 116; } }
        }

        /* Plan card popular badge pulse */
        .salb-plan-popular {
          position: relative;
          border-color: ${C.teal} !important;
          background: ${C.cardElev} !important;
          box-shadow: 0 0 0 1px ${C.teal}, 0 20px 60px -20px ${C.teal}55;
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
        {/* ── Navbar ── */}
        <nav
          style={{
            position: "sticky", top: 0, zIndex: 100,
            background: C.navBg,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-2">
              <Shield size={20} color={C.teal} strokeWidth={2.4} />
              <span style={{ fontWeight: 800, color: C.text, letterSpacing: "-0.02em", fontSize: 17 }}>
                SalbCare
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/para-profissionais" className="salb-nav-link text-sm">Para Profissionais</Link>
              <Link to="/planos" className="salb-nav-link text-sm">Planos</Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="salb-btn-outline">Já tenho conta</Link>
              <Link to="/register?source=landing-nav" className="salb-btn-primary-sm">Começar grátis</Link>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
              style={{ color: C.text, background: "transparent" }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden px-4 py-4 space-y-3"
              style={{ borderTop: `1px solid ${C.border}`, background: C.bg }}
            >
              <Link to="/para-profissionais" onClick={() => setMobileMenuOpen(false)} className="salb-nav-link block text-sm">Para Profissionais</Link>
              <Link to="/planos" onClick={() => setMobileMenuOpen(false)} className="salb-nav-link block text-sm">Planos</Link>
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="salb-btn-outline">Já tenho conta</Link>
                <Link to="/register?source=landing-nav" onClick={() => setMobileMenuOpen(false)} className="salb-btn-primary-sm">Começar grátis</Link>
              </div>
            </motion.div>
          )}
        </nav>

        {/* ── Hero ── */}
        <section className="salb-grid-bg">
          <div className="mx-auto max-w-5xl px-5 sm:px-6 pt-16 pb-16 sm:pt-28 sm:pb-24">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="text-center max-w-3xl mx-auto"
            >
              <motion.div variants={reveal}><Mark /></motion.div>

              <motion.h1
                variants={reveal}
                className="salb-h"
                style={{ fontSize: "clamp(36px, 7vw, 64px)" }}
              >
                Sua <span style={{ color: C.teal }}>vitrine</span> para pacientes.
                <br />
                Seu <span style={{ color: C.teal }}>controle</span> para gestão.
              </motion.h1>

              <motion.p
                variants={reveal}
                style={{
                  fontSize: "clamp(16px, 2.2vw, 20px)",
                  maxWidth: 620,
                  margin: "24px auto 0",
                  paddingInline: 8,
                  color: C.text,
                  opacity: 0.85,
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                A plataforma que organiza sua renda de profissional autônomo da saúde
                e prepara o caminho pro seu <strong style={{ color: C.teal, opacity: 1 }}>SalbScore</strong> —
                o histórico financeiro que vai te abrir portas em imobiliárias, bancos e consulados.
              </motion.p>

              <motion.ul
                variants={reveal}
                className="flex flex-wrap items-center justify-center"
                style={{ gap: "10px 18px", marginTop: 24, listStyle: "none", padding: 0 }}
              >
                {[
                  "100% das consultas no seu bolso",
                  "IA financeira no WhatsApp",
                  "Construa seu SalbScore",
                ].map((b) => (
                  <li
                    key={b}
                    style={{
                      color: C.text,
                      fontSize: 13,
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: C.tealTint,
                      border: `1px solid ${C.borderTeal}`,
                      borderRadius: 999,
                      padding: "6px 12px",
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: 999, background: C.teal }} />
                    {b}
                  </li>
                ))}
              </motion.ul>

              <motion.div
                variants={reveal}
                className="flex flex-col items-center"
                style={{ marginTop: 32, gap: 12 }}
              >
                <Link
                  to="/register?source=landing-hero"
                  onClick={() => trackCtaClick("register", "landing_hero")}
                  className="salb-btn-primary"
                  style={{ minHeight: 56, padding: "16px 36px", fontSize: 16, width: "100%", maxWidth: 340 }}
                  data-track="hero_cta_register"
                >
                  Começar grátis
                  <ArrowRight size={18} />
                </Link>
                <p style={{ color: C.textMuted, fontSize: 13 }}>
                  Sem cartão de crédito · Cancele quando quiser
                </p>
                <Link
                  to="/login"
                  className="salb-nav-link"
                  style={{ fontSize: 13, marginTop: 4, textDecoration: "underline", textUnderlineOffset: 4 }}
                >
                  Já tenho conta · Fazer login
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Callout proposta de valor (frase âncora SalbScore) ── */}
        <section style={{ background: C.bg }} aria-label="Proposta de valor SalbCare">
          <div className="mx-auto max-w-3xl px-5 sm:px-6 pt-8 pb-2 sm:pt-10 sm:pb-4">
            <motion.p
              initial={reveal.hidden}
              whileInView={reveal.show}
              viewport={{ once: true, margin: "-40px" }}
              className="salb-h"
              style={{
                color: C.text,
                fontSize: "clamp(18px, 2.4vw, 24px)",
                lineHeight: 1.4,
                fontWeight: 600,
                textAlign: "center",
                borderLeft: `3px solid ${C.teal}`,
                paddingLeft: 16,
              }}
            >
              A SalbCare é a primeira plataforma que prova que profissional autônomo da saúde também tem renda, e gera os documentos pra você comprovar isso pro mundo.
            </motion.p>
          </div>
        </section>

        {/* ── SalbScore Hero (diferencial visual) ── */}
        <section
          id="salbscore"
          style={{
            background: `linear-gradient(135deg, ${C.bg} 0%, #0E2235 60%, rgba(0,180,160,0.12) 100%)`,
            borderTop: `1px solid ${C.border}`,
            borderBottom: `1px solid ${C.border}`,
          }}
          className={S.sectionY}
          aria-label="SalbScore — diferencial da SalbCare"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
              className="text-center"
              style={{ marginBottom: 40 }}
            >
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.p
                variants={reveal}
                style={{
                  color: C.teal, fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 12,
                }}
              >
                O diferencial SalbCare
              </motion.p>
              <motion.h2
                variants={reveal}
                className="salb-h"
                style={{ fontSize: "clamp(28px, 4.5vw, 44px)" }}
              >
                O que existe na SalbCare
                <br />
                e em mais lugar nenhum.
              </motion.h2>
            </motion.div>

            <motion.div
              initial={reveal.hidden}
              whileInView={reveal.show}
              viewport={{ once: true, margin: "-60px" }}
              className="grid gap-8 sm:gap-10 items-center"
              style={{
                gridTemplateColumns: "1fr",
                background: C.card,
                border: `1px solid ${C.borderTeal}`,
                borderRadius: 24,
                padding: "clamp(24px, 4vw, 48px)",
              }}
            >
              <div className="grid gap-10 md:gap-14" style={{ gridTemplateColumns: "1fr", alignItems: "center" }}>
                <div className="grid gap-10 md:gap-14 md:grid-cols-[auto_1fr]" style={{ alignItems: "center" }}>
                  {/* Score Ring */}
                  <div className="flex justify-center">
                    <div
                      style={{
                        position: "relative",
                        width: 220,
                        height: 220,
                      }}
                    >
                      <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden="true">
                        <circle
                          cx="110" cy="110" r="92"
                          fill="none"
                          stroke="rgba(255,255,255,0.06)"
                          strokeWidth="14"
                        />
                        <circle
                          cx="110" cy="110" r="92"
                          fill="none"
                          stroke={C.teal}
                          strokeWidth="14"
                          strokeLinecap="round"
                          strokeDasharray="578"
                          strokeDashoffset="578"
                          transform="rotate(-90 110 110)"
                          style={{
                            animation: "salbScoreRing 1.6s cubic-bezier(0.22,1,0.36,1) forwards",
                            animationDelay: "0.2s",
                            filter: `drop-shadow(0 0 12px ${C.teal}55)`,
                          }}
                        />
                      </svg>
                      <div
                        style={{
                          position: "absolute", inset: 0,
                          display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <span style={{
                          color: C.teal, fontSize: 11, fontWeight: 700,
                          letterSpacing: "0.16em", textTransform: "uppercase",
                        }}>
                          SalbScore
                        </span>
                        <span style={{
                          color: C.text, fontSize: 56, fontWeight: 800,
                          letterSpacing: "-0.04em", lineHeight: 1, marginTop: 4,
                        }}>
                          720
                        </span>
                        <span style={{ color: C.textMuted, fontSize: 12, marginTop: 6 }}>
                          Estabelecido
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bullets */}
                  <div>
                    <h3
                      className="salb-h"
                      style={{ fontSize: "clamp(22px, 3vw, 30px)", marginBottom: 18 }}
                    >
                      SalbScore — sua nota de saúde financeira profissional.
                    </h3>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {[
                        {
                          t: "Comprovante de Renda em construção",
                          d: "Plataforma já organiza seus atendimentos e recebimentos. Geração de comprovantes oficiais para imobiliárias e bancos está em rollout.",
                        },
                        {
                          t: "Selo Verificado Público",
                          d: "Use no Instagram, no consultório, no WhatsApp. Pacientes veem que você é profissional ativo na SalbCare.",
                        },
                        {
                          t: "Pontuação que sobe com o tempo",
                          d: "Quanto mais você usa — atendimentos, recebimentos, organização — mais valioso fica seu histórico financeiro.",
                        },
                      ].map((b) => (
                        <li
                          key={b.t}
                          style={{
                            display: "flex",
                            gap: 14,
                            padding: "14px 0",
                            borderBottom: `1px solid ${C.border}`,
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              flexShrink: 0,
                              width: 8, height: 8,
                              borderRadius: 999,
                              background: C.teal,
                              marginTop: 8,
                              boxShadow: `0 0 0 4px ${C.tealTint}`,
                            }}
                          />
                          <div>
                            <p style={{ color: C.text, fontWeight: 600, fontSize: 15, lineHeight: 1.4 }}>
                              {b.t}
                            </p>
                            <p style={{ color: C.textMuted, fontSize: 13.5, lineHeight: 1.55, marginTop: 4 }}>
                              {b.d}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/salbscore"
                      className="inline-flex items-center gap-1.5"
                      style={{
                        color: C.teal, fontSize: 14, fontWeight: 600,
                        marginTop: 18, textDecoration: "none",
                      }}
                    >
                      Entender como o SalbScore funciona
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

            <p
              style={{
                color: C.textMuted, fontSize: 12, textAlign: "center",
                marginTop: 16, maxWidth: 640, marginInline: "auto", lineHeight: 1.5,
              }}
            >
              A SalbCare é uma plataforma de gestão e organização financeira. Não é instituição
              financeira. Comprovantes refletem dados registrados pelo próprio profissional.
            </p>
          </div>
        </section>

        {/* ── Feature Strip ── */}
        <section
          style={{
            background: C.card,
            borderTop: `1px solid ${C.border}`,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row items-stretch gap-6 sm:gap-0">
              {[
                { icon: FileText, title: "Carnê-Leão automático", sub: "Preenchimento contínuo do mês" },
                { icon: Search, title: "Pacientes te encontram", sub: "Diretório público sem comissão" },
                { icon: Video, title: "Teleconsulta legal", sub: "Integrada ao Google Meet" },
              ].map((f, i, arr) => (
                <div key={f.title} className="flex items-stretch flex-1">
                  <div className="flex items-start gap-3 flex-1 sm:px-6">
                    <f.icon size={20} color={C.teal} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{f.title}</p>
                      <p style={{ color: C.textMuted, fontSize: 13, marginTop: 2 }}>{f.sub}</p>
                    </div>
                  </div>
                  {i < arr.length - 1 && <div className="hidden sm:block salb-divider-v" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── IA Mentora preview ── */}
        <section style={{ background: C.bg }} className={S.sectionY}>
          <div className="mx-auto max-w-2xl px-5 sm:px-6">
            <motion.div
              initial={reveal.hidden}
              whileInView={reveal.show}
              viewport={{ once: true, margin: "-80px" }}
            >
              <p style={{
                color: C.teal, fontSize: 11, fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16,
              }}>
                IA Mentora em ação
              </p>
              <div className="salb-card" style={{ padding: 24 }}>
                <div className="flex gap-3 items-start">
                  <span
                    className="salb-icon-box"
                    style={{ width: 32, height: 32, fontSize: 11 }}
                  >
                    <span style={{ color: C.teal, fontSize: 11, fontWeight: 700 }}>IA</span>
                  </span>
                  <p style={{ color: C.text, fontSize: 15, lineHeight: 1.6, flex: 1 }}>
                    Você teve mais consultas esse mês! Quer que eu mostre onde investir o dinheiro extra para lucrar ainda mais?
                  </p>
                </div>
                <div className="flex justify-end mt-3">
                  <p style={{
                    color: C.tealOnDark, background: C.teal,
                    fontSize: 14, fontWeight: 600,
                    padding: "8px 14px", borderRadius: 10,
                  }}>
                    Sim, me mostre
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section
          style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
          className="py-12"
        >
          <div className="mx-auto max-w-4xl px-5 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { value: "9+", label: "especialidades" },
              { value: "100%", label: "Você fica com 100% do valor. Sem comissão." },
              { value: "Grátis", label: "para começar, sem cartão" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={reveal.hidden}
                whileInView={reveal.show}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.08 }}
              >
                <p style={{
                  fontSize: "clamp(32px, 4vw, 44px)",
                  fontWeight: 800, color: C.teal, letterSpacing: "-0.03em",
                }}>
                  {s.value}
                </p>
                <p style={{ color: C.textMuted, fontSize: 14, marginTop: 6 }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Como Funciona — assimetria mantida em todas as larguras ── */}
        <section id="como-funciona" style={{ background: C.bg }} className={S.sectionY}>
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
              className="text-center mb-14"
            >
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2 variants={reveal} className="salb-h" style={{ fontSize: "clamp(30px, 4.5vw, 48px)" }}>
                Como funciona
              </motion.h2>
            </motion.div>

            {(() => {
              const items = [
                { step: "1", icon: UserPlus, title: "Cadastre seus dados de forma prática", desc: "Tenha todo o seu diagnóstico financeiro na palma da mão" },
                { step: "2", icon: Globe, title: "Pacientes te encontram", desc: "Seu perfil aparece no diretório público da SalbCare sem custo por lead" },
                { step: "3", icon: LayoutDashboard, title: "Gerencie tudo em um lugar", desc: "Agenda, prontuário, receitas e financeiro na mesma plataforma" },
              ];

              return (
                /* grid 3 colunas em TODAS as larguras (asymmetry preserved):
                   item1 = 2 cols (wide), item2 = 1 col (narrow),
                   item3 = 1 col (narrow), highlight = 2 cols (wide) */
                <div
                  className="grid gap-4 sm:gap-5"
                  style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
                >
                  {/* Item 1 — wide */}
                  <motion.div
                    initial={reveal.hidden}
                    whileInView={reveal.show}
                    viewport={{ once: true, margin: "-60px" }}
                    className="salb-card"
                    style={{ gridColumn: "span 2", padding: S.cardPad }}
                  >
                    <div className="flex items-center gap-3" style={{ marginBottom: 18 }}>
                      <span className="salb-icon-box"><IconRender icon={items[0].icon} /></span>
                      <span style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em" }}>
                        PASSO {items[0].step}
                      </span>
                    </div>
                    <h3 style={{
                      color: C.text, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.02em",
                      fontSize: "clamp(15px, 2.4vw, 22px)",
                    }}>
                      {items[0].title}
                    </h3>
                    <p style={{
                      color: C.textMuted, lineHeight: 1.6, marginTop: 10, maxWidth: 420,
                      fontSize: "clamp(12px, 1.6vw, 15px)",
                    }}>
                      {items[0].desc}
                    </p>
                  </motion.div>

                  {/* Item 2 — narrow */}
                  <motion.div
                    initial={reveal.hidden}
                    whileInView={reveal.show}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: 0.08 }}
                    className="salb-card"
                    style={{ gridColumn: "span 1", padding: S.cardPad }}
                  >
                    <div className="flex items-center gap-3" style={{ marginBottom: 18 }}>
                      <span className="salb-icon-box"><IconRender icon={items[1].icon} /></span>
                    </div>
                    <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>
                      PASSO {items[1].step}
                    </p>
                    <h3 style={{
                      color: C.text, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em",
                      fontSize: "clamp(13px, 1.7vw, 17px)",
                    }}>
                      {items[1].title}
                    </h3>
                    <p style={{
                      color: C.textMuted, lineHeight: 1.6, marginTop: 8,
                      fontSize: "clamp(11px, 1.4vw, 14px)",
                    }}>
                      {items[1].desc}
                    </p>
                  </motion.div>

                  {/* Item 3 — narrow first */}
                  <motion.div
                    initial={reveal.hidden}
                    whileInView={reveal.show}
                    viewport={{ once: true, margin: "-60px" }}
                    className="salb-card"
                    style={{ gridColumn: "span 1", padding: S.cardPad }}
                  >
                    <div className="flex items-center gap-3" style={{ marginBottom: 18 }}>
                      <span className="salb-icon-box"><IconRender icon={items[2].icon} /></span>
                    </div>
                    <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>
                      PASSO {items[2].step}
                    </p>
                    <h3 style={{
                      color: C.text, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em",
                      fontSize: "clamp(13px, 1.7vw, 17px)",
                    }}>
                      {items[2].title}
                    </h3>
                    <p style={{
                      color: C.textMuted, lineHeight: 1.6, marginTop: 8,
                      fontSize: "clamp(11px, 1.4vw, 14px)",
                    }}>
                      {items[2].desc}
                    </p>
                  </motion.div>

                  {/* Highlight — wide */}
                  <motion.div
                    initial={reveal.hidden}
                    whileInView={reveal.show}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: 0.08 }}
                    className="salb-card flex items-center"
                    style={{ gridColumn: "span 2", background: C.cardElev, padding: S.cardPad }}
                  >
                    <div>
                      <p style={{
                        color: C.teal, fontSize: 11, fontWeight: 700,
                        letterSpacing: "0.12em", textTransform: "uppercase",
                      }}>
                        Sem comissão
                      </p>
                      <p style={{
                        color: C.text, fontWeight: 600, lineHeight: 1.5, marginTop: 8,
                        letterSpacing: "-0.01em",
                        fontSize: "clamp(13px, 1.9vw, 18px)",
                      }}>
                        Você fica com 100% do valor das suas consultas. A SalbCare não toca no seu dinheiro.
                      </p>
                    </div>
                  </motion.div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* ── Prova de renda (manifesto SalbScore) ── */}
        <section
          style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}
          className={S.sectionY}
        >
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
              className="space-y-6"
            >
              <motion.div variants={reveal}><Mark /></motion.div>

              <motion.h2
                variants={reveal}
                className="salb-h"
                style={{ fontSize: "clamp(26px, 4vw, 40px)", lineHeight: 1.15 }}
              >
                Você ganha bem. Mas no papel, parece que ganha nada.
              </motion.h2>

              <motion.p variants={reveal} style={{ color: C.text, fontSize: 16, lineHeight: 1.7 }}>
                Você atende todo dia. Recebe no Pix, no dinheiro, às vezes no cartão.
                O mês fecha, o dinheiro entra — mas quando você precisa <strong>alugar um apartamento,
                pedir um cartão de crédito ou financiar alguma coisa</strong>, o banco olha pra você e diz:
                "você não comprova renda".
              </motion.p>

              <motion.p variants={reveal} style={{ color: C.text, fontSize: 16, lineHeight: 1.7 }}>
                Sem contracheque. Sem holerite. Sem ninguém pra dizer no papel que você trabalha de verdade.
                Você sabe o quanto fatura. Mas o mundo lá fora não enxerga.
              </motion.p>

              <motion.div
                variants={reveal}
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: S.radius,
                  padding: S.cardPad,
                }}
              >
                <p style={{ color: C.text, fontSize: 15, lineHeight: 1.7, fontStyle: "italic" }}>
                  "Atendi 80 pacientes esse mês, recebi tudo no Pix, e o banco me trata
                  como se eu não tivesse renda nenhuma."
                </p>
              </motion.div>

              <motion.h3
                variants={reveal}
                className="salb-h"
                style={{ fontSize: "clamp(20px, 2.6vw, 26px)", marginTop: 8 }}
              >
                A SalbCare resolve isso de um jeito simples.
              </motion.h3>

              <motion.p variants={reveal} style={{ color: C.text, fontSize: 16, lineHeight: 1.7 }}>
                Você anota seus atendimentos. A gente organiza tudo pra você.
                E gera <strong>comprovantes oficiais</strong> pra mostrar pro banco,
                pra imobiliária, pro consulado. Pronto, no seu nome.
              </motion.p>

              <motion.ul
                variants={reveal}
                style={{ color: C.text, fontSize: 15, lineHeight: 1.9 }}
                className="space-y-1 pl-1"
              >
                <li>✓ Comprove sua renda <strong>sem holerite</strong></li>
                <li>✓ Veja <strong>quanto você ganha de verdade</strong> todo mês</li>
                <li>✓ Documentos com <strong>código de verificação</strong> que banco aceita</li>
                <li>✓ Seu <strong>SalbScore</strong> mostra que você tem renda real</li>
                <li>✓ <strong>100% do que ganha é seu</strong>. Zero comissão.</li>
              </motion.ul>

              <motion.p
                variants={reveal}
                style={{
                  color: C.text,
                  fontSize: "clamp(18px, 2.4vw, 22px)",
                  lineHeight: 1.45,
                  fontWeight: 700,
                  marginTop: 16,
                }}
              >
                Se você é da saúde e cansou de "não comprovar renda", é por isso que a SalbCare existe.
              </motion.p>

              <motion.div variants={reveal} className="pt-2">
                <Link
                  to="/register?source=landing-manifesto"
                  onClick={() => trackCtaClick("register", "landing_manifesto")}
                  data-track="manifesto_cta_cadastro"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-transform active:scale-[0.98]"
                  style={{ background: C.teal, color: "#fff", fontSize: 15 }}
                >
                  Começar agora — é grátis
                  <ArrowRight size={16} />
                </Link>
                <p style={{ color: C.textMuted, fontSize: 13, marginTop: 10 }}>
                  Sem cartão. Em 2 minutos você já tem seu primeiro comprovante.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Depoimentos ── */}
        <section
          style={{ background: C.card, borderTop: `1px solid ${C.border}` }}
          className={S.sectionY}
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
              className="text-center mb-14"
            >
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2 variants={reveal} className="salb-h" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>
                O que dizem nossos profissionais
              </motion.h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { photo: testimonialSarah, name: "Dra. Sarah T.", role: "Médica", quote: "Finalmente uma plataforma que não fica com parte das minhas consultas." },
                { photo: testimonialMayara, name: "Vitória F.", role: "Dentista", quote: "Configurei tudo em uma tarde. Já recebi meus primeiros pacientes." },
                { photo: testimonialCinara, name: "Cinara C.", role: "Nutricionista", quote: "O Carnê-Leão sozinho já vale a assinatura inteira." },
              ].map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={reveal.hidden}
                  whileInView={reveal.show}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col gap-6"
                  style={{
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: S.radius,
                    padding: S.cardPad,
                    transition: `border-color ${T.card}`,
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = C.borderTealHover)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = C.border)}
                >
                  <p style={{ color: C.text, fontSize: 15, fontWeight: 400, lineHeight: 1.65 }}>
                    {t.quote}
                  </p>
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
          </div>
        </section>

        {/* ── Invisível para os bancos ── */}
        <section style={{ background: C.bg }} className={S.sectionY}>
          <div className="mx-auto max-w-2xl px-5 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
              className="flex flex-col"
              style={{ gap: 28 }}
            >
              <motion.div variants={reveal}><Mark /></motion.div>

              <motion.h2
                variants={reveal}
                className="salb-h"
                style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.15 }}
              >
                Chega de ser invisível para os bancos.
              </motion.h2>

              <motion.p
                variants={reveal}
                style={{ color: C.text, fontSize: 17, lineHeight: 1.7, fontWeight: 400 }}
              >
                Você rala o dia inteiro, atende dezenas de pacientes e vê o dinheiro entrar
                no Pix ou em dinheiro. Mas, na hora de alugar um imóvel, trocar de carro
                ou pedir crédito, parece que você não ganha nada. Sem contracheque, o
                sistema te ignora.
              </motion.p>

              <motion.p
                variants={reveal}
                style={{ color: C.text, fontSize: 17, lineHeight: 1.7, fontWeight: 400 }}
              >
                A SalbCare resolve isso de um jeito prático. Cada atendimento que você
                registra vira um dado real de faturamento. Nós organizamos seus ganhos e
                geramos os documentos que você precisa para provar sua renda para o mundo.
              </motion.p>

              <motion.ul
                variants={reveal}
                className="flex flex-col"
                style={{ gap: 14, paddingLeft: 0, listStyle: "none", marginTop: 4 }}
              >
                {[
                  "Prove sua renda sem precisar de um contracheque fixo.",
                  "Saiba exatamente quanto você ganha (de verdade) no final do mês.",
                  "Tenha documentos organizados e aceitos em instituições financeiras.",
                  "Perfil verificado com SalbScore: sua credibilidade traduzida em números.",
                  "Mantenha o controle de 100% das suas consultas em um só lugar.",
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      color: C.text,
                      fontSize: 16,
                      lineHeight: 1.6,
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: C.teal,
                        marginTop: 10,
                      }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </motion.ul>

              <motion.blockquote
                variants={reveal}
                style={{
                  borderLeft: `2px solid ${C.teal}`,
                  paddingLeft: 18,
                  margin: 0,
                  marginTop: 8,
                  color: C.text,
                  fontSize: 17,
                  lineHeight: 1.65,
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                “Hoje você recebe R$ 10 mil no Pix, mas para o banco sua renda é zero.
                Com a SalbCare, esses mesmos R$ 10 mil viram um comprovante oficial.”
              </motion.blockquote>

              <motion.p
                variants={reveal}
                style={{
                  color: C.text,
                  fontSize: 18,
                  lineHeight: 1.55,
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                Retome o controle da sua vida financeira. Seja reconhecido pelo que você
                realmente produz.
              </motion.p>

              <motion.div
                variants={reveal}
                className="flex flex-col sm:flex-row sm:items-center"
                style={{ gap: 14, marginTop: 8 }}
              >
                <Link
                  to="/register?source=landing-invisivel"
                  onClick={() => trackCtaClick("register", "landing_invisivel_bancos")}
                  className="salb-btn-primary"
                  style={{ padding: "16px 32px", justifyContent: "center" }}
                  data-track="cta_invisivel_bancos_register"
                >
                  Criar minha conta grátis
                  <ArrowRight size={16} />
                </Link>
                <span style={{ color: C.textMuted, fontSize: 13 }}>
                  Cadastro grátis · sem cartão de crédito
                </span>
              </motion.div>

            </motion.div>
          </div>
        </section>

        {/* ── Planos ── */}
        <section
          id="planos"
          style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}
          className={S.sectionY}
          aria-label="Planos SalbCare"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
              className="text-center"
              style={{ marginBottom: 40 }}
            >
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2
                variants={reveal}
                className="salb-h"
                style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
              >
                Escolha o plano que combina com seu momento.
              </motion.h2>
              <motion.p
                variants={reveal}
                className="salb-sub mx-auto"
                style={{ fontSize: 16, maxWidth: 540, marginTop: 16 }}
              >
                Comece grátis. Faça upgrade quando quiser. Sem fidelidade, sem comissão.
              </motion.p>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  name: "Grátis",
                  price: "R$ 0",
                  cadence: "para começar",
                  desc: "Pra quem está conhecendo a plataforma.",
                  features: [
                    "Até 10 pacientes",
                    "Agenda + Prontuário básico",
                    "Vitrine pública",
                    "Suporte por e-mail",
                  ],
                  cta: "Criar conta grátis",
                  to: "/register?source=landing-planos-free",
                  variant: "outline" as const,
                },
                {
                  name: "Essencial",
                  price: "R$ 89",
                  cadence: "por mês",
                  desc: "Pra quem quer crescer com gestão completa.",
                  features: [
                    "Pacientes ilimitados",
                    "Teleconsulta integrada",
                    "Receita e Atestado Digital",
                    "Controle financeiro completo",
                    "IA Mentora financeira",
                    "Perfil público e link de indicação",
                  ],
                  cta: "Assinar Essencial",
                  to: "/checkout?plan=basic&source=landing-planos-essencial",
                  variant: "primary" as const,
                  popular: true,
                },
                {
                  name: "Premium",
                  price: "Em breve",
                  cadence: "lista de espera",
                  desc: "Comprovante de Renda, Selo Verificado e prioridade no diretório.",
                  features: [
                    "Tudo do Essencial",
                    "Comprovante de Renda SalbScore",
                    "Selo Verificado Público",
                    "Prioridade no diretório",
                    "Suporte humano prioritário",
                  ],
                  cta: "Entrar na lista",
                  to: "/parcerias?source=landing-planos-premium",
                  variant: "outline" as const,
                },
              ].map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={reveal.hidden}
                  whileInView={reveal.show}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.08 }}
                  className={`salb-card flex flex-col ${plan.popular ? "salb-plan-popular" : ""}`}
                  style={{ padding: 28, position: "relative" }}
                >
                  {plan.popular && (
                    <span
                      style={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: C.teal,
                        color: C.tealOnDark,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        padding: "4px 12px",
                        borderRadius: 999,
                      }}
                    >
                      Mais escolhido
                    </span>
                  )}

                  <p style={{ color: C.text, fontSize: 14, fontWeight: 700, letterSpacing: "0.04em" }}>
                    {plan.name}
                  </p>
                  <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ color: C.text, fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em" }}>
                      {plan.price}
                    </span>
                    <span style={{ color: C.textMuted, fontSize: 13 }}>{plan.cadence}</span>
                  </div>
                  <p style={{ color: C.textMuted, fontSize: 14, marginTop: 10, lineHeight: 1.5 }}>
                    {plan.desc}
                  </p>

                  <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 24px", flex: 1 }}>
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        style={{
                          color: C.text,
                          fontSize: 14,
                          lineHeight: 1.5,
                          padding: "7px 0",
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            flexShrink: 0,
                            width: 16, height: 16,
                            borderRadius: 999,
                            background: C.tealTint,
                            border: `1px solid ${C.borderTeal}`,
                            color: C.teal,
                            fontSize: 10,
                            fontWeight: 800,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 2,
                          }}
                        >
                          ✓
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={plan.to}
                    onClick={() => trackCtaClick(`plano_${plan.name.toLowerCase()}`, "landing_planos")}
                    className={plan.variant === "primary" ? "salb-btn-primary" : "salb-btn-outline"}
                    style={{
                      width: "100%",
                      minHeight: 48,
                      ...(plan.variant === "primary"
                        ? { padding: "14px 20px", fontSize: 15 }
                        : { padding: "12px 20px", fontSize: 14 }),
                    }}
                    data-track={`planos_cta_${plan.name.toLowerCase()}`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </div>

            <p
              style={{
                color: C.textMuted, fontSize: 13, textAlign: "center",
                marginTop: 24, lineHeight: 1.6,
              }}
            >
              Sem cartão no cadastro · Cancele quando quiser · 100% das suas consultas continuam suas
            </p>
          </div>
        </section>

        {/* ── CTA Final ── */}
        <section
          style={{ background: C.card, borderTop: `1px solid ${C.borderTeal}` }}
          className={S.sectionY}
        >
          <div className="mx-auto max-w-3xl px-5 sm:px-6 text-center">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
            >
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2
                variants={reveal}
                className="salb-h"
                style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
              >
                Profissionais de saúde autônomos já usam a SalbCare para atender sem pagar comissão
              </motion.h2>
              <motion.div variants={reveal} className="mt-10">
                <Link
                  to="/register?source=landing-cta-final"
                  onClick={() => trackCtaClick("register", "landing_cta_final")}
                  className="salb-btn-primary"
                  style={{ padding: "16px 36px" }}
                >
                  Criar conta grátis
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ background: C.bg }} className={S.sectionYTight}>
          <div className="mx-auto max-w-2xl px-5 sm:px-6">
            <motion.h2
              initial={reveal.hidden}
              whileInView={reveal.show}
              viewport={{ once: true, margin: "-60px" }}
              className="salb-h text-center mb-12"
              style={{ fontSize: "clamp(26px, 3.5vw, 38px)" }}
            >
              Perguntas frequentes
            </motion.h2>
            <Accordion type="single" collapsible className="space-y-3">
              {[
                { q: "O que é o SalbScore?", a: "É uma pontuação de 0 a 1000 que reflete sua saúde financeira como profissional autônomo da saúde — calculada com seu volume de atendimentos, recebimentos confirmados, regularidade no conselho e tempo de prática. Saiba mais em /salbscore." },
                { q: "Quais planos existem hoje?", a: "Dois: o Grátis (até 10 pacientes, agenda e prontuário básico) e o Essencial a R$ 89/mês (pacientes ilimitados, teleconsulta, receita e atestado digital, controle financeiro completo e IA Mentora). O Premium, com Comprovante de Renda e Selo Verificado, está em lista de espera." },
                { q: "Preciso de cartão para começar?", a: "Não. O cadastro é grátis e não pede cartão. Você só paga quando decidir assinar o Essencial — a cobrança é imediata, sem período de teste pago." },
                { q: "O Comprovante de Renda Oficial SalbCare já está disponível?", a: "Ainda não. Está em desenvolvimento e faz parte do roadmap 2026 do SalbScore. Profissionais com score ativo terão prioridade no acesso. Comece agora a registrar consultas para que seu histórico já esteja maduro no lançamento." },
                { q: "A SalbCare cobra comissão por consulta?", a: "Não. Cobramos apenas a assinatura mensal fixa. 100% do valor das suas consultas vai direto para você — combinado e recebido fora da plataforma." },
                { q: "Meus dados e dos meus pacientes estão seguros?", a: "Sim. Usamos criptografia e seguimos as normas da LGPD. Cada profissional só vê seus próprios dados (Row Level Security)." },
              ].map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="salb-faq-item">
                  <AccordionTrigger
                    className="text-left hover:no-underline py-4"
                    style={{ fontSize: 15, fontWeight: 600, color: C.text }}
                  >
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent
                    className="pb-4"
                    style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.65 }}
                  >
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
