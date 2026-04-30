import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import InstallStepsContent from "@/components/pwa/InstallStepsContent";
import logoSalb from "/pwa-icon-512.png";

const NAVY = "#0D1B2A";
const TEAL = "#00B4A0";
const MINT_BG = "#F0FDFA";

const InstallApp = () => {
  return (
    <>
      <SEOHead
        title="Instalar o app SalbCare | Tutorial passo a passo"
        description="Instale o SalbCare na tela inicial do seu celular ou computador. Tutorial passo a passo para iPhone, Android, Chrome, Edge e Safari."
        canonical="/instalar-app"
      />
      <div
        className="min-h-screen"
        style={{ background: MINT_BG, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <div className="mx-auto max-w-2xl px-5 sm:px-6 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm mb-6"
            style={{ color: "#64748B" }}
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para o início
          </Link>

          <div className="flex flex-col items-center text-center mb-6">
            <img src={logoSalb} alt="SalbCare" width={64} height={64} className="rounded-2xl mb-3" />
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>
              Instale o SalbCare no seu dispositivo
            </h1>
            <p className="text-sm sm:text-base mt-2 max-w-md" style={{ color: "#64748B" }}>
              Tenha seu consultório de bolso sempre à mão — acesso rápido, sem abrir o navegador.
            </p>
          </div>

          <div
            className="rounded-2xl p-5 sm:p-6 bg-white"
            style={{ border: "1px solid #E2E8F0" }}
          >
            <InstallStepsContent />
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "#64748B" }}>
            Está com dúvida? Fale com a gente no WhatsApp{" "}
            <a
              href="https://wa.me/5588996924700"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2"
              style={{ color: TEAL }}
            >
              +55 88 99692-4700
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default InstallApp;
