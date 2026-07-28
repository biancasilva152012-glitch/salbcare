import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProSubscription } from "@/hooks/useProSubscription";
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

const STEPS = [
  { n: "01", t: "Assine", d: "Escolha mensal ou anual e pague em segundos." },
  { n: "02", t: "Complete seu perfil", d: "Profissão, registro, cidade e idiomas atendidos." },
  { n: "03", t: "Comece a atender", d: "Seu perfil entra na vitrine e recebe solicitações." },
];

const INCLUDED = [
  "Perfil na vitrine SalbCare",
  "Solicitações de pacientes internacionais",
  "Agenda simples de atendimentos",
  "Materiais de atendimento em inglês e espanhol",
  "Você define seus próprios valores",
];

const FAQ = [
  { q: "Preciso pagar comissão por consulta?", a: "Nao. A SalbCare cobra apenas a assinatura. O valor da consulta e definido por voce." },
  { q: "Quando meu perfil aparece na vitrine?", a: "Assim que voce completa o perfil e publica, apos a curadoria da equipe." },
  { q: "Posso cancelar quando quiser?", a: "Sim. O cancelamento e feito pelo painel, em Assinatura." },
];

const Pro = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isActive } = useProSubscription();
  const [plan, setPlan] = useState<ProPlanKey>("annual");
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: MONO }}>
      <Helmet>
        <title>SalbCare Pro. Assinatura para profissionais de saude</title>
        <meta
          name="description"
          content="Assine o SalbCare Pro, publique seu perfil na vitrine e atenda pacientes internacionais no litoral do Ceara. Sem comissao por consulta."
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
        <Link to="/" style={{ color: "rgba(244,238,226,0.7)", fontSize: 12, textDecoration: "none" }}>
          Voltar ao site
        </Link>
        <Link
          to={isActive ? "/pro/painel" : "/login"}
          style={{ color: "rgba(244,238,226,0.7)", fontSize: 12, textDecoration: "none" }}
        >
          {isActive ? "Meu painel" : "Entrar"}
        </Link>
      </header>

      <section className="pro-wrap" style={{ paddingTop: 60, paddingBottom: 40 }}>
        <ProLabel>Assinatura para profissionais</ProLabel>
        <h1 className="pro-h1">SalbCare Pro</h1>
        <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.6, color: "rgba(244,238,226,0.78)", maxWidth: 460 }}>
          Seu perfil na vitrine da SalbCare, pronto para receber pacientes internacionais no litoral do Ceara.
        </p>
      </section>

      <section className="pro-wrap" style={{ paddingBottom: 48, display: "grid", gap: 14 }}>
        {STEPS.map((s) => (
          <div key={s.n} style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
            <span style={{ color: TEAL, fontSize: 12 }}>{s.n}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{s.t}</div>
              <div style={{ fontSize: 13, color: "rgba(244,238,226,0.7)", marginTop: 2 }}>{s.d}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="pro-wrap" style={{ paddingBottom: 48 }}>
        <ProLabel>Incluso na assinatura</ProLabel>
        <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "grid", gap: 10 }}>
          {INCLUDED.map((b) => (
            <li key={b} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
              <span style={{ color: GOLD }}>+</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="pro-wrap" style={{ paddingBottom: 56 }}>
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
                <div style={{ marginTop: 12, fontFamily: "'Gloock', Georgia, serif", fontSize: 32 }}>
                  {p.amount}
                  <span style={{ fontFamily: MONO, fontSize: 13, color: "rgba(244,238,226,0.6)" }}>{p.period}</span>
                </div>
                {key === "annual" && (
                  <div style={{ marginTop: 8, fontSize: 12, color: GOLD }}>Preco de fundador garantido</div>
                )}
              </button>
            );
          })}
        </div>

        <button
          className="pro-cta"
          onClick={handleSubscribe}
          disabled={loading}
          style={{ background: GOLD, color: NAVY, marginTop: 22 }}
        >
          {loading ? "Abrindo pagamento" : isActive ? "Ir para o painel" : "Assinar agora"}
        </button>
        <p style={{ marginTop: 10, fontSize: 11, textAlign: "center", color: "rgba(244,238,226,0.55)" }}>
          Pagamento seguro pelo Stripe. Cancelamento a qualquer momento.
        </p>
      </section>

      <section className="pro-wrap" style={{ paddingBottom: 72 }}>
        <ProLabel>Perguntas frequentes</ProLabel>
        <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
          {FAQ.map((item) => (
            <div key={item.q} style={{ borderTop: "1px solid rgba(244,238,226,0.14)", paddingTop: 14 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{item.q}</h2>
              <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.6, color: "rgba(244,238,226,0.7)" }}>
                {item.a}
              </p>
            </div>
          ))}
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
