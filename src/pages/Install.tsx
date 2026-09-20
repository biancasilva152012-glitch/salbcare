import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { isIos, useInstallPrompt } from "@/components/pro/InstallPrompt";
import { Download, LayoutDashboard, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="admin-theme min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Instalar o app SalbCare</title>
        <meta name="description" content="Como instalar o SalbCare no seu celular e abrir o painel e o Quick Card sem navegador." />
      </Helmet>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4"><Link to="/" className="font-heading text-xl font-semibold">SalbCare</Link><span className="admin-eyebrow">Instalação</span></div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:py-12">
        <section><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Smartphone className="h-6 w-6" /></span><p className="admin-eyebrow mt-5">Instalar</p><h1 className="mt-1 max-w-xl text-3xl sm:text-4xl">Tenha o SalbCare como app no seu celular.</h1><p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">Depois de instalado, o SalbCare abre em tela cheia. Administradores podem entrar diretamente em Operação pelo atalho do app.</p>

        {canInstall && (
          <Button className="mt-6 min-h-12 w-full gap-2 sm:w-auto" onClick={() => void install()}><Download className="h-4 w-4" /> Instalar agora</Button>
        )}

        <ol className="mt-8 grid max-w-xl gap-3">
          {steps.map((s) => (
            <li key={s} className="admin-card flex gap-3 p-4 text-sm leading-relaxed"><span className="admin-num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{steps.indexOf(s) + 1}</span>{s}</li>
          ))}
        </ol>

        <p className="mt-5 text-sm text-muted-foreground">
          {ios
            ? "No iPhone a instalação é feita pelo Safari. Em outros navegadores a opção não aparece."
            : "No iPhone, abra este mesmo endereço no Safari e use Adicionar à Tela de Início."}
        </p>

        </section>
        <section className="grid gap-3 sm:grid-cols-2"><Button asChild variant="outline" className="min-h-12 justify-start gap-2"><Link to="/dashboard"><LayoutDashboard className="h-4 w-4 text-secondary" /> Abrir painel profissional</Link></Button><Button asChild variant="outline" className="min-h-12 justify-start gap-2"><Link to="/admin/operacao"><ShieldCheck className="h-4 w-4 text-secondary" /> Abrir administração</Link></Button></section>
      </main>
    </div>
  );
};

export default Install;
