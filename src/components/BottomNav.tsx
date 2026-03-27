import { NavLink, useLocation, Link } from "react-router-dom";
import { Home, Calendar, Users, DollarSign, User } from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Painel" },
  { to: "/agenda", icon: Calendar, label: "Agenda" },
  { to: "/patients", icon: Users, label: "Pacientes" },
  { to: "/financial", icon: DollarSign, label: "Financeiro" },
  { to: "/profile", icon: User, label: "Meu perfil" },
];

const BottomNav = () => {
  const location = useLocation();
  const hideOn = ["/", "/login", "/register", "/forgot-password", "/terms", "/privacy", "/como-funciona", "/patient-dashboard"];
  if (hideOn.includes(location.pathname)) return null;
  if (location.pathname.startsWith("/booking") || location.pathname.startsWith("/consulta-online") || location.pathname.startsWith("/sala") || location.pathname.startsWith("/patient-dashboard") || location.pathname.startsWith("/pronto-atendimento") || location.pathname.startsWith("/meu-historico") || location.pathname.startsWith("/acompanhamento")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-2xl">
      {/* Navigation icons */}
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-xs transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium text-center leading-tight">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Legal footer — centered and properly aligned */}
      <div className="text-center px-4 pb-2 space-y-1">
        <p className="text-[9px] text-muted-foreground/40 leading-relaxed">
          A SalbCare é uma plataforma de gestão e não substitui orientação médica, jurídica ou contábil profissional.
        </p>
        <p className="text-[9px] text-muted-foreground/40">
          contato@salbcare.com.br
        </p>
        <p className="text-[9px] text-muted-foreground/40">
          SALBCARE Tecnologia LTDA
        </p>
        <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 text-[10px]">
          <Link to="/terms" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            Termos de Uso
          </Link>
          <Link to="/privacy" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            Política de Privacidade
          </Link>
          <Link to="/como-funciona" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            Como funciona
          </Link>
          <a href="mailto:contato@salbcare.com.br" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            Fale conosco
          </a>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
