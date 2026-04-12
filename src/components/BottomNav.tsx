import { memo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, DollarSign, Compass, Video, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Painel" },
  { to: "/dashboard/financeiro", icon: DollarSign, label: "Financeiro" },
  { to: "/dashboard/mentoria", icon: Compass, label: "Mentoria" },
  { to: "/dashboard/teleconsulta", icon: Video, label: "Teleconsulta" },
  { to: "/profile", icon: User, label: "Perfil" },
];

const BottomNav = memo(() => {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const hideOn = ["/", "/login", "/register", "/cadastro", "/forgot-password", "/terms", "/privacy", "/para-profissionais", "/planos", "/diagnostico", "/admin"];
  if (hideOn.includes(location.pathname)) return null;
  if (location.pathname.startsWith("/p/")) return null;

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
});

BottomNav.displayName = "BottomNav";

export default BottomNav;
