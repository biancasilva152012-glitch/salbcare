import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProSubscription } from "@/hooks/useProSubscription";
import Testimonials from "@/components/pro/Testimonials";
import {
  CREAM,
  GOLD,
  MONO,
  NAVY,
  PRO_FONTS_HREF,
  PRO_PRICES,
  ProLabel,
  ProPlanKey,
  TEAL,
  proStyles,
} from "@/components/pro/brand";

const PAINS = [
  "Agenda espalhada entre papel, caderno e WhatsApp.",
  "Invisibilidade para quem procura cuidado na sua cidade.",
  "Despreparo para o paciente estrangeiro que ja esta chegando.",
];

const STEPS = [
  { n: "01", t: "Assine", d: "Escolha mensal ou anual e pague em segundos." },
  { n: "02", t: "Complete seu perfil", d: "Profissao, registro, cidade e idiomas atendidos." },
  { n: "03", t: "Comece a atender", d: "Seu perfil entra na vitrine e recebe solicitacoes." },
];

const VALUE_STACK = [
  "Perfil profissional multilingue na vitrine",
  "Pagina profissional propria",
  "Agenda de atendimentos",
  "Cadastro de pacientes",
  "Financeiro simples",
  "Apostila de Ingles para Profissionais da Saude inclusa",
  "Materiais de atendimento",
  "Acesso as oportunidades SalbCare",
];

const FAQ = [
  {
    q: "Preciso falar ingles?",
    a: "Nao. A apostila inclusa te prepara com frases prontas de consultorio.",
  },
  {
    q: "Preciso pagar comissao por consulta?",
    a: "Nao. A SalbCare cobra apenas a assinatura. O valor da consulta e definido por voce.",
  },
  {
    q: "Quando meu perfil aparece na vitrine?",
    a: "Assim que voce completa o perfil e publica, apos a curadoria da equipe.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. O cancelamento e feito pelo painel, em Assinatura.",
  },
];

const Pro = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isActive } = useProSubscription();
  const [plan, setPlan] = useState<ProPlanKey>("annual");
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (isActive) {
      navigate("/pro/painel");
      return;
    }
    if (!user) {
      navigate("/login", { state: { from: { pathname: "/pro" } } });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pro-checkout", {
        body: { priceId: PRO_PRICES[plan].id },
      });
      if (error || !data?.url) throw error ?? new Error("sem url");
      window.location.href = data.url;
    } catch {
      toast.error("Nao foi possivel abrir o pagamento. Tente novamente.");
      setLoading(false);
    }
  };

  const muted = "rgba(244,238,226,0.7)";

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: MONO }}>
      <Helmet>
        <title>SalbCare Pro. Sua carreira na saude, no mapa do mundo</title>
        <meta
          name="description"
          content="Perfil profissional, gestao do consultorio e pacientes internacionais em uma so plataforma. A partir de R$59 por mes, sem comissao por consulta."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={PRO_FONTS_HREF} />
      </Helmet>
      <style>{proStyles}</style>

      <header
        className="pro-wrap"
        style={{ paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <Link to="/kite" style={{ color: muted, fontSize: 12, textDecoration: "none" }}>
          Para viajantes
        </Link>
        <Link
          to={isActive ? "/pro/painel" : "/login"}
          style={{ color: muted, fontSize: 12, textDecoration: "none" }}
        >
          {isActive ? "Meu painel" : "Entrar"}
        </Link>
      </header>

      {/* HERO */}
      <section className="pro-wrap" style={{ paddingTop: 72, paddingBottom: 56 }}>
        <ProLabel>SalbCare Pro</ProLabel>
        <h1 className="pro-h1">Sua carreira na saude, no mapa do mundo.</h1>
        <p style={{ marginTop: 18, fontSize: 15, lineHeight: 1.65, color: "rgba(244,238,226,0.78)", maxWidth: 520 }}>
          Perfil profissional, gestao do consultorio e pacientes internacionais em uma so plataforma. A partir de R$59
          por mes.
        </p>
        <button
          className="pro-cta"
          onClick={handleSubscribe}
          disabled={loading}
          style={{ background: GOLD, color: NAVY, marginTop: 28, maxWidth: 320 }}
        >
          {loading ? "Abrindo pagamento" : isActive ? "Ir para o painel" : "Criar meu perfil"}
        </button>
      </section>

      {/* PROBLEMA */}
      <section className="pro-wrap" style={{ paddingBottom: 64 }}>
        <h2 className="pro-h2">Voce estudou para cuidar de pessoas. Nao para cacar pacientes.</h2>
        <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
          {PAINS.map((p) => (
            <div key={p} className="pro-card" style={{ padding: 18, fontSize: 14, lineHeight: 1.5 }}>
              {p}
            </div>
          ))}
        </div>
      </section>

      {/* ECOSSISTEMA */}
      <section className="pro-wrap" style={{ paddingBottom: 64 }}>
        <h2 className="pro-h2">Um ecossistema, dois lados.</h2>
        <div className="pro-grid2" style={{ marginTop: 20 }}>
          <div className="pro-card">
            <ProLabel>SalbCare PRO</ProLabel>
            <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: "rgba(244,238,226,0.8)" }}>
              Para profissionais de saude. Perfil na vitrine, gestao do consultorio e pacientes chegando ate voce.
            </p>
          </div>
          <Link to="/kite" className="pro-card" style={{ display: "block", textDecoration: "none", color: CREAM }}>
            <ProLabel>SalbCare KITE</ProLabel>
            <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: "rgba(244,238,226,0.8)" }}>
              Para viajantes. Encontrar cuidado confiavel no litoral do Ceara em poucos minutos.
            </p>
            <span style={{ display: "inline-block", marginTop: 12, fontSize: 12, color: TEAL }}>Ver o KITE</span>
          </Link>
        </div>
        <p style={{ marginTop: 18, fontSize: 14, color: TEAL }}>Os viajantes do KITE sao os pacientes do PRO.</p>
      </section>

      {/* COMO FUNCIONA */}
      <section className="pro-wrap" style={{ paddingBottom: 64, display: "grid", gap: 14 }}>
        <ProLabel>Como funciona</ProLabel>
        {STEPS.map((s) => (
          <div key={s.n} style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
            <span style={{ color: TEAL, fontSize: 12 }}>{s.n}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{s.t}</div>
              <div style={{ fontSize: 13, color: muted, marginTop: 2 }}>{s.d}</div>
            </div>
          </div>
        ))}
      </section>

      {/* VALUE STACK */}
      <section className="pro-wrap" style={{ paddingBottom: 64 }}>
        <h2 className="pro-h2">Tudo isso por menos que um plano de celular.</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: "18px 0 0", display: "grid", gap: 10 }}>
          {VALUE_STACK.map((b) => (
            <li key={b} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
              <span style={{ color: GOLD }}>+</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      <Testimonials />

      {/* PRECOS */}
      <section className="pro-wrap" style={{ paddingBottom: 64 }}>
        <ProLabel>Precos</ProLabel>
        <div className="pro-grid2" style={{ marginTop: 16 }}>
          {(Object.keys(PRO_PRICES) as ProPlanKey[]).map((key) => {
            const p = PRO_PRICES[key];
            const selected = plan === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPlan(key)}
                aria-pressed={selected}
                className={`pro-card ${key === "annual" ? "pro-card--gold" : ""}`}
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  color: CREAM,
                  outline: selected ? `2px solid ${key === "annual" ? GOLD : TEAL}` : "none",
                  outlineOffset: 2,
                }}
              >
                <ProLabel>{p.label}</ProLabel>
                {key === "annual" && (
                  <div
                    style={{
                      display: "inline-block",
                      marginTop: 10,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: GOLD,
                      color: NAVY,
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Preco fundador, travado para sempre
                  </div>
                )}
                <div style={{ marginTop: 12, fontFamily: "'Gloock', Georgia, serif", fontSize: 32 }}>
                  {p.amount}
                  <span style={{ fontFamily: MONO, fontSize: 13, color: "rgba(244,238,226,0.6)" }}>{p.period}</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: key === "annual" ? GOLD : muted }}>{p.note}</div>
                <div style={{ marginTop: 10, fontSize: 12, color: muted }}>
                  So o sistema de gestao ja valeria a assinatura.
                </div>
              </button>
            );
          })}
        </div>

        <button
          className="pro-cta"
          onClick={handleSubscribe}
          disabled={loading}
          style={{ background: GOLD, color: NAVY, marginTop: 24 }}
        >
          {loading ? "Abrindo pagamento" : isActive ? "Ir para o painel" : "Criar meu perfil"}
        </button>
        <p style={{ marginTop: 10, fontSize: 11, textAlign: "center", color: "rgba(244,238,226,0.55)" }}>
          Pagamento seguro pelo Stripe. Cancelamento a qualquer momento.
        </p>
      </section>

      {/* FAQ */}
      <section className="pro-wrap" style={{ paddingBottom: 72 }}>
        <ProLabel>Perguntas frequentes</ProLabel>
        <div style={{ marginTop: 18, display: "grid", gap: 2 }}>
          {FAQ.map((item) => {
            const open = openFaq === item.q;
            return (
              <div key={item.q} style={{ borderTop: "1px solid rgba(244,238,226,0.14)" }}>
                <button
                  onClick={() => setOpenFaq(open ? null : item.q)}
                  aria-expanded={open}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    background: "none",
                    border: "none",
                    color: CREAM,
                    fontFamily: MONO,
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: "left",
                    padding: "16px 0",
                    cursor: "pointer",
                  }}
                >
                  <span>{item.q}</span>
                  <span style={{ color: TEAL }}>{open ? "-" : "+"}</span>
                </button>
                {open && (
                  <p style={{ margin: "0 0 16px", fontSize: 13, lineHeight: 1.6, color: muted }}>{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="pro-wrap" style={{ paddingBottom: 48, fontSize: 12, color: "rgba(244,238,226,0.55)" }}>
        © {new Date().getFullYear()} SalbCare · <Link to="/terms" style={{ color: "inherit" }}>Termos</Link> ·{" "}
        <Link to="/privacy" style={{ color: "inherit" }}>Privacidade</Link>
      </footer>
    </div>
  );
};

export default Pro;
