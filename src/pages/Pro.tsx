import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Users, Calendar, LineChart, ShieldCheck } from "lucide-react";

const DEEP_TEAL = "#0F2A33";
const DEEP_TEAL_DARK = "#081A20";
const CARD_BG = "#1A3F50";
const TEAL = "#2ABFBF";
const TEXT_MUTED = "#B0C5CC";
const BORDER = "rgba(42, 191, 191, 0.15)";

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div style={{ color: TEAL, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>
    {children}
  </div>
);

const Pillar = ({ Icon, title, body }: { Icon: typeof Users; title: string; body: string }) => (
  <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 32, display: "flex", flexDirection: "column", gap: 12 }}>
    <Icon size={28} color={TEAL} strokeWidth={1.6} />
    <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{title}</h3>
    <p style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 1.55, margin: 0 }}>{body}</p>
  </div>
);

const Pro = () => {
  return (
    <div style={{ background: DEEP_TEAL, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "#fff" }}>
      <Helmet>
        <title>SalbCare Pro — A plataforma para profissionais de saúde autônomos</title>
        <meta name="description" content="Capte mais pacientes, organize sua agenda e tenha clareza total sobre seu lucro real. 0% de comissão. Teste 7 dias grátis." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <style>{`
        .pro-h1 { font-size: 48px; line-height: 1.15; }
        .pro-h2 { font-size: 36px; line-height: 1.2; }
        .pro-grid-4 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .pro-cta:hover { filter: brightness(1.08); }
        @media (max-width: 768px) {
          .pro-h1 { font-size: 36px !important; }
          .pro-h2 { font-size: 28px !important; }
          .pro-grid-4 { grid-template-columns: 1fr !important; }
          .pro-section { padding: 64px 20px !important; }
          .pro-hero { padding: 72px 20px 56px !important; }
          .pro-cta { width: 100%; text-align: center; }
        }
      `}</style>

      {/* Header */}
      <header style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link to="/" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textDecoration: "none" }}>← Voltar</Link>
          <Link to="/" aria-label="SalbCare" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/pwa-icon-192.png" alt="" width={32} height={32} style={{ borderRadius: 8 }} />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" }}>SalbCare</span>
          </Link>
        </div>
        <Link to="/login" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textDecoration: "none" }}>Entrar</Link>
      </header>

      {/* Hero */}
      <section className="pro-hero" style={{ padding: "96px 24px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Eyebrow>SalbCare Pro</Eyebrow>
          <h1 className="pro-h1" style={{ color: "#fff", fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>
            Seu consultório digital,<br />seu controle para a gestão.
          </h1>
          <p style={{ marginTop: 20, color: TEXT_MUTED, fontSize: 17, lineHeight: 1.5, maxWidth: 600, marginInline: "auto" }}>
            A plataforma completa para profissionais de saúde autônomos: capte mais pacientes, organize sua agenda, e tenha clareza total sobre seu lucro real.
          </p>
          <div style={{ marginTop: 32 }}>
            <Link to="/register" className="pro-cta" style={{ background: TEAL, color: DEEP_TEAL, borderRadius: 999, padding: "16px 28px", fontWeight: 700, fontSize: 15, display: "inline-block", textDecoration: "none" }}>
              Testar 7 dias grátis →
            </Link>
            <div style={{ marginTop: 14, color: TEXT_MUTED, fontSize: 13 }}>Sem cartão · Cancele quando quiser</div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="pro-section" style={{ padding: "80px 24px", background: DEEP_TEAL_DARK }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Eyebrow>O que você ganha</Eyebrow>
            <h2 className="pro-h2" style={{ color: "#fff", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
              Tudo que o profissional de saúde precisa, em um só lugar.
            </h2>
          </div>
          <div className="pro-grid-4">
            <Pillar Icon={Users} title="Receba seus pacientes" body="Link de agendamento privado que você compartilha por WhatsApp. Agendamento online 24h. Sem comissão." />
            <Pillar Icon={Calendar} title="Organize sua agenda" body="Agenda inteligente, lembretes automáticos via WhatsApp, e teleconsulta integrada com Google Meet em um clique." />
            <Pillar Icon={LineChart} title="Controle seu financeiro" body="Saiba exatamente quanto entra, quanto sai, e quanto você lucra de verdade. Sem planilhas, sem chutes." />
            <Pillar Icon={ShieldCheck} title="Esqueça o Carnê-Leão" body="Contabilidade especializada em saúde, prontuário digital seguro, e conformidade com CFM, ANVISA e LGPD garantidas." />
          </div>
        </div>
      </section>

      {/* Differentiator */}
      <section className="pro-section" style={{ padding: "80px 24px", background: `linear-gradient(180deg, ${DEEP_TEAL} 0%, ${DEEP_TEAL_DARK} 100%)`, textAlign: "center" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Eyebrow>Diferencial SalbCare</Eyebrow>
          <h2 className="pro-h2" style={{ color: "#fff", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
            Você fica com 100% das suas consultas. Sempre.
          </h2>
          <p style={{ marginTop: 20, color: TEXT_MUTED, fontSize: 17, lineHeight: 1.55, maxWidth: 600, marginInline: "auto" }}>
            Sem comissões. Sem taxas escondidas. Sem pegadinhas. Você define seu preço, você recebe, você lucra.
          </p>
        </div>
      </section>

      {/* Uncomfortable question */}
      <section className="pro-section" style={{ padding: "80px 24px", background: DEEP_TEAL }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <Eyebrow>Pergunta desconfortável</Eyebrow>
          <h2 className="pro-h2" style={{ color: "#fff", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
            Você sabe exatamente quanto você lucra por mês?
          </h2>
          <p style={{ marginTop: 20, color: TEXT_MUTED, fontSize: 17, lineHeight: 1.55 }}>
            Não o faturamento. O lucro real. Depois de descontar aluguel, materiais, taxas, impostos e o seu próprio tempo.
          </p>
          <div style={{ marginTop: 32, background: CARD_BG, borderLeft: `4px solid ${TEAL}`, borderRadius: 8, padding: 28, textAlign: "left" }}>
            <p style={{ color: "#fff", fontSize: 16, lineHeight: 1.55, margin: 0 }}>
              7 em cada 10 profissionais de saúde autônomos no Brasil não conseguem responder essa pergunta com precisão. Eles acham que estão lucrando — até olharem os números de verdade.
            </p>
          </div>
          <p style={{ marginTop: 14, color: TEXT_MUTED, fontSize: 12, fontStyle: "italic" }}>
            Pesquisa setorial 2025 — fontes disponíveis sob solicitação
          </p>
        </div>
      </section>

      {/* AI Mentora */}
      <section className="pro-section" style={{ padding: "80px 24px", background: DEEP_TEAL_DARK }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <Eyebrow>IA Mentora</Eyebrow>
          <h2 className="pro-h2" style={{ color: "#fff", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
            Uma mentora financeira que trabalha por você.
          </h2>
          <p style={{ marginTop: 20, color: TEXT_MUTED, fontSize: 17, lineHeight: 1.55 }}>
            A IA Mentora analisa seus números em tempo real e te diz exatamente quanto cobrar, quando aumentar preço, e onde está vazando dinheiro. Como ter um consultor financeiro dedicado, 24h por dia.
          </p>
          <div style={{ marginTop: 36, display: "inline-flex", alignItems: "center", gap: 12, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 999, padding: "14px 22px 14px 14px" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: TEAL, flexShrink: 0 }} />
            <span style={{ color: "#fff", fontSize: 14 }}>Posso preparar seu lembrete de imposto desta semana?</span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pro-section" style={{ padding: "80px 24px", background: DEEP_TEAL }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <Eyebrow>Investimento</Eyebrow>
          <h2 className="pro-h2" style={{ color: "#fff", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
            Um plano. Tudo incluído.
          </h2>
          <div style={{ maxWidth: 480, margin: "40px auto 0", background: CARD_BG, border: `2px solid ${TEAL}`, borderRadius: 16, padding: 48, textAlign: "left" }}>
            <div style={{ color: TEAL, fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>Essencial</div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ color: "#fff", fontSize: 48, fontWeight: 800, letterSpacing: "-0.02em" }}>R$ 89</span>
              <span style={{ color: TEXT_MUTED, fontSize: 15 }}>/mês</span>
            </div>
            <p style={{ marginTop: 8, color: TEXT_MUTED, fontSize: 14 }}>7 dias grátis · Cancele quando quiser</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "28px 0 0", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Perfil público + agendamento online",
                "Agenda + lembretes WhatsApp",
                "Teleconsulta Google Meet",
                "Prontuário digital seguro",
                "Financeiro + IA Mentora",
                "0% de comissão sobre consultas",
              ].map((item) => (
                <li key={item} style={{ display: "flex", gap: 10, color: "#fff", fontSize: 14, lineHeight: 1.4 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M5 12l4 4L19 7" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/register" className="pro-cta" style={{ marginTop: 32, background: TEAL, color: DEEP_TEAL, borderRadius: 999, padding: "16px 28px", fontWeight: 700, fontSize: 15, display: "block", textAlign: "center", textDecoration: "none" }}>
              Começar 7 dias grátis →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "40px 24px", background: DEEP_TEAL_DARK, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
        <div style={{ color: TEXT_MUTED, fontSize: 13 }}>
          © {new Date().getFullYear()} SalbCare · <Link to="/terms" style={{ color: TEXT_MUTED }}>Termos</Link> · <Link to="/privacy" style={{ color: TEXT_MUTED }}>Privacidade</Link>
        </div>
      </footer>
    </div>
  );
};

export default Pro;
