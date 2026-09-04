import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CREAM, DISPLAY, MONO, NAVY, TEAL } from "@/components/pro/brand";

const ProObrigado = () => {
  return (
    <div
      style={{
        background: NAVY,
        minHeight: "100vh",
        color: CREAM,
        fontFamily: MONO,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px",
      }}
    >
      <Helmet>
        <title>Pagamento confirmado. SalbCare Pro</title>
        <meta name="description" content="Pagamento confirmado. Você receberá seu material no e-mail usado na compra em até 24 horas." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <main style={{ maxWidth: 520, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ProWordmark size={30} />
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: 34, lineHeight: 1.15, margin: "14px 0 0" }}>
          Pagamento confirmado.
        </h1>
        <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.6, color: "rgba(31,31,31,0.8)" }}>
          Você receberá seu material no e-mail usado na compra em até 24 horas.
        </p>
        <p style={{ marginTop: 20, fontSize: 12, lineHeight: 1.6, color: "rgba(31,31,31,0.56)" }}>
          Payment confirmed. You will receive your material at the email used in the purchase within 24 hours.
        </p>
        <Link
          to="/"
          style={{
            display: "inline-block",
            marginTop: 32,
            background: TEAL,
            color: NAVY,
            borderRadius: 999,
            padding: "14px 26px",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Voltar ao site
        </Link>
      </main>
    </div>
  );
};

export default ProObrigado;
