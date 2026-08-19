import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import BrandLogo from "@/components/shared/BrandLogo";
import SharedFooter from "@/components/shared/SharedFooter";

export default function About() {
  return (
    <>
      <Helmet>
        <title>About SalbCare — Healthcare, made human</title>
        <meta
          name="description"
          content="SalbCare is a healthcare platform built around one belief: access to good care shouldn't depend on where you are, what language you speak, or how much you earn."
        />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://salbcare.com/about" />
      </Helmet>

      <div className="min-h-screen bg-brand-dark text-white font-body flex flex-col">
        <header className="container mx-auto px-6 py-5 flex items-center justify-between">
          <BrandLogo variant="white" />
          <nav className="flex items-center gap-5 text-sm">
            <Link to="/" className="text-white/70 hover:text-white">Home</Link>
            <Link to="/contact" className="text-white/70 hover:text-white">Contact</Link>
          </nav>
        </header>

        <main className="flex-1 container mx-auto px-6 py-16 md:py-28 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kite-gold mb-5">
            ABOUT SALBCARE
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1] mb-8 text-balance">
            Healthcare shouldn't depend on where you are.
          </h1>
          <div className="space-y-5 text-white/75 leading-relaxed text-base md:text-lg">
            <p>
              SalbCare is a healthcare platform built around one belief: access to good care
              shouldn't depend on where you are, what language you speak, or how much you earn.
            </p>
            <p>
              We started in Brazil, helping autonomous health professionals — psychologists,
              nutritionists, physicians, physiotherapists — run their practices without the
              friction of legacy enterprise software. That's <Link to="/pro" className="text-pro-accent hover:underline">SalbCare Pro</Link>.
            </p>
            <p>
              Hoje a SalbCare e um software de gestao de consultorio para dentistas e
              fisioterapeutas autonomos: agenda, pacientes, financeiro e a pagina de
              agendamento do proprio profissional, com modulo internacional opcional.
            </p>
            <p>
              Somos tecnologia. O atendimento e sempre do profissional.
            </p>
          </div>
        </main>

        <SharedFooter />
      </div>
    </>
  );
}
