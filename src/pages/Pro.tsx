import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProSubscription } from "@/hooks/useProSubscription";
import shotAgenda from "@/assets/pro/painel-agenda.jpg";
import shotFinanceiro from "@/assets/pro/painel-financeiro.jpg";
import {
  CREAM,
  GOLD,
  MONO,
  NAVY,
  PRO_PRICES,
  ProLabel,
  ProPlanKey,
  ProWordmark,
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
  { title: "Agenda", line: "Todos os atendimentos do dia em uma única tela, sem papel." },
  { title: "Pacientes", line: "Histórico, contato e observações de cada paciente organizados." },
  { title: "Financeiro", line: "Entradas e saídas do consultório com o resultado do mês pronto." },
  { title: "Página de agendamento", line: "Um link próprio para você divulgar e receber solicitações." },
];

const SHOTS = [
  { src: shotAgenda, caption: "Agenda do consultório, com os próximos atendimentos." },
  { src: shotFinanceiro, caption: "Financeiro do mês, com receitas, despesas e resultado." },
];

const FAQ = [
  {
    q: "Como funciona o teste de 14 dias e o que acontece depois?",
    a: "Você cria sua conta e usa o sistema completo por 14 dias, sem cartão de crédito. Ao final, escolhe o plano mensal ou anual. Se não escolher nenhum, a conta apenas fica bloqueada e seus dados continuam salvos.",
  },
  {
    q: "Quanto custa e existe alguma taxa por consulta?",
    a: "São R$ 99 por mês ou R$ 897 por ano, sem taxa de adesão. A SalbCare não cobra comissão por consulta: o valor do atendimento é definido por você e recebido diretamente por você.",
  },
  {
    q: "Quanto tempo leva para começar a usar de verdade?",
    a: "Cerca de dez minutos. Você preenche seus dados, define seus horários e já recebe o link da sua página de agendamento. Pacientes e lançamentos podem ser cadastrados no seu ritmo.",
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
  { label: "O produto", href: "#produto" },
  { label: "Planos", href: "#planos" },
];

const MONTHLY_VALUE = 99;
const ANNUAL_VALUE = 897;
const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const annualSaving = MONTHLY_VALUE * 12 - ANNUAL_VALUE;
const annualMonthly = ANNUAL_VALUE / 12;
const annualPercent = Math.round((annualSaving / (MONTHLY_VALUE * 12)) * 100);

const Pro = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isActive } = useProSubscription();
  const [plan, setPlan] = useState<ProPlanKey>("annual");
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const muted = "rgba(31,31,31,0.56)";
  const soft = "rgba(31,31,31,0.74)";

  const startTrial = () => {
    navigate(isActive ? "/pro/painel" : "/register");
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

  const planSummary =
    plan === "annual"
      ? `Plano anual selecionado. ${brl(ANNUAL_VALUE)} por ano, equivalente a ${brl(annualMonthly)} por mês.`
      : `Plano mensal selecionado. ${brl(MONTHLY_VALUE)} por mês, cobrado todo mês.`;

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: SANS }}>
      <Helmet>
        <title>SalbCare Pro. Gestão de consultório para dentistas e fisioterapeutas</title>
        <meta
          name="description"
          content="Agenda, pacientes, financeiro e sua própria página de agendamento em um só lugar. Teste o SalbCare Pro por 14 dias, sem cartão de crédito."
        />        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </Helmet>
      <style>{proStyles}</style>

      {/* NAVEGAÇÃO */}
      <header style={{ borderBottom: "1px solid rgba(31,31,31,0.12)" }}>
        <div
          className="pro-wrap"
          style={{
            paddingTop: 18,
            paddingBottom: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <ProWordmark size={30} />

          <nav className="pro-nav-desktop" style={{ alignItems: "center", gap: 24 }}>
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="pro-link">
                {item.label}
              </a>
            ))}
            <Link to={isActive ? "/pro/painel" : "/login"} className="pro-link">
              {isActive ? "Meu painel" : "Entrar"}
            </Link>
          </nav>

          <button
            type="button"
            className="pro-burger"
            aria-expanded={menuOpen}
            aria-controls="pro-menu"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "Fechar" : "Menu"}
          </button>
        </div>

        {menuOpen && (
          <nav
            id="pro-menu"
            className="pro-wrap pro-nav-mobile"
            style={{ paddingBottom: 18, display: "grid", gap: 0 }}
          >
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="pro-link pro-block"
                onClick={() => setMenuOpen(false)}
                style={{ display: "block" }}
              >
                {item.label}
              </a>
            ))}
            <Link
              to={isActive ? "/pro/painel" : "/login"}
              className="pro-link pro-block"
              onClick={() => setMenuOpen(false)}
              style={{ display: "block" }}
            >
              {isActive ? "Meu painel" : "Entrar"}
            </Link>
          </nav>
        )}
      </header>

      {/* HERO */}
      <section className="pro-wrap pro-section">
        <ProLabel>Care, without borders.</ProLabel>
        <h1 className="pro-h1" style={{ maxWidth: 700 }}>
          Seu consultório organizado, do agendamento ao financeiro.
        </h1>
        <p className="pro-lead" style={{ marginTop: 20, maxWidth: 520 }}>
          Agenda, pacientes, financeiro e sua própria página de agendamento. Feito para dentistas e fisioterapeutas
          autônomos.
        </p>
        <div style={{ marginTop: 32 }}>
          <button className="pro-cta" onClick={startTrial}>
            {isActive ? "Ir para o painel" : "Testar 14 dias grátis"}
          </button>
        </div>
        <p className="pro-mono" style={{ marginTop: 14 }}>
          Sem cartão de crédito. Configuração em cerca de 10 minutos. Sem comissão por consulta.
        </p>
      </section>

      <hr className="pro-rule" />

      {/* PROBLEMA */}
      <section className="pro-wrap pro-section">
        <h2 className="pro-h2" style={{ maxWidth: 620 }}>
          Você estudou para cuidar de pessoas. Não para administrar planilhas.
        </h2>
        <div style={{ marginTop: 28 }}>
          {PAINS.map((p) => (
            <p key={p} className="pro-block pro-body" style={{ margin: 0 }}>
              {p}
            </p>
          ))}
        </div>
      </section>

      <hr className="pro-rule" />

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="pro-wrap pro-section" style={{ scrollMarginTop: 24 }}>
        <ProLabel>Funcionalidades</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 14 }}>
          Quatro ferramentas, um único lugar.
        </h2>
        <div className="pro-grid2" style={{ marginTop: 28 }}>
          {FEATURES.map(({ title, line }) => (
            <div key={title} className="pro-block">
              <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: "0.04em" }}>{title}</div>
              <p className="pro-body" style={{ margin: "8px 0 0" }}>
                {line}
              </p>
            </div>
          ))}
        </div>
      </section>

      <hr className="pro-rule" />

      {/* PRODUTO EM TELAS REAIS */}
      <section id="produto" className="pro-wrap pro-section" style={{ scrollMarginTop: 24 }}>
        <ProLabel>O produto</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 14 }}>
          É simples assim por dentro.
        </h2>
        <div style={{ marginTop: 28, display: "grid", gap: 32 }}>
          {SHOTS.map((shot) => (
            <figure key={shot.caption} style={{ margin: 0 }}>
              <img
                className="pro-shot"
                src={shot.src}
                alt={shot.caption}
                width={1280}
                height={620}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="pro-mono" style={{ marginTop: 10 }}>
                {shot.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <hr className="pro-rule" />

      {/* MÓDULO INTERNACIONAL */}
      <section className="pro-wrap pro-section">
        <ProLabel>Módulo internacional</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 14, maxWidth: 620 }}>
          Atende paciente estrangeiro? Ative em um clique.
        </h2>
        <p className="pro-body" style={{ marginTop: 18, maxWidth: 600, color: soft }}>
          Sua página de agendamento passa a funcionar em português, inglês e espanhol, com preços em real, euro e dólar.
          Você também recebe mensagens prontas nos três idiomas para confirmar horários e orientar o paciente antes da
          consulta.
        </p>
        <p className="pro-mono" style={{ marginTop: 14, color: TEAL }}>
          Opcional, ligado nas configurações
        </p>
      </section>

      <hr className="pro-rule" />

      {/* PLANOS */}
      <section id="planos" className="pro-wrap pro-section" style={{ scrollMarginTop: 24 }}>
        <ProLabel>Planos</ProLabel>
        <h2 className="pro-h2" style={{ marginTop: 14 }}>
          Um plano só, com tudo incluído.
        </h2>
        <p className="pro-body" style={{ marginTop: 14, maxWidth: 520 }}>
          Escolha o período de cobrança antes de continuar. Agenda, pacientes, financeiro, página de agendamento e
          módulo internacional estão nos dois.
        </p>

        <div className="pro-grid2" style={{ marginTop: 28, columnGap: 20, rowGap: 16 }}>
          {(Object.keys(PRO_PRICES) as ProPlanKey[]).map((key) => {
            const p = PRO_PRICES[key];
            const selected = plan === key;
            return (
              <button key={key} type="button" onClick={() => setPlan(key)} aria-pressed={selected} className="pro-plan">
                <span className="pro-mono" style={{ color: selected ? GOLD : muted }}>
                  {selected ? "Selecionado" : "Selecionar"}
                </span>
                <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 13 }}>{p.label}</div>
                <div style={{ marginTop: 10, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34 }}>
                  {p.amount}
                  <span style={{ fontFamily: MONO, fontSize: 13, color: muted }}>{p.period}</span>
                </div>
                <p className="pro-body" style={{ margin: "12px 0 0" }}>
                  {p.note}
                </p>
              </button>
            );
          })}
        </div>

        <p className="pro-mono" style={{ marginTop: 24, color: soft }}>
          {planSummary}
        </p>
        <p className="pro-mono" style={{ marginTop: 8 }}>
          No anual você economiza {brl(annualSaving)} por ano, cerca de {annualPercent} por cento em relação a doze
          meses do plano mensal.
        </p>

        <div style={{ marginTop: 24 }}>
          <button className="pro-cta" onClick={handleSubscribe} disabled={loading}>
            {loading ? "Abrindo pagamento" : isActive ? "Ir para o painel" : "Continuar para o pagamento"}
          </button>
        </div>
        <p className="pro-mono" style={{ marginTop: 12 }}>
          Pagamento seguro pelo Stripe. Cancelamento a qualquer momento no painel.
        </p>
      </section>

      <hr className="pro-rule" />

      {/* FAQ */}
      <section className="pro-wrap pro-section">
        <ProLabel>Perguntas frequentes</ProLabel>
        <div style={{ marginTop: 20 }}>
          {FAQ.map((item) => {
            const open = openFaq === item.q;
            return (
              <div key={item.q} style={{ borderTop: "1px solid rgba(31,31,31,0.12)" }}>
                <button
                  onClick={() => setOpenFaq(open ? null : item.q)}
                  aria-expanded={open}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    background: "none",
                    border: "none",
                    color: CREAM,
                    fontFamily: MONO,
                    fontSize: 13,
                    textAlign: "left",
                    padding: "18px 0",
                    cursor: "pointer",
                  }}
                >
                  <span>{item.q}</span>
                  <span style={{ color: TEAL }}>{open ? "-" : "+"}</span>
                </button>
                {open && (
                  <p className="pro-body" style={{ margin: "0 0 18px", maxWidth: 640 }}>
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <hr className="pro-rule" />

      {/* CTA FINAL */}
      <section className="pro-wrap pro-section" style={{ textAlign: "center" }}>
        <h2 className="pro-h2">Comece hoje a organizar seu consultório.</h2>
        <p className="pro-body" style={{ margin: "18px auto 0", maxWidth: 460 }}>
          Teste o sistema completo por 14 dias, sem cartão de crédito.
        </p>
        <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
          <button className="pro-cta" onClick={startTrial}>
            {isActive ? "Ir para o painel" : "Testar 14 dias grátis"}
          </button>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(31,31,31,0.12)" }}>
        <div className="pro-wrap" style={{ paddingTop: 32, paddingBottom: 48 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 20,
              fontFamily: MONO,
              fontSize: 12,
            }}
          >
            <Link to="/terms" className="pro-link">
              Termos de uso
            </Link>
            <Link to="/privacy" className="pro-link">
              Política de privacidade
            </Link>
            <Link to="/legal" className="pro-link">
              Informações legais
            </Link>
            <Link to="/about" className="pro-link">
              Sobre
            </Link>
            <Link to="/contact" className="pro-link">
              Contato
            </Link>
            <a href="https://www.gov.br/anpd/pt-br" target="_blank" rel="noreferrer" className="pro-link">
              LGPD
            </a>
          </div>
          <p className="pro-mono" style={{ marginTop: 20, maxWidth: 620, lineHeight: 1.6 }}>
            O valor de cada atendimento é definido pelo próprio profissional. A SalbCare fornece o software de gestão e
            não cobra comissão por consulta.
          </p>
          <p className="pro-mono" style={{ marginTop: 12 }}>
            © {new Date().getFullYear()} SalbCare. Care, without borders.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Pro;
