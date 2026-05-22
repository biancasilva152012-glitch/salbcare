import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import BrandLogo from "@/components/shared/BrandLogo";
import SharedFooter from "@/components/shared/SharedFooter";

const WHATSAPP = "5588996924700";
const EMAIL = "biancadealbuquerquep@gmail.com";

export default function Contact() {
  return (
    <>
      <Helmet>
        <title>Contact SalbCare</title>
        <meta name="description" content="Reach the SalbCare team by email or WhatsApp. Support for professionals (Pro) and travelers (Kite)." />
        <link rel="canonical" href="https://salbcare.com/contact" />
      </Helmet>

      <div className="min-h-screen bg-brand-dark text-white font-body flex flex-col">
        <header className="container mx-auto px-6 py-5 flex items-center justify-between">
          <BrandLogo variant="white" />
          <nav className="flex items-center gap-5 text-sm">
            <Link to="/" className="text-white/70 hover:text-white">Home</Link>
            <Link to="/about" className="text-white/70 hover:text-white">About</Link>
          </nav>
        </header>

        <main className="flex-1 container mx-auto px-6 py-16 md:py-28 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kite-gold mb-5">CONTACT</p>
          <h1 className="font-heading text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1] mb-8">
            Talk to us.
          </h1>
          <p className="text-white/70 leading-relaxed mb-10">
            One team behind both products. Reach us directly — we read every message.
          </p>

          <div className="grid gap-4">
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-5"
            >
              <p className="text-xs uppercase tracking-wider text-kite-gold mb-1">WhatsApp</p>
              <p className="font-heading text-lg">+55 88 99692-4700</p>
              <p className="text-sm text-white/50 mt-1">Fastest way to get a response.</p>
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="block rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-5"
            >
              <p className="text-xs uppercase tracking-wider text-pro-accent mb-1">Email</p>
              <p className="font-heading text-lg break-all">{EMAIL}</p>
              <p className="text-sm text-white/50 mt-1">For partnerships, press and detailed questions.</p>
            </a>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 gap-4">
            <Link to="/pro" className="rounded-xl border border-pro-accent/30 p-5 hover:border-pro-accent/60 transition-colors">
              <p className="text-xs uppercase tracking-wider text-pro-accent mb-1">Are you a professional?</p>
              <p className="font-heading">Go to SalbCare Pro →</p>
            </Link>
            <Link to="/kite" className="rounded-xl border border-kite-gold/30 p-5 hover:border-kite-gold/60 transition-colors">
              <p className="text-xs uppercase tracking-wider text-kite-gold mb-1">Are you a traveler?</p>
              <p className="font-heading">Go to SalbCare Kite →</p>
            </Link>
          </div>
        </main>

        <SharedFooter />
      </div>
    </>
  );
}
