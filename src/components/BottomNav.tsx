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
  const hideOn = ["/", "/login", "/register", "/forgot-password", "/terms", "/privacy", "/como-funciona"];
  if (hideOn.includes(location.pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2.5 px-3 text-xs transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Legal footer */}
      <div className="text-center px-4 pb-2 space-y-1">
        <p className="text-[9px] text-muted-foreground/40 leading-relaxed">
          A SALBCARE é uma plataforma de gestão e não substitui orientação médica, jurídica ou contábil profissional.
        </p>
        <div className="flex items-center justify-center gap-2 text-[9px] text-muted-foreground/40">
          <span>SALBCARE Tecnologia LTDA</span>
          <span>•</span>
          <a href="mailto:contato@salbcare.com.br" className="hover:text-muted-foreground transition-colors">contato@salbcare.com.br</a>
        </div>
        <div className="flex items-center justify-center gap-3 text-[10px]">
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
