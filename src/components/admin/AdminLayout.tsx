import { forwardRef, useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Users, BarChart3, Database, ScrollText, Settings, LogOut, ChevronLeft, ChevronRight,
  LayoutDashboard, Bell, Loader2, Handshake, ShieldCheck, CreditCard, QrCode, FileLock2, Wind, Globe2, Stethoscope, BookOpen, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import ChangePasswordButton from "./ChangePasswordButton";
import RlsHealthGate from "./RlsHealthGate";

const NAV_ITEMS = [
  { label: "Visão Geral", icon: LayoutDashboard, path: "/admin" },
  { label: "Adesões", icon: CreditCard, path: "/admin/subscriptions" },
  { label: "Profissionais Pro", icon: Stethoscope, path: "/admin/pro-accounts" },
  { label: "Operação", icon: ClipboardList, path: "/admin/operacao" },
  { label: "Academy e planos", icon: BookOpen, path: "/admin/academy" },
  { label: "Vendas da Academy", icon: BarChart3, path: "/admin/academy-sales" },
  { label: "Usuários", icon: Users, path: "/admin/users" },
  { label: "Permissões", icon: ShieldCheck, path: "/admin/roles" },
  { label: "Financeiro", icon: BarChart3, path: "/admin/finance" },
  { label: "Parcerias", icon: Handshake, path: "/admin/partners" },
  { label: "Banco de Dados", icon: Database, path: "/admin/database" },
  { label: "Logs", icon: ScrollText, path: "/admin/logs" },
  { label: "Auditoria LGPD", icon: FileLock2, path: "/admin/lgpd-audit" },
  { label: "Solicitações LGPD", icon: FileLock2, path: "/admin/lgpd-requests" },
  { label: "QR Pousadas", icon: QrCode, path: "/admin/qr-generator" },
  { label: "Reservas Kite", icon: Wind, path: "/admin/kite-bookings" },
  { label: "Local Partner Network", icon: Globe2, path: "/admin/local-partners" },
  { label: "Configurações", icon: Settings, path: "/admin/settings" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = forwardRef<HTMLDivElement, AdminLayoutProps>(({ children }, ref) => {
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
      navigate("/admin/login", { replace: true });
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/admin/login", { replace: true });
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
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
    <RlsHealthGate>
    <div ref={ref} className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <span className="text-sm font-bold tracking-widest text-foreground">
              SALB<span className="text-secondary">ADMIN</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
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
                    ? "bg-accent text-secondary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-secondary")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="space-y-1 border-t border-border p-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Voltar ao App</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn("flex-1 transition-all duration-300", collapsed ? "ml-16" : "ml-60")}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
          <div />
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                  <Bell className="h-[18px] w-[18px]" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 p-0 bg-card border-border text-foreground"
              >
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-xs font-semibold text-foreground">Notificações</p>
                  <p className="text-[10px] text-muted-foreground">Últimas 24 horas</p>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-xs">Sem novidades</div>
                  ) : (
                    notifications.map((n: any, i: number) => (
                      <div key={i} className="px-4 py-3 hover:bg-accent">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-medium text-foreground">{n.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {typeLabels[n.professional_type] || n.professional_type} • {n.email}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                            {timeSince(n.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <ChangePasswordButton />

            {/* Admin avatar */}
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-xs font-bold text-secondary-foreground">A</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl p-4 sm:p-6">{children}</div>
      </main>
    </div>
    </RlsHealthGate>
  );
});

AdminLayout.displayName = "AdminLayout";

export default AdminLayout;
