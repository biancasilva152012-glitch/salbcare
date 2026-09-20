import { forwardRef, useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Users, BarChart3, Database, ScrollText, Settings, LogOut, ChevronLeft, ChevronRight,
  LayoutDashboard, Bell, Loader2, Handshake, ShieldCheck, CreditCard, QrCode, FileLock2, Wind, Globe2, Stethoscope, BookOpen, ClipboardList,
  Menu, X, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import ChangePasswordButton from "./ChangePasswordButton";
import RlsHealthGate from "./RlsHealthGate";

const NAV_ITEMS = [
  { label: "Início", icon: LayoutDashboard, path: "/admin" },
  { label: "Assinaturas", icon: CreditCard, path: "/admin/subscriptions" },
  { label: "Profissionais Pro", icon: Stethoscope, path: "/admin/pro-accounts" },
  { label: "Operação", icon: ClipboardList, path: "/admin/operacao" },
  { label: "Academy", icon: BookOpen, path: "/admin/academy" },
  { label: "Vendas Academy", icon: BarChart3, path: "/admin/academy-sales" },
  { label: "Contas", icon: Users, path: "/admin/users" },
  { label: "Acessos", icon: ShieldCheck, path: "/admin/roles" },
  { label: "Financeiro", icon: BarChart3, path: "/admin/finance" },
  { label: "Parcerias", icon: Handshake, path: "/admin/partners" },
  { label: "Dados", icon: Database, path: "/admin/database" },
  { label: "Histórico", icon: ScrollText, path: "/admin/logs" },
  { label: "Auditoria LGPD", icon: FileLock2, path: "/admin/lgpd-audit" },
  { label: "Solicitações LGPD", icon: FileLock2, path: "/admin/lgpd-requests" },
  { label: "QR Pousadas", icon: QrCode, path: "/admin/qr-generator" },
  { label: "Reservas Kite", icon: Wind, path: "/admin/kite-bookings" },
  { label: "Parceiros locais", icon: Globe2, path: "/admin/local-partners" },
  { label: "Configurações", icon: Settings, path: "/admin/settings" },
  { label: "Ajuda", icon: HelpCircle, path: "/admin/ajuda" },
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    <div ref={ref} className="admin-theme flex min-h-screen bg-background">
      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-primary/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-[hsl(var(--admin-nav))] transition-transform duration-200 lg:transition-all",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-16" : "lg:w-60",
          "lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-4">
          <span className={cn("text-sm font-semibold tracking-[0.14em] text-white", collapsed && "lg:hidden")}>
            SALB<span className="text-secondary">ADMIN</span>
          </span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            className="hidden rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:block"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Fechar menu"
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
                  active ? "bg-white/10 font-semibold text-white" : "text-white/60 hover:bg-white/[0.06] hover:text-white",
                  collapsed && "lg:justify-center lg:px-0"
                )}
              >
                {active && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-secondary" />}
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-secondary")} />
                <span className={cn("truncate", collapsed && "lg:hidden")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-3">
          <Link
            to="/dashboard"
            title="Voltar ao App"
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white",
              collapsed && "lg:justify-center lg:px-0"
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span className={cn(collapsed && "lg:hidden")}>Voltar ao App</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn("min-w-0 flex-1 overflow-x-hidden transition-all duration-200", collapsed ? "lg:ml-16" : "lg:ml-60")}>
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
            className="-ml-2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification bell */}
            <Popover>
              <PopoverTrigger asChild>
                <button aria-label="Notificações" className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Bell className="h-[18px] w-[18px]" />
                  {notifications.length > 0 && (
                    <span className="admin-num absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-secondary-foreground">
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <span className="text-xs font-semibold text-primary-foreground">A</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
    </RlsHealthGate>
  );
});

AdminLayout.displayName = "AdminLayout";

export default AdminLayout;
