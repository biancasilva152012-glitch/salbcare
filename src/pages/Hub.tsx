import SEOHead from "@/components/SEOHead";

type HubLink = {
  emoji: string;
  title: string;
  description: string;
  href: string;
};

const LINKS: HubLink[] = [
  {
    emoji: "🪁",
    title: "SalbCare Kite · Guajiru",
    description: "Entra no grupo da tribo do vento",
    href: "https://chat.whatsapp.com/KVHchlB6w6d1CWpI8I3EBZ",
  },
  {
    emoji: "🩺",
    title: "Preciso de saúde agora",
    description: "Dentista, fisio, médico, urgência",
    href: "https://wa.me/5588996924700",
  },
  {
    emoji: "🌎",
    title: "Conhecer a SalbCare",
    description: "O que somos e como funciona",
    href: "/",
  },
  {
    emoji: "📩",
    title: "Sou parceiro / quero indicar",
    description: "Pousada, instrutor, serviço",
    href: "https://wa.me/5588996924700",
  },
];

export default function Hub() {
  return (
    <>
      <SEOHead
        title="SalbCare · Conexão que cuida"
        description="Ecossistema que conecta quem viaja a quem cuida, no litoral. Acesso rápido ao grupo do Kite, atendimento de saúde e parcerias."
        canonical="/hub"
        ogType="website"
      />

      <main className="min-h-screen bg-brand-dark text-white font-body">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-5 pt-14 pb-10 sm:pt-20">
          {/* Brand mark */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-kite-gold/40 bg-brand-darker/60 text-2xl">
              🌊
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              SalbCare · Conexão que cuida
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
              Não é só saúde. É um ecossistema que conecta quem viaja a quem
              cuida, no litoral.
            </p>
          </div>

          {/* Links */}
          <nav className="flex w-full flex-col gap-3">
            {LINKS.map((link) => {
              const isExternal = /^https?:/i.test(link.href);
              const commonClass =
                "group flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-brand-darker/70 px-4 py-4 text-left transition-all hover:border-kite-gold/50 hover:bg-brand-darker active:scale-[0.99]";
              const inner = (
                <>
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl"
                  >
                    {link.emoji}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-heading text-base font-semibold text-white">
                      {link.title}
                    </span>
                    <span className="mt-0.5 truncate text-xs text-white/60 sm:text-sm">
                      {link.description}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-white/40 transition-colors group-hover:text-kite-gold"
                  >
                    →
                  </span>
                </>
              );

              return (
                <a
                  key={link.title}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={commonClass}
                >
                  {inner}
                </a>
              );
            })}
          </nav>

          {/* Footer */}
          <footer className="mt-10 text-center text-xs text-white/45">
            @salbcare.kite · Ilha do Guajiru, Ceará
          </footer>
        </div>
      </main>
    </>
  );
}
