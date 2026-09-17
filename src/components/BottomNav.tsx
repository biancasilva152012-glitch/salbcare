import { memo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, Users, DollarSign, GraduationCap, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Prefetch loaders — start downloading the chunk on hover/touch
const prefetchers: Record<string, () => Promise<unknown>> = {
  "/dashboard": () => import("@/pages/Dashboard"),
  "/dashboard/agenda": () => import("@/pages/Agenda"),
  "/dashboard/pacientes": () => import("@/pages/Patients"),
  "/dashboard/financial": () => import("@/pages/Financial"),
  "/academy": () => import("@/pages/Academy"),
  "/profile": () => import("@/pages/Profile"),
};

const navItems = [
  { to: "/dashboard", icon: Home, label: "Início" },
  { to: "/dashboard/agenda", icon: Calendar, label: "Agenda" },
  { to: "/dashboard/pacientes", icon: Users, label: "Pacientes" },
  { to: "/dashboard/financial", icon: DollarSign, label: "Financeiro" },
  { to: "/academy", icon: GraduationCap, label: "Academy" },
  { to: "/profile", icon: User, label: "Perfil" },
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

  // Whitelist: only show inside the professional workspace.
  const path = location.pathname;
  const showOn =
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    path === "/profile" ||
    path.startsWith("/profile/");
  if (!showOn) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      <div className="mx-auto flex max-w-lg items-stretch px-0.5 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            onMouseEnter={() => prefetch(to)}
            onTouchStart={() => prefetch(to)}
            className={({ isActive }) =>
              `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 pb-2 pt-2.5 transition-colors ${
                isActive ? "text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-0 h-0.5 w-7 -translate-x-1/2 rounded-full bg-secondary"
                  />
                )}
                <Icon
                  className="h-5 w-5 shrink-0"
                  style={isActive ? { color: "hsl(var(--secondary))" } : undefined}
                />
                <span
                  className="w-full truncate text-center text-[10px] font-medium leading-none"
                  style={isActive ? { color: "hsl(var(--secondary))" } : undefined}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";

export default BottomNav;
