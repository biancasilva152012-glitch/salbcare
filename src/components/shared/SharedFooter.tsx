import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";

export default function SharedFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-brand-darker text-white/70">
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-3">
            <BrandLogo variant="white" />
            <p className="text-sm text-white/50 max-w-xs">
              Healthcare, made human. Built in Brazil, available worldwide.
            </p>
          </div>
          <FooterCol title="Products">
            <FooterLink to="/pro">SalbCare Pro</FooterLink>
            <FooterLink to="/kite">SalbCare Kite</FooterLink>
            <span className="text-white/30">SalbCare Dental — soon</span>
          </FooterCol>
          <FooterCol title="Company">
            <FooterLink to="/about">About</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
            <FooterLink to="/journal">Journal</FooterLink>
            <span className="text-white/30">Careers — soon</span>
          </FooterCol>
          <FooterCol title="Legal">
            <FooterLink to="/privacy">Privacy</FooterLink>
            <FooterLink to="/terms">Terms</FooterLink>
            <a
              href="https://www.gov.br/anpd/pt-br"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              LGPD
            </a>
          </FooterCol>
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-white/40">
          <span>© {year} SalbCare. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="https://instagram.com/salbcare" target="_blank" rel="noreferrer" className="hover:text-white">
              Instagram
            </a>
            <a href="https://linkedin.com/company/salbcare" target="_blank" rel="noreferrer" className="hover:text-white">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">{title}</h4>
      <ul className="space-y-2 text-sm">
        {Array.isArray(children)
          ? children.map((c, i) => <li key={i}>{c}</li>)
          : <li>{children}</li>}
      </ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-white/60 hover:text-white transition-colors">
      {children}
    </Link>
  );
}
