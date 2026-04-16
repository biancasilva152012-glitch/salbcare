import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Users, BarChart3, Database, ScrollText, Settings, LogOut, ChevronLeft, ChevronRight,
  LayoutDashboard, Bell, Loader2, Handshake, ShieldCheck, CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

const NAV_ITEMS = [
  { label: "Visão Geral", icon: LayoutDashboard, path: "/admin" },
  { label: "Adesões", icon: CreditCard, path: "/admin/subscriptions" },
  { label: "Usuários", icon: Users, path: "/admin/users" },
  { label: "Permissões", icon: ShieldCheck, path: "/admin/roles" },
  { label: "Financeiro", icon: BarChart3, path: "/admin/finance" },
  { label: "Parcerias", icon: Handshake, path: "/admin/partners" },
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

  // Real-time notifications: recent signups in last 24h
  const { data: notifications = [] } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("profiles")
        .select("name, email, professional_type, created_at, payment_status")
        .eq("user_type", "professional")
        .gte("created_at", yesterday)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    refetchInterval: 30_000,
    enabled: isAdmin === true,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
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

  const typeLabels: Record<string, string> = {
    medico: "Médico", dentista: "Dentista", psicologo: "Psicólogo",
    nutricionista: "Nutricionista", fisioterapeuta: "Fisioterapeuta",
  };

  const timeSince = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    return "ontem";
  };

  return (
    <div className="flex min-h-screen bg-[hsl(220,20%,8%)]">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[hsl(220,20%,6%)] transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/[0.06]">
          {!collapsed && (
            <span className="text-sm font-bold text-white tracking-widest">
              SALB<span className="text-blue-400">ADMIN</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-white/60 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-blue-600/15 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.15)]"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-blue-400")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.06] space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/30 hover:bg-white/[0.04] hover:text-white/60 transition-all"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Voltar ao App</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn("flex-1 transition-all duration-300", collapsed ? "ml-16" : "ml-60")}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-[hsl(220,20%,8%)]/80 backdrop-blur-xl px-6 h-14">
          <div />
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative rounded-xl p-2 text-white/30 hover:bg-white/5 hover:text-white/60 transition-colors">
                  <Bell className="h-[18px] w-[18px]" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-500 text-[9px] font-bold text-white flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 p-0 bg-[hsl(220,20%,10%)] border-white/10 text-white"
              >
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-xs font-semibold text-white">Notificações</p>
                  <p className="text-[10px] text-white/30">Últimas 24 horas</p>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.04]">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-white/30 text-xs">Sem novidades</div>
                  ) : (
                    notifications.map((n: any, i: number) => (
                      <div key={i} className="px-4 py-3 hover:bg-white/[0.02]">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-medium text-white">{n.name}</p>
                            <p className="text-[10px] text-white/40 mt-0.5">
                              {typeLabels[n.professional_type] || n.professional_type} • {n.email}
                            </p>
                          </div>
                          <span className="text-[10px] text-white/25 whitespace-nowrap ml-2">
                            {timeSince(n.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Admin avatar */}
            <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-400">A</span>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
