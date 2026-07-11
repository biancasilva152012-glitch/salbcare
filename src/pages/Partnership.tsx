import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Mail, ShieldCheck } from "lucide-react";
import logoSalb from "/pwa-icon-512.png";

const BRAND = { teal: "#00B4A0", tealDark: "#008C7C", ink: "#0D1B2A", cream: "#F8F9FA" };

const WHATSAPP_NUMBER = "5588996924700";
const PARTNER_EMAIL = "biancadealbuquerquep@gmail.com";

const WA_MESSAGE =
  "Hello SalbCare team, I would like to know more about becoming a partner and joining the SalbCare Local Partner Network.";

const EMAIL_SUBJECT = "Partnership Opportunity - SalbCare";
const EMAIL_BODY = `Hello SalbCare team,

I am interested in becoming a partner and joining the SalbCare Local Partner Network.

I would like to receive more information about partnership opportunities.

Thank you.`;

export default function Partnership() {
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;
  const mailUrl = `mailto:${PARTNER_EMAIL}?subject=${encodeURIComponent(
    EMAIL_SUBJECT,
  )}&body=${encodeURIComponent(EMAIL_BODY)}`;

  return (
    <div className="min-h-screen" style={{ background: BRAND.cream, color: BRAND.ink }}>
      <Helmet>
        <html lang="en" />
        <title>Become a SalbCare Partner | SalbCare Local Partner Network</title>
        <meta
          name="description"
          content="Join the SalbCare Local Partner Network. Trusted healthcare and local partners connecting with international patients and tourists."
        />
        <link rel="canonical" href="https://salbcare.com/partnership" />
      </Helmet>

      <header className="px-5 py-5 border-b border-black/[0.06] bg-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/kite" className="inline-flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <img src={logoSalb} alt="SalbCare" width={28} height={28} style={{ width: 28, height: 28 }} />
            <span className="font-semibold">SalbCare</span>
          </div>
        </div>
      </header>

      <main className="px-5 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] px-3 py-1.5 rounded-full mb-6"
            style={{ background: `${BRAND.teal}15`, color: BRAND.tealDark }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            SALBCARE LOCAL PARTNER NETWORK
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: BRAND.ink }}>
            Become a SalbCare Partner
          </h1>

          <p className="text-lg md:text-xl leading-relaxed mb-4" style={{ color: BRAND.ink, opacity: 0.85 }}>
            Are you a healthcare professional, hotel, pousada, restaurant or local business
            interested in partnering with SalbCare?
          </p>

          <p className="text-base leading-relaxed mb-10" style={{ color: BRAND.ink, opacity: 0.65 }}>
            We select our partners carefully to create a trusted network for our community.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 hover:brightness-110"
              style={{
                background: "#25D366",
                color: "#fff",
                minHeight: 56,
                padding: "0 28px",
                fontSize: 15,
              }}
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>
            <a
              href={mailUrl}
              className="inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 hover:brightness-110"
              style={{
                background: BRAND.ink,
                color: "#fff",
                minHeight: 56,
                padding: "0 28px",
                fontSize: 15,
              }}
            >
              <Mail className="h-5 w-5" />
              Email
            </a>
          </div>

          <div className="mt-16 grid sm:grid-cols-3 gap-4 text-left">
            {[
              {
                h: "Curated network",
                b: "Every partner is selected and verified by the SalbCare team.",
              },
              {
                h: "International reach",
                b: "Connect with tourists, kitesurfers and international patients.",
              },
              {
                h: "Trusted concierge",
                b: "SalbCare acts as the bridge between visitors and local businesses.",
              },
            ].map((f) => (
              <div key={f.h} className="p-5 rounded-2xl bg-white border border-black/[0.06]">
                <div className="font-semibold mb-1" style={{ color: BRAND.ink }}>
                  {f.h}
                </div>
                <div className="text-sm" style={{ color: BRAND.ink, opacity: 0.65 }}>
                  {f.b}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer
        className="px-5 py-10 text-center text-sm"
        style={{ background: BRAND.ink, color: BRAND.cream }}
      >
        Wherever you are, SalbCare connects you with trusted local partners.
      </footer>
    </div>
  );
}
