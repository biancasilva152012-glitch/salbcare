import { memo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, Users, DollarSign, User } from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Painel" },
  { to: "/agenda", icon: Calendar, label: "Agenda" },
  { to: "/patients", icon: Users, label: "Pacientes" },
  { to: "/financial", icon: DollarSign, label: "Financeiro" },
  { to: "/profile", icon: User, label: "Meu perfil" },
];

const BottomNav = memo(() => {
  const location = useLocation();
  const hideOn = ["/", "/login", "/register", "/forgot-password", "/terms", "/privacy", "/como-funciona", "/patient-dashboard", "/onboarding"];
  if (hideOn.includes(location.pathname)) return null;
  if (location.pathname.startsWith("/booking") || location.pathname.startsWith("/consulta-online") || location.pathname.startsWith("/sala") || location.pathname.startsWith("/patient-dashboard") || location.pathname.startsWith("/pronto-atendimento") || location.pathname.startsWith("/meu-historico") || location.pathname.startsWith("/acompanhamento")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-2xl">
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
    </nav>
  );
};

export default BottomNav;
