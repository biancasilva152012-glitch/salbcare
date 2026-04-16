import { memo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, Users, DollarSign, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Prefetch loaders — start downloading the chunk on hover/touch
const prefetchers: Record<string, () => Promise<unknown>> = {
  "/dashboard": () => import("@/pages/Dashboard"),
  "/dashboard/agenda": () => import("@/pages/Agenda"),
  "/dashboard/pacientes": () => import("@/pages/Patients"),
  "/dashboard/financial": () => import("@/pages/Financial"),
  "/profile": () => import("@/pages/Profile"),
};

const navItems = [
  { to: "/dashboard", icon: Home, label: "Painel" },
  { to: "/dashboard/agenda", icon: Calendar, label: "Agenda" },
  { to: "/dashboard/pacientes", icon: Users, label: "Pacientes" },
  { to: "/dashboard/financial", icon: DollarSign, label: "Financeiro" },
  { to: "/profile", icon: User, label: "Meu perfil" },
];

const prefetched = new Set<string>();
const prefetch = (to: string) => {
  if (prefetched.has(to)) return;
  prefetched.add(to);
  prefetchers[to]?.().catch(() => prefetched.delete(to));
};

const BottomNav = memo(() => {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const hideOn = ["/", "/login", "/register", "/cadastro", "/forgot-password", "/terms", "/privacy", "/para-profissionais", "/planos", "/diagnostico", "/admin", "/profissionais", "/consulta-online", "/especialidades", "/blog", "/index", "/pronto-atendimento", "/precos"];
  if (hideOn.includes(location.pathname)) return null;
  if (location.pathname.startsWith("/p/")) return null;
  if (location.pathname.startsWith("/consulta-online/")) return null;
  if (location.pathname.startsWith("/blog/")) return null;
  if (location.pathname.startsWith("/pronto-atendimento/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            onMouseEnter={() => prefetch(to)}
            onTouchStart={() => prefetch(to)}
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
