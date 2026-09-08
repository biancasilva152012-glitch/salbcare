import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CREAM, NAVY, ProLabel, ProWordmark, SANS, proStyles } from "@/components/pro/brand";

const Offline = () => (
  <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: SANS }}>
    <Helmet>
      <title>Sem conexão | SalbCare</title>
      <meta name="robots" content="noindex" />
    </Helmet>
    <style>{proStyles}</style>

    <section className="pro-wrap pro-section">
      <ProWordmark size={30} />
      <div style={{ marginTop: 40 }}>
        <ProLabel>Sem conexão</ProLabel>
        <h1 className="pro-h1" style={{ maxWidth: 560 }}>
          Você está offline.
        </h1>
        <p className="pro-lead" style={{ marginTop: 18, maxWidth: 520 }}>
          Esta parte do SalbCare precisa de internet. O Quick Card continua disponível offline.
        </p>
        <div style={{ marginTop: 28, display: "grid", gap: 14, maxWidth: 320 }}>
          <Link to="/quick-card" className="pro-cta">
            Abrir o Quick Card
          </Link>
          <button className="pro-cta pro-cta-ghost" onClick={() => window.location.reload()}>
            Tentar de novo
          </button>
        </div>
      </div>
    </section>
  </div>
);

export default Offline;
