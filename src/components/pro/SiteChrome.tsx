/**
 * Cabeçalho e rodapé compartilhados do site SalbCare (marca, PRO e Academy).
 * Mantém a mesma identidade visual editorial definida em brand.tsx.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useProSubscription } from "@/hooks/useProSubscription";
import { MONO, ProWordmark } from "./brand";

type NavItem = { label: string; to: string };

const NAV: NavItem[] = [
  { label: "Início", to: "/" },
  { label: "PRO", to: "/pro" },
  { label: "Academy", to: "/academy" },
  { label: "Quick Card", to: "/quick-card" },
  { label: "Recursos", to: "/journal" },
  { label: "Preços", to: "/pro#planos" },
];


export function SiteHeader() {
  const { isActive } = useProSubscription();
  const [open, setOpen] = useState(false);
  const accountTo = isActive ? "/pro/painel" : "/login";
  const accountLabel = isActive ? "Meu painel" : "Entrar";

  return (
    <header style={{ borderBottom: "1px solid rgba(31,31,31,0.12)" }}>
      <div
        className="pro-wrap"
        style={{
          paddingTop: 18,
          paddingBottom: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link to="/" aria-label="SalbCare" style={{ textDecoration: "none" }}>
          <ProWordmark size={30} />
        </Link>

        <nav className="pro-nav-desktop" style={{ alignItems: "center", gap: 22 }}>
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className="pro-link">
              {item.label}
            </Link>
          ))}
          <Link to={accountTo} className="pro-link">
            {accountLabel}
          </Link>
        </nav>

        <button
          type="button"
          className="pro-burger"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Fechar" : "Menu"}
        </button>
      </div>

      {open && (
        <nav id="site-menu" className="pro-wrap pro-nav-mobile" style={{ paddingBottom: 18, display: "grid" }}>
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="pro-link pro-block"
              style={{ display: "block" }}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to={accountTo}
            className="pro-link pro-block"
            style={{ display: "block" }}
            onClick={() => setOpen(false)}
          >
            {accountLabel}
          </Link>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid rgba(31,31,31,0.12)" }}>
      <div className="pro-wrap" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontFamily: MONO, fontSize: 12 }}>
          <Link to="/pro" className="pro-link">
            SalbCare PRO
          </Link>
          <Link to="/academy" className="pro-link">
            Academy
          </Link>
          <Link to="/quick-card" className="pro-link">
            Quick Card
          </Link>

          <Link to="/terms" className="pro-link">
            Termos de uso
          </Link>
          <Link to="/privacy" className="pro-link">
            Política de privacidade
          </Link>
          <Link to="/legal" className="pro-link">
            Informações legais
          </Link>
          <Link to="/about" className="pro-link">
            Sobre
          </Link>
          <Link to="/contact" className="pro-link">
            Contato
          </Link>
        </div>
        <p className="pro-mono" style={{ marginTop: 20, maxWidth: 640, lineHeight: 1.6 }}>
          A SalbCare fornece software de gestão de consultório e materiais educacionais para profissionais de saúde.
          O valor de cada atendimento é definido pelo próprio profissional e a SalbCare não cobra comissão por consulta.
        </p>
        <p className="pro-mono" style={{ marginTop: 12 }}>
          © {new Date().getFullYear()} SalbCare.
        </p>

      </div>
    </footer>
  );
}
