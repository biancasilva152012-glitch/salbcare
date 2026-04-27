import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Menu, X,
  FileText, Search, Video,
  UserPlus, Globe, LayoutDashboard, Shield,
  type LucideIcon,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SEOHead from "@/components/SEOHead";
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

const TestimonialAvatar = ({ src, name }: { src: string; name: string }) => (
  <Avatar
    style={{
      width: 56, height: 56,
      border: `2px solid ${C.teal}`,
      background: C.cardElev,
      flexShrink: 0,
    }}
  >
    <AvatarImage
      src={src}
      alt={name}
      loading="lazy"
      decoding="async"
      style={{ objectFit: "cover", objectPosition: "center top" }}
    />
    <AvatarFallback
      style={{
        background: C.cardElev,
        color: C.teal,
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: "0.02em",
      }}
    >
      {initialsOf(name)}
    </AvatarFallback>
  </Avatar>
);

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
              <Link to="/experimente" className="salb-btn-primary-sm">Testar agora</Link>
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
                <Link to="/experimente" onClick={() => setMobileMenuOpen(false)} className="salb-btn-primary-sm">Testar agora</Link>
              </div>
            </motion.div>
          )}
        </nav>

        {/* ── Hero ── */}
        <section className="salb-grid-bg">
          <div className="mx-auto max-w-5xl px-5 sm:px-6 pt-20 pb-20 sm:pt-32 sm:pb-28">
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
                style={{ fontSize: "clamp(40px, 7vw, 72px)" }}
              >
                Sua <span style={{ color: C.teal }}>vitrine</span> para pacientes.
                <br />
                Seu <span style={{ color: C.teal }}>controle</span> para gestão.
              </motion.h1>

              <motion.p
                variants={reveal}
                className="salb-sub mx-auto"
                style={{ fontSize: 17, maxWidth: 520, marginTop: 24, paddingInline: 8 }}
              >
                Organize seus primeiros 10 pacientes sem custo. Gestão completa, mentoria financeira e visibilidade para pacientes.
              </motion.p>

              <motion.div
                variants={reveal}
                className="flex flex-col sm:flex-row items-center justify-center gap-3"
                style={{ marginTop: 36 }}
              >
                <Link to="/experimente" className="salb-btn-primary">
                  Testar agora
                  <ArrowRight size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
                  className="salb-nav-link text-sm"
                  style={{ padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer" }}
                >
                  Como funciona?
                </button>
              </motion.div>

              <motion.p
                variants={reveal}
                style={{ color: C.textMuted, fontSize: 14, marginTop: 20 }}
              >
                Sem login. Sem cartão. Use a plataforma agora e crie conta quando gostar.
              </motion.p>
            </motion.div>
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
                Você registra seus atendimentos. A plataforma organiza seus ganhos.
                E gera <strong>comprovantes oficiais</strong> que você pode mostrar pra qualquer banco,
                imobiliária ou consulado. Tudo automático. Tudo no seu nome.
              </motion.p>

              <motion.ul
                variants={reveal}
                style={{ color: C.text, fontSize: 15, lineHeight: 1.9 }}
                className="space-y-1 pl-1"
              >
                <li>✓ Provar sua renda <strong>sem precisar de contracheque</strong></li>
                <li>✓ Saber exatamente <strong>quanto você ganha de verdade</strong> todo mês</li>
                <li>✓ Documentos com <strong>código de verificação</strong> aceitos por bancos e imobiliárias</li>
                <li>✓ Perfil verificado com <strong>SalbScore</strong> — sua reputação financeira</li>
                <li>✓ Você continua com <strong>100% do que ganha</strong>. Zero comissão.</li>
              </motion.ul>

              <motion.p
                variants={reveal}
                style={{
                  color: C.text,
                  fontSize: "clamp(17px, 2.2vw, 20px)",
                  lineHeight: 1.5,
                  fontWeight: 600,
                  marginTop: 12,
                }}
              >
                Pela primeira vez, profissional autônomo da saúde tem como provar pro mundo
                o que sempre soube: que trabalha, que fatura, e que merece ser tratado como tal.
              </motion.p>
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
                <Link to="/planos" className="salb-btn-primary" style={{ padding: "16px 36px" }}>
                  Começar grátis por 7 dias
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
                { q: "O que é a SalbCare?", a: "A SalbCare é uma plataforma de gestão integrada para profissionais de saúde autônomos, unindo prontuário digital, teleconsulta via Google Meet e mentoria financeira." },
                { q: "Preciso pagar para começar?", a: "Não. Você pode cadastrar até 10 pacientes gratuitamente, sem cartão de crédito. O upgrade é opcional e só acontece quando você precisar." },
                { q: "A plataforma cobra comissão por consulta?", a: "Não. Cobramos apenas uma assinatura mensal fixa. 100% do valor das suas consultas vai direto para você." },
                { q: "Preciso instalar algum software?", a: "Não, a SalbCare é 100% baseada na nuvem e pode ser acessada de qualquer navegador ou dispositivo móvel." },
                { q: "Meus dados e dos meus pacientes estão seguros?", a: "Sim, utilizamos criptografia e seguimos rigorosamente as normas da LGPD para garantir a segurança total das informações." },
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
