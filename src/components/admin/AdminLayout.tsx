import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, BarChart3, Database, ScrollText, Settings, LogOut, ChevronLeft, ChevronRight, LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const NAV_ITEMS = [
  { label: "Visão Geral", icon: LayoutDashboard, path: "/admin" },
  { label: "Usuários", icon: Users, path: "/admin/users" },
  { label: "Financeiro", icon: BarChart3, path: "/admin/finance" },
  { label: "Banco de Dados", icon: Database, path: "/admin/database" },
  { label: "Logs", icon: ScrollText, path: "/admin/logs" },
  { label: "Configurações", icon: Settings, path: "/admin/settings" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    // Ensure session token is available before RPC call
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data, error }) => {
        if (error || !data) {
          navigate("/dashboard", { replace: true });
          return;
        }
        setIsAdmin(true);
      });
    });
  }, [user, authLoading, navigate]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(220,20%,8%)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[hsl(220,20%,8%)]">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 bg-[hsl(220,20%,6%)] transition-all duration-300",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-white/5">
          {!collapsed && (
            <span className="text-sm font-bold text-white tracking-widest">
              SALBCARE<span className="text-blue-500 ml-1">ADMIN</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-md p-1 text-white/40 hover:bg-white/5 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-blue-600/15 text-blue-400"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", active && "text-blue-400")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-white/5 space-y-0.5">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/40 hover:bg-white/5 hover:text-white/70 transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Voltar ao App</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn("flex-1 transition-all duration-300", collapsed ? "ml-16" : "ml-56")}>
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
