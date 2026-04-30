import { Share, MoreVertical, PlusSquare, Download, AlertTriangle, Zap, WifiOff, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlatformDetection } from "@/hooks/usePlatformDetection";
import { usePWAInstall } from "@/contexts/PWAInstallContext";
import { useState } from "react";

const TEAL = "#00B4A0";
const NAVY = "#0D1B2A";

interface Step {
  text: React.ReactNode;
}

const Numbered = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <span
      aria-hidden
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white font-semibold text-sm"
      style={{ background: TEAL }}
    >
      {n}
    </span>
    <span className="pt-1 text-sm font-medium" style={{ color: NAVY, fontWeight: 500 }}>
      {children}
    </span>
  </li>
);

const Warning = ({ children }: { children: React.ReactNode }) => (
  <div
    role="note"
    className="flex items-start gap-2 rounded-xl p-3 text-sm"
    style={{ background: "#FFF7ED", border: "1px solid #FED7AA", color: "#9A3412" }}
  >
    <AlertTriangle aria-hidden className="h-4 w-4 mt-0.5 shrink-0" />
    <div>{children}</div>
  </div>
);

const Benefits = () => (
  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
    {[
      { icon: Zap, title: "Acesso instantâneo", desc: "Abra direto da tela inicial" },
      { icon: WifiOff, title: "Funciona offline", desc: "Algumas funções sem internet" },
      { icon: Bell, title: "Notificações", desc: "Alertas de agenda e mensagens" },
    ].map(({ icon: Icon, title, desc }) => (
      <li key={title} className="rounded-xl p-3" style={{ background: "#F0FAFA" }}>
        <Icon aria-hidden className="h-5 w-5 mb-1.5" style={{ color: TEAL }} />
        <p className="text-sm font-semibold" style={{ color: NAVY }}>{title}</p>
        <p className="text-xs" style={{ color: "#64748B" }}>{desc}</p>
      </li>
    ))}
  </ul>
);

const InstallStepsContent = () => {
  const { platform, browser, isStandalone } = usePlatformDetection();
  const { canInstallNatively, triggerInstall, isInstalled } = usePWAInstall();
  const [manualOpen, setManualOpen] = useState(false);

  if (isInstalled || isStandalone) {
    return (
      <div className="space-y-3 text-center">
        <Benefits />
        <p className="text-sm font-medium" style={{ color: NAVY }}>
          ✅ O SalbCare já está instalado neste dispositivo. Abra pelo ícone na tela inicial.
        </p>
      </div>
    );
  }

  const NativeButton = (
    <Button
      onClick={() => triggerInstall()}
      className="w-full text-base py-6 gap-2 rounded-2xl font-semibold transition-transform hover:scale-[1.02]"
      style={{ background: `linear-gradient(135deg, ${TEAL}, ${NAVY})`, color: "#fff" }}
      aria-label="Instalar agora"
    >
      <Download aria-hidden className="h-5 w-5" />
      Instalar agora
    </Button>
  );

  const androidManual: Step[] = [
    { text: <>Toque nos três pontinhos <MoreVertical aria-label="menu" className="inline h-4 w-4" /> no canto superior direito</> },
    { text: <>Selecione <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong></> },
    { text: <>Confirme tocando em <strong>"Instalar"</strong></> },
    { text: <>Pronto! O ícone do SalbCare aparecerá na sua tela inicial</> },
  ];

  const iosSteps: Step[] = [
    { text: <>Toque no ícone de compartilhar <Share aria-label="compartilhar" className="inline h-4 w-4" /> na barra inferior do Safari</> },
    { text: <>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></> },
    { text: <>Confirme tocando em <strong>"Adicionar"</strong> no canto superior direito</> },
    { text: <>Pronto! Abra o SalbCare direto da sua tela de início como qualquer app</> },
  ];

  const desktopChromeManual: Step[] = [
    { text: <>Clique no ícone de instalação <PlusSquare aria-label="instalar" className="inline h-4 w-4" /> à direita da barra de endereços</> },
    { text: <>Ou clique nos três pontinhos <MoreVertical aria-label="menu" className="inline h-4 w-4" /> → <strong>"Instalar SalbCare..."</strong></> },
    { text: <>Confirme clicando em <strong>"Instalar"</strong></> },
    { text: <>O app abrirá em uma janela própria, como um programa</> },
  ];

  const desktopSafariSteps: Step[] = [
    { text: <>Clique em <strong>"Arquivo"</strong> no menu superior</> },
    { text: <>Selecione <strong>"Adicionar ao Dock"</strong></> },
    { text: <>Pronto! O SalbCare ficará disponível no Dock como um app</> },
  ];

  // Render por plataforma
  if (platform === "android" && (browser === "chrome" || browser === "samsung")) {
    return (
      <div className="space-y-4">
        <Benefits />
        {canInstallNatively ? (
          <>
            {NativeButton}
            <button
              type="button"
              onClick={() => setManualOpen((v) => !v)}
              className="text-sm underline-offset-4 hover:underline w-full text-center"
              style={{ color: "#64748B" }}
            >
              {manualOpen ? "Ocultar instruções manuais" : "Prefiro instalar manualmente"}
            </button>
            {manualOpen && (
              <ol className="space-y-3 pt-2">
                {androidManual.map((s, i) => <Numbered key={i} n={i + 1}>{s.text}</Numbered>)}
              </ol>
            )}
          </>
        ) : (
          <ol className="space-y-3">
            {androidManual.map((s, i) => <Numbered key={i} n={i + 1}>{s.text}</Numbered>)}
          </ol>
        )}
      </div>
    );
  }

  if (platform === "ios" && browser === "safari") {
    return (
      <div className="space-y-4">
        <Benefits />
        <ol className="space-y-3">
          {iosSteps.map((s, i) => <Numbered key={i} n={i + 1}>{s.text}</Numbered>)}
        </ol>
        <Warning>
          <strong>Importante:</strong> no iPhone/iPad a instalação só funciona pelo Safari.
        </Warning>
      </div>
    );
  }

  if (platform === "ios" && browser !== "safari") {
    return (
      <div className="space-y-4">
        <Benefits />
        <Warning>
          Para instalar no iPhone/iPad, abra esta página no <strong>Safari</strong>. Toque em compartilhar
          <Share aria-hidden className="inline h-4 w-4 mx-1" /> e depois em <strong>"Abrir no Safari"</strong>.
        </Warning>
        <ol className="space-y-3 opacity-90">
          {iosSteps.map((s, i) => <Numbered key={i} n={i + 1}>{s.text}</Numbered>)}
        </ol>
      </div>
    );
  }

  if (platform === "desktop-chrome" || platform === "desktop-edge") {
    return (
      <div className="space-y-4">
        <Benefits />
        {canInstallNatively ? (
          <>
            {NativeButton}
            <p className="text-xs text-center" style={{ color: "#64748B" }}>
              Ou clique no ícone de instalação <PlusSquare aria-hidden className="inline h-3.5 w-3.5" /> na barra de endereços.
            </p>
          </>
        ) : (
          <ol className="space-y-3">
            {desktopChromeManual.map((s, i) => <Numbered key={i} n={i + 1}>{s.text}</Numbered>)}
          </ol>
        )}
      </div>
    );
  }

  if (platform === "desktop-safari") {
    return (
      <div className="space-y-4">
        <Benefits />
        <ol className="space-y-3">
          {desktopSafariSteps.map((s, i) => <Numbered key={i} n={i + 1}>{s.text}</Numbered>)}
        </ol>
      </div>
    );
  }

  if (browser === "firefox") {
    return (
      <div className="space-y-4">
        <Benefits />
        <Warning>
          O Firefox não oferece suporte completo à instalação como app. Recomendamos usar
          <strong> Chrome </strong> ou <strong> Edge </strong> para a melhor experiência.
          Você ainda pode adicionar esta página aos favoritos para acesso rápido.
        </Warning>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Benefits />
      <Warning>
        Não foi possível detectar seu navegador. Use o menu do seu navegador e procure por
        <strong> "Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
      </Warning>
    </div>
  );
};

export default InstallStepsContent;
