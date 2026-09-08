import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { CREAM, NAVY, ProLabel, ProWordmark, SANS, proStyles } from "@/components/pro/brand";
import { isIos, useInstallPrompt } from "@/components/pro/InstallPrompt";

const STEPS_ANDROID = [
  "Abra salbcare.com no Chrome ou no Edge.",
  "Toque no menu do navegador, com os três pontos.",
  "Escolha Instalar app ou Adicionar à tela inicial.",
  "Confirme. O SalbCare aparece como um app no seu celular.",
];

const STEPS_IOS = [
  "Abra salbcare.com no Safari.",
  "Toque no botão Compartilhar, o quadrado com a flecha.",
  "Escolha Adicionar à Tela de Início.",
  "Toque em Adicionar. O SalbCare abre sem a barra do navegador.",
];

const Install = () => {
  const { canInstall, install } = useInstallPrompt();
  const ios = typeof window !== "undefined" && isIos();
  const steps = ios ? STEPS_IOS : STEPS_ANDROID;

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: SANS }}>
      <Helmet>
        <title>Instalar o app SalbCare</title>
        <meta name="description" content="Como instalar o SalbCare no seu celular e abrir o painel e o Quick Card sem navegador." />
      </Helmet>
      <style>{proStyles}</style>

      <header style={{ borderBottom: "1px solid rgba(10,22,40,0.12)" }}>
        <div className="pro-wrap" style={{ paddingTop: 18, paddingBottom: 18 }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <ProWordmark size={30} />
          </Link>
        </div>
      </header>

      <section className="pro-wrap pro-section">
        <ProLabel>Instalar</ProLabel>
        <h1 className="pro-h1" style={{ maxWidth: 620 }}>
          Tenha o SalbCare como app no seu celular.
        </h1>
        <p className="pro-lead" style={{ marginTop: 18, maxWidth: 560 }}>
          Instalado, o SalbCare abre em tela cheia, carrega mais rápido e o Quick Card funciona mesmo sem internet.
        </p>

        {canInstall && (
          <div style={{ marginTop: 28 }}>
            <button className="pro-cta" onClick={() => void install()}>
              Instalar agora
            </button>
          </div>
        )}

        <ol className="pro-body" style={{ marginTop: 32, paddingLeft: 20, display: "grid", gap: 12, maxWidth: 560 }}>
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <p className="pro-note" style={{ marginTop: 28 }}>
          {ios
            ? "No iPhone a instalação é feita pelo Safari. Em outros navegadores a opção não aparece."
            : "No iPhone, abra este mesmo endereço no Safari e use Adicionar à Tela de Início."}
        </p>

        <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 16 }}>
          <Link to="/quick-card" className="pro-link">
            Abrir o Quick Card
          </Link>
          <Link to="/pro" className="pro-link">
            Conhecer o SalbCare PRO
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Install;
