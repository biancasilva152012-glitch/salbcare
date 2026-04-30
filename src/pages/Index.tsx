// build: 2026-04-29 — landing reverted to approved state (light theme, no SalbScore, no fake metrics)
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, UserPlus, LayoutGrid, FileText, Check } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import SEOHead from "@/components/SEOHead";
import { trackCtaClick, trackUnified } from "@/hooks/useTracking";
import logoSalb from "/pwa-icon-512.png";

/* ─────────────────────────────────────────────
 * DESIGN TOKENS — paleta fixa: navy / teal / mint
 * ───────────────────────────────────────────── */
const NAVY = "#0D1B2A";
const TEAL = "#00B4A0";
const TEAL_DARK = "#009986";
const TEXT_MUTED = "#64748B";
const MINT_BG = "#F0FDFA";
const BORDER = "#E2E8F0";

const fireCta = (ctaName: string, location: string, extras: Record<string, unknown> = {}) => {
  trackCtaClick(ctaName, location, extras);
  trackUnified("landing_cta_click", { cta_name: ctaName, cta_location: location, ...extras });
};

/* IA Mentora — mensagens rotativas (genéricas, sem métricas inventadas) */
const MENTORA_MSGS = [
  "Quer que eu mostre onde investir o próximo R$ 1.000?",
  "Seus recebimentos do mês entraram. Quer ver o resumo?",
  "Posso preparar seu lembrete de imposto desta semana?",
];

const Index = () => {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % MENTORA_MSGS.length), 3500);
    return () => clearInterval(id);
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SalbCare",
    url: "https://salbcare.com.br",
    logo: "https://salbcare.com.br/pwa-icon-512.png",
  };

  return (
    <>
      <SEOHead
        title="SalbCare — Gestão completa para profissionais de saúde autônomos"
        description="Organize seus primeiros 10 pacientes sem custo. Gestão completa, mentoria financeira e visibilidade para pacientes."
        canonical="/"
        jsonLd={jsonLd}
      />

      <style>{`
        .salb-link { color: ${TEAL}; font-weight: 600; transition: opacity 150ms ease; }
        .salb-link:hover { opacity: 0.85; text-decoration: underline; text-underline-offset: 4px; }

        .salb-cta {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          background: ${TEAL}; color: #fff;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-weight: 600; font-size: 17px;
          padding: 18px 32px; border-radius: 12px;
          box-shadow: 0 6px 20px rgba(0,180,160,0.28);
          transition: background 180ms ease, transform 180ms ease, box-shadow 180ms ease;
          min-height: 56px; min-width: 220px;
        }
        .salb-cta:hover, .salb-cta:focus-visible {
          background: ${TEAL_DARK};
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0,180,160,0.34);
        }

        .salb-feature-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 56px; height: 56px; border-radius: 16px;
          background: rgba(0,180,160,0.12);
          color: ${TEAL};
        }

        @keyframes mentoraFade {
          0%, 100% { opacity: 0; transform: translateY(4px); }
          15%, 85% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(180deg, ${MINT_BG} 0%, #FFFFFF 60%)`,
          color: NAVY,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {/* ── HERO ── */}
        <section>
          <div className="mx-auto max-w-3xl px-5 sm:px-6 pt-14 pb-12 sm:pt-20 sm:pb-16 text-center">
            {/* Logo original SalbCare */}
            <div className="flex justify-center" style={{ marginBottom: 32 }}>
              <Link to="/" aria-label="SalbCare — Início">
                <img
                  src={logoSalb}
                  alt="SalbCare"
                  width={88}
                  height={88}
                  style={{ width: 88, height: 88, display: "block" }}
                  fetchPriority="high"
                />
              </Link>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontWeight: 800,
                color: NAVY,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                fontSize: "clamp(34px, 7vw, 56px)",
                margin: 0,
              }}
            >
              Sua <span style={{ color: TEAL }}>vitrine</span> para pacientes.
              <br />
              Seu <span style={{ color: TEAL }}>controle</span> para gestão.
            </h1>

            {/* Subtítulo */}
            <p
              style={{
                marginTop: 24,
                color: TEXT_MUTED,
                fontWeight: 400,
                fontSize: "clamp(16px, 2.2vw, 19px)",
                lineHeight: 1.55,
                maxWidth: 620,
                marginInline: "auto",
              }}
            >
              Organize seus primeiros 10 pacientes sem custo. Gestão completa, mentoria financeira e visibilidade para pacientes.
            </p>

            {/* 3 features */}
            <ul
              style={{
                marginTop: 40,
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 16,
                listStyle: "none",
                padding: 0,
                maxWidth: 540,
                marginInline: "auto",
              }}
            >
              {[
                { Icon: UserPlus, label: "Cadastre seu primeiro paciente" },
                { Icon: LayoutGrid, label: "Organize sua agenda" },
                { Icon: FileText, label: "Registre atendimentos" },
              ].map(({ Icon, label }) => (
                <li key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <span className="salb-feature-icon" aria-hidden>
                    <Icon size={26} strokeWidth={2} />
                  </span>
                  <span style={{ color: NAVY, fontSize: 13, fontWeight: 500, lineHeight: 1.35, textAlign: "center" }}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="flex flex-col items-center" style={{ marginTop: 40, gap: 18 }}>
              <Link
                to="/register?source=landing-hero"
                onClick={() => fireCta("testar_agora", "landing_hero", { source: "landing-hero" })}
                className="salb-cta"
                data-track="hero_cta_register"
              >
                Testar agora
                <ArrowRight size={20} strokeWidth={2.4} />
              </Link>

              <a href="#como-funciona" className="salb-link" style={{ fontSize: 15 }}>
                Como funciona?
              </a>

              <p style={{ color: TEXT_MUTED, fontSize: 14 }}>
                Sem cartão • Comece em menos de 1 minuto
              </p>

              <Link
                to="/experimente?source=landing-hero"
                onClick={() => fireCta("experimente", "landing_hero")}
                className="salb-link"
                style={{ fontSize: 15 }}
              >
                Ou experimente sem cadastrar →
              </Link>

              <Link
                to="/login?source=landing-hero"
                onClick={() => fireCta("login", "landing_hero")}
                className="salb-link"
                style={{ fontSize: 15 }}
              >
                Já é cadastrado? Faça login
              </Link>
            </div>
          </div>
        </section>

        {/* ── IA MENTORA EM AÇÃO ── */}
        <section aria-label="IA Mentora em ação" style={{ paddingBottom: 56 }}>
          <div className="mx-auto max-w-2xl px-5 sm:px-6 text-center">
            <p
              style={{
                color: TEXT_MUTED,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              IA Mentora em ação
            </p>

            <div
              role="status"
              aria-live="polite"
              style={{
                background: "#0F172A",
                color: "#E2E8F0",
                borderRadius: 9999,
                padding: "18px 28px",
                fontSize: 15,
                lineHeight: 1.4,
                minHeight: 58,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 12px 32px rgba(15, 23, 42, 0.18)",
              }}
            >
              <span
                key={msgIdx}
                style={{
                  display: "inline-block",
                  animation: "mentoraFade 3.5s ease-in-out",
                }}
              >
                {MENTORA_MSGS[msgIdx]}
              </span>
            </div>
          </div>
        </section>

        {/* ── COMO FUNCIONA ── */}
        <section id="como-funciona" style={{ background: "#FFFFFF", padding: "72px 0", borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-4xl px-5 sm:px-6">
            <h2
              style={{
                textAlign: "center",
                fontWeight: 800,
                color: NAVY,
                letterSpacing: "-0.02em",
                fontSize: "clamp(26px, 4vw, 38px)",
                lineHeight: 1.2,
                marginBottom: 16,
              }}
            >
              Em 3 passos você está dentro
            </h2>
            <p style={{ textAlign: "center", color: TEXT_MUTED, fontSize: 16, marginBottom: 48, maxWidth: 540, marginInline: "auto" }}>
              Cadastro rápido, sem burocracia. Comece a organizar sua prática hoje.
            </p>

            <ol
              style={{
                display: "grid",
                gap: 20,
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                listStyle: "none",
                padding: 0,
                margin: 0,
              }}
            >
              {[
                { n: "1", t: "Cadastre-se", d: "Crie sua conta em menos de 1 minuto e valide seu conselho profissional." },
                { n: "2", t: "Configure sua agenda", d: "Adicione seus primeiros pacientes e organize seus horários." },
                { n: "3", t: "Atenda e registre", d: "Use prontuário, receita digital e controle financeiro em um só lugar." },
              ].map((s) => (
                <li
                  key={s.n}
                  style={{
                    background: "#FFFFFF",
                    border: `1px solid ${BORDER}`,
                    borderRadius: 16,
                    padding: 24,
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      background: "rgba(0,180,160,0.12)",
                      color: TEAL,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 15,
                      marginBottom: 14,
                    }}
                    aria-hidden
                  >
                    {s.n}
                  </span>
                  <h3 style={{ color: NAVY, fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{s.t}</h3>
                  <p style={{ color: TEXT_MUTED, fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── PLANOS — dados reais do PLANS config ── */}
        <section id="planos" style={{ background: MINT_BG, padding: "72px 0" }}>
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <h2
              style={{
                textAlign: "center",
                fontWeight: 800,
                color: NAVY,
                letterSpacing: "-0.02em",
                fontSize: "clamp(26px, 4vw, 38px)",
                lineHeight: 1.2,
                marginBottom: 16,
              }}
            >
              Comece grátis. Cresça sem comissão.
            </h2>
            <p style={{ textAlign: "center", color: TEXT_MUTED, fontSize: 16, marginBottom: 40 }}>
              Sem cartão no cadastro. Cancele quando quiser.
            </p>

            <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
              {[
                {
                  name: "Grátis",
                  price: "R$ 0",
                  cadence: "para começar",
                  desc: "Para conhecer a plataforma.",
                  features: ["Até 10 pacientes", "Agenda + Prontuário básico", "Receita digital"],
                  cta: "Criar conta grátis",
                  to: "/register?source=landing-planos-free",
                  primary: false,
                },
                {
                  name: "Essencial",
                  price: "R$ 89",
                  cadence: "por mês",
                  desc: "Gestão completa da sua prática.",
                  features: [
                    "Pacientes ilimitados",
                    "Teleconsulta integrada",
                    "Receita e Atestado Digital",
                    "Controle financeiro completo",
                    "Mentoria financeira com IA",
                  ],
                  cta: "Assinar Essencial",
                  to: "/checkout?plan=basic&source=landing-planos-essencial",
                  primary: true,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  style={{
                    background: "#FFFFFF",
                    border: `1px solid ${plan.primary ? TEAL : BORDER}`,
                    borderRadius: 18,
                    padding: 28,
                    boxShadow: plan.primary ? "0 12px 32px rgba(0,180,160,0.16)" : "none",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <p style={{ color: NAVY, fontWeight: 700, fontSize: 14 }}>{plan.name}</p>
                  <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ color: NAVY, fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>{plan.price}</span>
                    <span style={{ color: TEXT_MUTED, fontSize: 13 }}>{plan.cadence}</span>
                  </div>
                  <p style={{ color: TEXT_MUTED, fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>{plan.desc}</p>

                  <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 24px", flex: 1 }}>
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        style={{
                          color: NAVY,
                          fontSize: 14,
                          padding: "6px 0",
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <Check size={16} color={TEAL} strokeWidth={2.6} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={plan.to}
                    onClick={() => fireCta(`plano_${plan.name.toLowerCase()}`, "landing_planos")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      background: plan.primary ? TEAL : "#FFFFFF",
                      color: plan.primary ? "#FFFFFF" : NAVY,
                      border: `1.5px solid ${plan.primary ? TEAL : BORDER}`,
                      borderRadius: 10,
                      padding: "12px 18px",
                      fontWeight: 700,
                      fontSize: 14.5,
                      textDecoration: "none",
                      minHeight: 48,
                    }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ background: "#FFFFFF", padding: "72px 0", borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-2xl px-5 sm:px-6">
            <h2
              style={{
                textAlign: "center",
                fontWeight: 800,
                color: NAVY,
                letterSpacing: "-0.02em",
                fontSize: "clamp(24px, 3.5vw, 34px)",
                marginBottom: 32,
              }}
            >
              Perguntas frequentes
            </h2>

            <Accordion type="single" collapsible className="space-y-3">
              {[
                { q: "Preciso de cartão para começar?", a: "Não. O cadastro é gratuito e o plano Grátis permite organizar até 10 pacientes sem custo." },
                { q: "Funciona para MEI, autônomo PF ou Simples Nacional?", a: "Funciona para todos os regimes. O módulo financeiro e a mentoria com IA se adaptam à sua realidade tributária." },
                { q: "Posso cancelar quando quiser?", a: "Sim. Sem fidelidade, sem multa. Você cancela direto pelo painel." },
                { q: "Meus dados estão seguros?", a: "Sim. 100% LGPD. Criptografia em repouso, RLS no banco e auditoria de acesso. Você pode pedir exclusão total a qualquer momento." },
              ].map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  style={{ background: MINT_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "0 18px" }}
                >
                  <AccordionTrigger
                    className="text-left hover:no-underline py-4"
                    style={{ fontSize: 15, fontWeight: 600, color: NAVY }}
                  >
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4" style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.65 }}>
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ background: MINT_BG, borderTop: `1px solid ${BORDER}`, padding: "40px 0" }}>
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="flex flex-col items-center gap-5 text-center">
              <img src={logoSalb} alt="SalbCare" width={36} height={36} loading="lazy" style={{ width: 36, height: 36 }} />
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                <Link to="/terms" style={{ color: TEXT_MUTED }}>Termos</Link>
                <Link to="/privacy" style={{ color: TEXT_MUTED }}>Privacidade</Link>
                <Link to="/blog" style={{ color: TEXT_MUTED }}>Blog</Link>
                <Link to="/parcerias" style={{ color: TEXT_MUTED }}>Parcerias</Link>
                <Link to="/instalar-app" style={{ color: TEXT_MUTED }}>Como instalar o app?</Link>
              </div>
              <p style={{ color: TEXT_MUTED, fontSize: 13 }}>
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
