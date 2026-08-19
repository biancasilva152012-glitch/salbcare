import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CalendarDays, Users, Wallet, Link2 } from "lucide-react";
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
  SANS,
  TEAL,
  proStyles,
} from "@/components/pro/brand";

const PAINS = [
  "Agenda espalhada entre papel, caderno e WhatsApp.",
  "Faltas e remarcações que você descobre tarde demais.",
  "Financeiro do consultório sem controle no fim do mês.",
];

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Agenda",
    line: "Todos os atendimentos do dia em uma única tela, sem papel.",
  },
  {
    icon: Users,
    title: "Pacientes",
    line: "Histórico, contato e observações de cada paciente organizados.",
  },
  {
    icon: Wallet,
    title: "Financeiro",
    line: "Entradas e saídas do consultório com o resultado do mês pronto.",
  },
  {
    icon: Link2,
    title: "Sua página de agendamento",
    line: "Um link próprio para você divulgar e receber solicitações.",
  },
];

const FAQ = [
  {
    q: "Como funciona o teste de 14 dias e o que acontece depois?",
    a: "Você cria sua conta e usa o sistema completo por 14 dias, sem cartão de crédito. Ao final, escolhe o plano de R$ 99 por mês ou R$ 897 por ano. Se não escolher nenhum, a conta apenas fica bloqueada e seus dados continuam salvos.",
  },
  {
    q: "Quanto custa e existe alguma taxa por consulta?",
    a: "São R$ 99 por mês ou R$ 897 por ano, sem taxa de adesão. A SalbCare não cobra comissão por consulta: o valor do atendimento é definido por você e recebido diretamente por você.",
  },
  {
    q: "Quanto tempo leva para começar a usar de verdade?",
    a: "Cerca de dez minutos. Você preenche seus dados, define seus horários e já recebe o link da sua página de agendamento. Pacientes e lançamentos financeiros podem ser cadastrados aos poucos, no seu ritmo.",
  },
  {
    q: "Meus dados e os dados dos meus pacientes ficam seguros?",
    a: "Sim. Cada profissional acessa somente os próprios registros, o acesso é protegido por login e a estrutura segue as exigências da LGPD. Você pode exportar ou apagar seus dados quando quiser.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. O cancelamento é feito pelo próprio painel, em Assinatura, sem ligação e sem burocracia. Você continua com acesso até o fim do período já pago.",
  },
];

const NAV = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Planos", href: "#planos" },
];

const Pro = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isActive } = useProSubscription();
  const [plan, setPlan] = useState<ProPlanKey>("annual");
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const muted = "rgba(244,238,226,0.7)";
  const soft = "rgba(244,238,226,0.8)";

  const startTrial = () => {
    if (isActive) {
      navigate("/pro/painel");
      return;
    }
    navigate("/register");
  };

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
      toast.error("Não foi possível abrir o pagamento. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: SANS }}>
      <Helmet>
        <title>SalbCare Pro. Gestão do seu consultório, do agendamento ao financeiro</title>
        <meta
          name="description"
          content="Software de gestão de consultório para dentistas e fisioterapeutas: agenda, pacientes, financeiro e sua própria página de agendamento. Teste 14 dias grátis."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={PRO_FONTS_HREF} />
      </Helmet>
      <style>{proStyles}</style>

      {/* NAVEGAÇÃO */}
      <header
        className="pro-wrap"
        style={{
          paddingTop: 18,
          paddingBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: TEAL }}>
          SalbCare Pro
        </span>
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontFamily: MONO,
            fontSize: 12,
            flexWrap: "wrap",
          }}
        >
          {NAV.map((item) => (
            <a key={item.href} href={item.href} style={{ color: muted, textDecoration: "none" }}>
              {item.label}
            </a>
          ))}
          <Link to="/about" style={{ color: muted, textDecoration: "none" }}>
            Sobre
          </Link>
          <Link to={isActive ? "/pro/painel" : "/login"} style={{ color: muted, textDecoration: "none" }}>
            {isActive ? "Meu painel" : "Entrar"}
          </Link>
          <button
            onClick={startTrial}
            style={{
              fontFamily: MONO,
              fontSize: 12,
              fontWeight: 600,
              background: GOLD,
              color: NAVY,
              border: "none",
              borderRadius: 999,
              padding: "9px 16px",
              cursor: "pointer",
            }}
          >
            {isActive ? "Ir para o painel" : "Testar grátis"}
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section className="pro-wrap" style={{ paddingTop: 56, paddingBottom: 48 }}>
        <ProLabel>SALBCARE PRO</ProLabel>
        <h1 className="pro-h1">Seu consultório organizado, do agendamento ao financeiro.</h1>
        <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.65, color: soft, maxWidth: 540 }}>
          Agenda, pacientes, financeiro e sua própria página de agendamento. Feito para dentistas e fisioterapeutas
          autônomos.
        </p>
        <button
          className="pro-cta"
          onClick={startTrial}
          style={{ background: GOLD, color: NAVY, marginTop: 26, maxWidth: 320 }}
        >
          {isActive ? "Ir para o painel" : "Testar 14 dias grátis"}
        </button>
        <p style={{ marginTop: 10, fontSize: 12, color: muted, fontFamily: MONO, maxWidth: 320, textAlign: "center" }}>
          Sem cartão de crédito.
        </p>
        <p style={{ marginTop: 26, fontSize: 13, lineHeight: 1.6, color: muted, fontFamily: MONO }}>
          Criado por uma profissional da saúde, para quem atende sozinho no consultório.
        </p>
      </section>

      {/* PROBLEMA */}
      <section className="pro-wrap" style={{ paddingBottom: 64 }}>
        <h2 className="pro-h2">Você estudou para cuidar de pessoas. Não para administrar planilhas.</h2>
        <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
          {PAINS.map((p) => (
            <div key={p} className="pro-card" style={{ padding: 18, fontSize: 15, lineHeight: 1.5 }}>
              {p}
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="pro-wrap" style={{ paddingBottom: 64, scrollMarginTop: 24 }}>
        <ProLabel>Funcionalidades</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 12 }}>
          Quatro ferramentas, um único lugar.
        </h2>
        <div className="pro-grid2" style={{ marginTop: 20 }}>
          {FEATURES.map(({ icon: Icon, title, line }) => (
            <div key={title} className="pro-card">
              <Icon size={22} color={TEAL} aria-hidden="true" />
              <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 14, fontWeight: 600 }}>{title}</div>
              <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6, color: soft }}>{line}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MÓDULO INTERNACIONAL */}
      <section className="pro-wrap" style={{ paddingBottom: 64 }}>
        <div className="pro-card pro-card--gold">
          <ProLabel>Módulo internacional</ProLabel>
          <h2 className="pro-h2" style={{ marginTop: 12 }}>
            Atende paciente estrangeiro? Ative em um clique.
          </h2>
          <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.65, color: soft }}>
            Sua página de agendamento passa a funcionar em português, inglês e espanhol, com preços em real, euro e
            dólar. Você também recebe mensagens prontas nos três idiomas para confirmar horários e orientar o paciente
            antes da consulta.
          </p>
          <span style={{ display: "inline-block", marginTop: 14, fontFamily: MONO, fontSize: 12, color: TEAL }}>
            Opcional, ligado nas configurações
          </span>
        </div>
      </section>

      <Testimonials />

      {/* PLANOS */}
      <section id="planos" className="pro-wrap" style={{ paddingBottom: 64, scrollMarginTop: 24 }}>
        <ProLabel>Planos</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 12 }}>
          Um plano só, com tudo incluído.
        </h2>
        <div className="pro-grid2" style={{ marginTop: 20 }}>
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
                  fontFamily: SANS,
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
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Mais escolhido
                  </div>
                )}
                <div style={{ marginTop: 12, fontFamily: "'Gloock', Georgia, serif", fontSize: 32 }}>
                  {p.amount}
                  <span style={{ fontFamily: MONO, fontSize: 13, color: "rgba(244,238,226,0.6)" }}>{p.period}</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: key === "annual" ? GOLD : muted }}>{p.note}</div>
                <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6, color: muted }}>
                  Agenda, pacientes, financeiro, página de agendamento e módulo internacional.
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
          {loading ? "Abrindo pagamento" : isActive ? "Ir para o painel" : "Assinar agora"}
        </button>
        <p
          style={{
            marginTop: 10,
            fontFamily: MONO,
            fontSize: 11,
            textAlign: "center",
            color: "rgba(244,238,226,0.55)",
          }}
        >
          Pagamento seguro pelo Stripe. Cancelamento a qualquer momento.
        </p>
      </section>

      {/* FAQ */}
      <section className="pro-wrap" style={{ paddingBottom: 64 }}>
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
                  <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.65, color: soft }}>{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="pro-wrap" style={{ paddingBottom: 64 }}>
        <div className="pro-card" style={{ textAlign: "center" }}>
          <h2 className="pro-h2">Comece hoje a organizar seu consultório.</h2>
          <p style={{ margin: "14px auto 0", maxWidth: 460, fontSize: 15, lineHeight: 1.65, color: soft }}>
            Teste o sistema completo por 14 dias e veja sua agenda, seus pacientes e seu financeiro em um só lugar.
          </p>
          <button
            className="pro-cta"
            onClick={startTrial}
            style={{ background: GOLD, color: NAVY, marginTop: 22, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}
          >
            {isActive ? "Ir para o painel" : "Testar 14 dias grátis"}
          </button>
          <p style={{ marginTop: 10, fontFamily: MONO, fontSize: 12, color: muted }}>Sem cartão de crédito.</p>
        </div>
      </section>

      <footer
        className="pro-wrap"
        style={{ paddingBottom: 48, fontFamily: MONO, fontSize: 12, color: "rgba(244,238,226,0.55)" }}
      >
        © {new Date().getFullYear()} SalbCare ·{" "}
        <Link to="/terms" style={{ color: "inherit" }}>
          Termos
        </Link>{" "}
        ·{" "}
        <Link to="/privacy" style={{ color: "inherit" }}>
          Privacidade
        </Link>
      </footer>
    </div>
  );
};

export default Pro;
