// build: 2026-05-23 — minimalist hub: header, hero, cards, single proof, footer.
import { Link } from "react-router-dom";
import { useEffect } from "react";

import SEOHead from "@/components/SEOHead";
import { trackViewContent, setupScrolledHalfwayTracking } from "@/hooks/useTracking";
import BrandHubLayer from "@/components/landing/BrandHubLayer";
import { buildWhatsAppUrl, WHATSAPP_DISPLAY } from "@/lib/whatsapp";

const DEEP_TEAL = "#0F2A33";
const DEEP_TEAL_ALT = "#0A1F26";
const TEXT_MUTED = "#7FA0A8";
const BORDER_TEAL = "#2A4A52";

const Index = () => {
  useEffect(() => {
    trackViewContent("SalbCare Landing Page", "Homepage");
    const cleanup = setupScrolledHalfwayTracking();
    return cleanup;
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SalbCare",
    url: "https://salbcare.com.br",
    logo: "https://salbcare.com.br/pwa-icon-512.png",
  };

  const linkStyle: React.CSSProperties = {
    color: TEXT_MUTED,
    fontSize: 14,
    textDecoration: "none",
    transition: "color 150ms ease",
  };

  return (
    <>
      <SEOHead
        title="SalbCare — Health, made human"
        description="Healthcare platform for health professionals in Brazil and international travelers in Ilha do Guajiru. English, Spanish and Portuguese."
        canonical="/"
        jsonLd={jsonLd}
      />

      <style>{`
        .salb-footer-link:hover { color: #fff !important; }
      `}</style>

      <BrandHubLayer />

      <div id="pro-landing-content" style={{ background: DEEP_TEAL_ALT }}>
        <PainShockSection />
      </div>

      <footer
        style={{
          background: DEEP_TEAL,
          borderTop: `1px solid ${BORDER_TEAL}`,
          padding: "64px 24px 32px",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 40,
              marginBottom: 40,
            }}
          >
            <div>
              <Link to="/" aria-label="SalbCare" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <img src="/pwa-icon-192.png" alt="" width={32} height={32} style={{ borderRadius: 8 }} />
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>SalbCare</span>
              </Link>
              <p style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>
                Health, made human.
              </p>
            </div>

            <div>
              <h3 style={{ color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                Products
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                <li><Link to="/pro" className="salb-footer-link" style={linkStyle}>SalbCare Pro</Link></li>
                <li><Link to="/kite" className="salb-footer-link" style={linkStyle}>SalbCare Kite</Link></li>
              </ul>
            </div>

            <div>
              <h3 style={{ color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                Company
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                <li><Link to="/about" className="salb-footer-link" style={linkStyle}>About</Link></li>
                <li><Link to="/contact" className="salb-footer-link" style={linkStyle}>Contact</Link></li>
                <li><Link to="/terms" className="salb-footer-link" style={linkStyle}>Terms</Link></li>
                <li><Link to="/privacy" className="salb-footer-link" style={linkStyle}>Privacy</Link></li>
              </ul>
            </div>

            <div>
              <h3 style={{ color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                Connect
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                <li>
                  <a href="https://instagram.com/salbcare" target="_blank" rel="noopener noreferrer" className="salb-footer-link" style={linkStyle}>
                    Instagram ↗
                  </a>
                </li>
                <li>
                  <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="salb-footer-link" style={linkStyle}>
                    WhatsApp {WHATSAPP_DISPLAY} ↗
                  </a>
                </li>
                <li>
                  <a href="mailto:biancadealbuquerquep@gmail.com" className="salb-footer-link" style={linkStyle}>
                    Email ↗
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${BORDER_TEAL}`, paddingTop: 24, color: TEXT_MUTED, fontSize: 12, textAlign: "center" }}>
            © {new Date().getFullYear()} SalbCare. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
};

export default Index;
