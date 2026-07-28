import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

/**
 * Cole aqui os Payment Links ativos da conta Stripe live "Salb Care".
 * Dashboard Stripe > Payment Links > copiar URL de cada produto.
 */
const APOSTILA_01_PAYMENT_LINK = "#"; // TODO: colar o Payment Link da "Apostila 01"
const PRO_FUNDADOR_PAYMENT_LINK = "#"; // TODO: colar o Payment Link do "SalbCare Pro Fundador"

const NAVY = "#0F1F3A";
const CREAM = "#F4EEE2";
const TEAL = "#34BFB4";
const GOLD = "#CFA856";

const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const DISPLAY = "'Gloock', Georgia, serif";

const FAQ = [
  {
    q: "Como recebo o material?",
    a: "Por e-mail, no endereco usado na compra, em ate 24 horas apos a confirmacao do pagamento.",
  },
  {
    q: "Quais as formas de pagamento?",
    a: "Cartao de credito, Apple Pay e Google Pay, processados com seguranca pelo Stripe.",
  },
  {
    q: "Existe garantia?",
    a: "Sim. Garantia de 7 dias. Se nao fizer sentido para voce, devolvemos o valor integral.",
  },
];

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: TEAL }}>
    {children}
  </div>
);

const Pro = () => {
  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: MONO }}>
      <Helmet>
        <title>SalbCare Pro. Atendimento em ingles para profissionais de saude</title>
        <meta
          name="description"
          content="Materiais e plano anual para profissionais de saude que querem atender pacientes internacionais no litoral do Ceara."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Gloock&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </Helmet>

      <style>{`
        .pro-wrap { max-width: 720px; margin: 0 auto; padding: 0 20px; }
        .pro-h1 { font-family: ${DISPLAY}; font-size: 44px; line-height: 1.1; margin: 12px 0 0; font-weight: 400; }
        .pro-card { border-radius: 14px; padding: 28px; background: rgba(244,238,226,0.04); border: 1px solid rgba(244,238,226,0.14); }
        .pro-card--gold { border-color: ${GOLD}; background: rgba(207,168,86,0.08); }
        .pro-cta { display: block; text-align: center; border-radius: 999px; padding: 16px 24px; font-weight: 600; font-size: 14px; text-decoration: none; margin-top: 24px; letter-spacing: 0.02em; }
        .pro-cta:hover { filter: brightness(1.08); }
        @media (max-width: 640px) { .pro-h1 { font-size: 32px; } .pro-card { padding: 22px; } }
      `}</style>

      <header className="pro-wrap" style={{ paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/" style={{ color: "rgba(244,238,226,0.7)", fontSize: 12, textDecoration: "none" }}>Voltar ao site</Link>
        <Link to="/login" style={{ color: "rgba(244,238,226,0.7)", fontSize: 12, textDecoration: "none" }}>Entrar</Link>
      </header>

      <section className="pro-wrap" style={{ paddingTop: 64, paddingBottom: 48 }}>
        <Label>SalbCare Pro</Label>
        <h1 className="pro-h1">SalbCare Pro</h1>
        <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.6, color: "rgba(244,238,226,0.78)" }}>
          Prepare-se para atender pacientes internacionais no litoral do Ceara.
        </p>
      </section>

      <section className="pro-wrap" style={{ display: "grid", gap: 20, paddingBottom: 64 }}>
        <article className="pro-card">
          <Label>Oferta 01</Label>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: 24, lineHeight: 1.25, margin: "10px 0 0" }}>
            Apostila 01: Atendimento em Ingles para Profissionais de Saude
          </h2>
          <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: "rgba(244,238,226,0.75)" }}>
            Guia pratico da recepcao a cobranca, com guia clinico rapido em espanhol.
          </p>
          <div style={{ marginTop: 18, fontFamily: DISPLAY, fontSize: 32 }}>R$ 47</div>
          <a className="pro-cta" href={APOSTILA_01_PAYMENT_LINK} style={{ background: TEAL, color: NAVY }}>
            Comprar agora
          </a>
        </article>

        <article className="pro-card pro-card--gold">
          <Label>Oferta 02</Label>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: 24, lineHeight: 1.25, margin: "10px 0 0" }}>
            SalbCare Pro Fundador
          </h2>
          <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: "rgba(244,238,226,0.75)" }}>
            Plano anual para quem quer estar pronto e visivel para o paciente internacional.
          </p>
          <div style={{ marginTop: 18, fontFamily: DISPLAY, fontSize: 32 }}>
            R$ 297 <span style={{ fontFamily: MONO, fontSize: 13, color: "rgba(244,238,226,0.6)" }}>/ano</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "grid", gap: 10 }}>
            {[
              "Todas as apostilas de atendimento incluidas",
              "Perfil listado na vitrine SalbCare apos curadoria",
              "Material de preparo para pacientes internacionais",
              "Preco de fundador garantido",
            ].map((b) => (
              <li key={b} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
                <span style={{ color: GOLD }}>+</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <a className="pro-cta" href={PRO_FUNDADOR_PAYMENT_LINK} style={{ background: GOLD, color: NAVY }}>
            Assinar agora
          </a>
        </article>
      </section>

      <section className="pro-wrap" style={{ paddingBottom: 72 }}>
        <Label>Perguntas frequentes</Label>
        <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
          {FAQ.map((item) => (
            <div key={item.q} style={{ borderTop: "1px solid rgba(244,238,226,0.14)", paddingTop: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{item.q}</h3>
              <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.6, color: "rgba(244,238,226,0.7)" }}>{item.a}</p>
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
