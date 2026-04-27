import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Menu, X, FileText, Search, Video, UserPlus, Globe, LayoutDashboard, Shield } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SEOHead from "@/components/SEOHead";
import { useState } from "react";
import testimonialSarah from "@/assets/testimonial-sarah.jpeg";
import testimonialMayara from "@/assets/testimonial-mayara.jpeg";
import testimonialCinara from "@/assets/testimonial-cinara.jpeg";

// Editorial dark-first palette (extraída do Instagram da marca)
const C = {
  bg: "#0B1623",
  card: "#111E2D",
  cardElev: "#172538",
  teal: "#00B4A0",
  tealHover: "#00D4BE",
  text: "#F0F4F8",
  textMuted: "#7A8FA6",
  border: "rgba(255,255,255,0.06)",
  borderTeal: "rgba(0,180,160,0.20)",
  tealTint: "rgba(0,180,160,0.12)",
};

const reveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

// Pequeno traço editorial reutilizável
const Mark = () => (
  <span
    aria-hidden
    style={{
      display: "block",
      width: 48,
      height: 2,
      borderRadius: 2,
      background: C.teal,
      margin: "0 auto 24px",
    }}
  />
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
        .salb-nav-link { color: ${C.textMuted}; opacity: 0.85; transition: color 150ms ease, opacity 150ms ease; }
        .salb-nav-link:hover { color: ${C.text}; opacity: 1; }
        .salb-btn-outline {
          display: inline-flex; align-items: center;
          background: transparent; color: ${C.teal};
          border: 1px solid rgba(0,180,160,0.25);
          border-radius: 8px; padding: 8px 18px;
          font-size: 14px; font-weight: 600;
          transition: all 150ms ease;
        }
        .salb-btn-outline:hover { border-color: ${C.teal}; background: rgba(0,180,160,0.08); }
        .salb-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: ${C.teal}; color: ${C.bg};
          border-radius: 10px; padding: 15px 32px;
          font-size: 15px; font-weight: 700;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
          transition: background 150ms ease;
        }
        .salb-btn-primary:hover { background: ${C.tealHover}; }
        .salb-card {
          background: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 16px;
          padding: 32px;
          transition: border-color 200ms ease, background 200ms ease;
        }
        .salb-card:hover { border-color: rgba(0,180,160,0.30); background: #141F30; }
        .salb-icon-box {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: ${C.tealTint};
          border: 1px solid ${C.borderTeal};
          display: inline-flex; align-items: center; justify-content: center;
          color: ${C.teal};
        }
        .salb-icon-box svg { width: 20px; height: 20px; }
        .salb-divider-v {
          background: ${C.border};
          width: 1px;
          align-self: stretch;
        }
        .salb-grid-bg {
          background-color: ${C.bg};
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 79px,
            rgba(255,255,255,0.015) 79px,
            rgba(255,255,255,0.015) 80px
          );
        }
        .salb-faq-item {
          background: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 12px;
          padding: 0 20px;
        }
        .salb-faq-item[data-state="open"] { border-color: ${C.borderTeal}; }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
        {/* ── Navbar ── */}
        <nav
          style={{
            position: "sticky", top: 0, zIndex: 100,
            background: "rgba(11,22,35,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="h-5 w-5" style={{ color: C.teal }} strokeWidth={2.4} />
              <span style={{ fontWeight: 800, color: C.text, letterSpacing: "-0.02em", fontSize: 17 }}>
                SalbCare
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/para-profissionais" className="salb-nav-link text-sm font-medium">Para Profissionais</Link>
              <Link to="/planos" className="salb-nav-link text-sm font-medium">Planos</Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="salb-btn-outline">Já tenho conta</Link>
              <Link
                to="/experimente"
                style={{
                  background: C.teal, color: C.bg,
                  borderRadius: 8, padding: "8px 18px",
                  fontSize: 14, fontWeight: 700,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
                  transition: "background 150ms ease",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = C.tealHover)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = C.teal)}
              >
                Testar agora
              </Link>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              style={{ color: C.text }}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
              className="md:hidden px-4 py-4 space-y-3"
              style={{ borderTop: `1px solid ${C.border}`, background: C.bg }}
            >
              <Link to="/para-profissionais" onClick={() => setMobileMenuOpen(false)} className="block text-sm" style={{ color: C.textMuted }}>Para Profissionais</Link>
              <Link to="/planos" onClick={() => setMobileMenuOpen(false)} className="block text-sm" style={{ color: C.textMuted }}>Planos</Link>
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login" className="salb-btn-outline" style={{ justifyContent: "center" }}>Já tenho conta</Link>
                <Link
                  to="/experimente"
                  style={{
                    background: C.teal, color: C.bg,
                    borderRadius: 10, padding: "12px 24px",
                    fontSize: 15, fontWeight: 700, textAlign: "center",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
                  }}
                >
                  Testar agora
                </Link>
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
              <motion.div variants={reveal}>
                <Mark />
              </motion.div>

              <motion.h1
                variants={reveal}
                className="salb-h"
                style={{ fontSize: "clamp(44px, 7vw, 72px)" }}
              >
                Sua <span style={{ color: C.teal }}>vitrine</span> para pacientes.
                <br />
                Seu <span style={{ color: C.teal }}>controle</span> para gestão.
              </motion.h1>

              <motion.p
                variants={reveal}
                className="salb-sub mx-auto"
                style={{ fontSize: 18, maxWidth: 520, marginTop: 24 }}
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
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
                  className="salb-nav-link text-sm font-medium"
                  style={{ padding: "12px 16px", background: "transparent" }}
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
                    <f.icon className="shrink-0 mt-0.5" style={{ width: 20, height: 20, color: C.teal }} />
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

        {/* ── IA Mentora preview (single editorial card) ── */}
        <section style={{ background: C.bg }} className="py-20 sm:py-24">
          <div className="mx-auto max-w-2xl px-5 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <p style={{ color: C.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
                IA Mentora em ação
              </p>
              <div className="salb-card" style={{ padding: 24 }}>
                <div className="flex gap-3 items-start">
                  <div className="salb-icon-box" style={{ width: 32, height: 32, fontSize: 11, fontWeight: 700 }}>
                    <span style={{ color: C.teal, fontSize: 11, fontWeight: 700 }}>IA</span>
                  </div>
                  <p style={{ color: C.text, fontSize: 15, lineHeight: 1.6, flex: 1 }}>
                    Você teve mais consultas esse mês! Quer que eu mostre onde investir o dinheiro extra para lucrar ainda mais?
                  </p>
                </div>
                <div className="flex justify-end mt-3">
                  <p style={{
                    color: C.bg, background: C.teal,
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

        {/* ── Stats Bar (editorial, sem cards) ── */}
        <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }} className="py-12">
          <div className="mx-auto max-w-4xl px-5 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { value: "9+", label: "especialidades" },
              { value: "100%", label: "Você fica com 100% do valor. Sem comissão." },
              { value: "Grátis", label: "para começar, sem cartão" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <p style={{ fontSize: "clamp(32px, 4vw, 44px)", fontWeight: 800, color: C.teal, letterSpacing: "-0.03em" }}>{s.value}</p>
                <p style={{ color: C.textMuted, fontSize: 14, marginTop: 6 }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Como Funciona — grid assimétrico 2/3 + 1/3 ── */}
        <section id="como-funciona" style={{ background: C.bg }} className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
              className="text-center mb-14"
            >
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2 variants={reveal} className="salb-h" style={{ fontSize: "clamp(32px, 4.5vw, 48px)" }}>
                Como funciona
              </motion.h2>
            </motion.div>

            {(() => {
              const items = [
                { step: "1", icon: UserPlus, title: "Cadastre seus dados de forma prática", desc: "Tenha todo o seu diagnóstico financeiro na palma da mão" },
                { step: "2", icon: Globe, title: "Pacientes te encontram", desc: "Seu perfil aparece no diretório público da SalbCare sem custo por lead" },
                { step: "3", icon: LayoutDashboard, title: "Gerencie tudo em um lugar", desc: "Agenda, prontuário, receitas e financeiro na mesma plataforma" },
              ];
              // Layout assimétrico: linha 1 = 2/3 + 1/3 ; linha 2 = full do item 3 num span 2/3 deslocado
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Item 1 — wide (2/3) */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="salb-card md:col-span-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <span className="salb-icon-box">{(() => { const I = items[0].icon; return <I />; })()}</span>
                        <span style={{ color: C.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em" }}>
                          PASSO {items[0].step}
                        </span>
                      </div>
                      <h3 style={{ color: C.text, fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
                        {items[0].title}
                      </h3>
                      <p style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.6, marginTop: 12, maxWidth: 420 }}>
                        {items[0].desc}
                      </p>
                    </div>
                  </motion.div>

                  {/* Item 2 — narrow (1/3) */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="salb-card"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <span className="salb-icon-box">{(() => { const I = items[1].icon; return <I />; })()}</span>
                      <span style={{ color: C.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em" }}>
                        PASSO {items[1].step}
                      </span>
                    </div>
                    <h3 style={{ color: C.text, fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                      {items[1].title}
                    </h3>
                    <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.6, marginTop: 10 }}>
                      {items[1].desc}
                    </p>
                  </motion.div>

                  {/* Item 3 — narrow first (1/3) */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="salb-card md:col-start-1"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <span className="salb-icon-box">{(() => { const I = items[2].icon; return <I />; })()}</span>
                      <span style={{ color: C.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em" }}>
                        PASSO {items[2].step}
                      </span>
                    </div>
                    <h3 style={{ color: C.text, fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                      {items[2].title}
                    </h3>
                    <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.6, marginTop: 10 }}>
                      {items[2].desc}
                    </p>
                  </motion.div>

                  {/* Espaço editorial 2/3 com mensagem-âncora — quebra o ritmo de grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="salb-card md:col-span-2 flex items-center"
                    style={{ background: C.cardElev }}
                  >
                    <div>
                      <p style={{ color: C.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                        Sem comissão
                      </p>
                      <p style={{ color: C.text, fontSize: 18, fontWeight: 600, lineHeight: 1.5, marginTop: 10, letterSpacing: "-0.01em" }}>
                        Você fica com 100% do valor das suas consultas. A SalbCare não toca no seu dinheiro.
                      </p>
                    </div>
                  </motion.div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* ── Depoimentos ── */}
        <section style={{ background: C.card, borderTop: `1px solid ${C.border}` }} className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
              className="text-center mb-14"
            >
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2 variants={reveal} className="salb-h" style={{ fontSize: "clamp(30px, 4vw, 44px)" }}>
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
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    padding: 28,
                    transition: "border-color 200ms ease",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(0,180,160,0.30)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = C.border)}
                  className="flex flex-col gap-6"
                >
                  <p style={{ color: C.text, fontSize: 15, fontWeight: 400, lineHeight: 1.65 }}>
                    {t.quote}
                  </p>
                  <div className="flex items-center gap-3 mt-auto">
                    <img
                      src={t.photo}
                      alt={t.name}
                      width={48}
                      height={48}
                      style={{
                        width: 48, height: 48,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1.5px solid rgba(0,180,160,0.40)",
                      }}
                    />
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
        <section style={{ background: C.card, borderTop: "1px solid rgba(0,180,160,0.15)" }} className="py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-5 sm:px-6 text-center">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.div variants={reveal}><Mark /></motion.div>
              <motion.h2
                variants={reveal}
                className="salb-h"
                style={{ fontSize: "clamp(30px, 4vw, 44px)" }}
              >
                Profissionais de saúde autônomos já usam a SalbCare para atender sem pagar comissão
              </motion.h2>
              <motion.div variants={reveal} className="mt-10">
                <Link to="/planos" className="salb-btn-primary" style={{ padding: "16px 36px" }}>
                  Começar grátis por 7 dias
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ background: C.bg }} className="py-20 sm:py-24">
          <div className="mx-auto max-w-2xl px-5 sm:px-6">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="salb-h text-center mb-12"
              style={{ fontSize: "clamp(28px, 3.5vw, 38px)" }}
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
                <Shield className="h-4 w-4" style={{ color: C.teal }} strokeWidth={2.4} />
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
