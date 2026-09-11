import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw } from "lucide-react";

type Purchase = {
  id: string;
  slug: string;
  email: string | null;
  downloads: number;
  max_downloads: number;
  expires_at: string;
  created_at: string;
};

type Subscription = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
};

const ACTIVE = ["active", "trialing", "past_due"];
const day = 86400000;

const fmtDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "sem data";

const AdminAcademySales = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase
        .from("academy_purchases")
        .select("id, slug, email, downloads, max_downloads, expires_at, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("pro_subscriptions")
        .select("id, user_id, plan, status, current_period_end, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    setPurchases((p ?? []) as Purchase[]);
    setSubs((s ?? []) as Subscription[]);
    setUpdatedAt(new Date());
  }, []);

  useEffect(() => {
    void load();
    // Atualização em tempo real: qualquer venda nova ou renovação chega sem recarregar.
    const channel = supabase
      .channel("admin-academy-sales")
      .on("postgres_changes", { event: "*", schema: "public", table: "academy_purchases" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "pro_subscriptions" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const stats = useMemo(() => {
    const now = Date.now();
    const week = purchases.filter((p) => now - new Date(p.created_at).getTime() <= 7 * day);
    const active = subs.filter((s) => ACTIVE.includes(s.status));
    const upcoming = active
      .filter((s) => s.current_period_end && new Date(s.current_period_end).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.current_period_end as string).getTime() - new Date(b.current_period_end as string).getTime(),
      );
    const alerts = [
      ...subs
        .filter((s) => s.status === "past_due")
        .map((s) => ({ id: s.id, text: `Pagamento em atraso no plano ${s.plan}` })),
      ...upcoming
        .filter((s) => new Date(s.current_period_end as string).getTime() - now <= 7 * day)
        .map((s) => ({ id: `${s.id}-ren`, text: `Renovação em ${fmtDate(s.current_period_end)} no plano ${s.plan}` })),
      ...purchases
        .filter((p) => new Date(p.expires_at).getTime() - now <= 3 * day && new Date(p.expires_at).getTime() >= now)
        .map((p) => ({ id: `${p.id}-exp`, text: `Link de acesso de ${p.email ?? "comprador"} expira em ${fmtDate(p.expires_at)}` })),
    ];
    return { week, active, upcoming, alerts };
  }, [purchases, subs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Vendas da Academy e assinaturas</h1>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          {updatedAt ? `atualizado ${updatedAt.toLocaleTimeString("pt-BR")}` : "atualizar"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compras nos últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats.week.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compras no total</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{purchases.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assinaturas ativas</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats.active.length}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Alertas de renovação e acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {stats.alerts.length === 0 && <p className="text-muted-foreground">Nada pendente por agora.</p>}
          {stats.alerts.map((a) => (
            <p key={a.id}>{a.text}</p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximos vencimentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {stats.upcoming.length === 0 && <p className="text-muted-foreground">Sem vencimentos registrados.</p>}
          {stats.upcoming.slice(0, 12).map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 border-b pb-2 last:border-0">
              <span>{s.plan}</span>
              <span className="flex items-center gap-2">
                <Badge variant={s.status === "past_due" ? "destructive" : "secondary"}>{s.status}</Badge>
                {fmtDate(s.current_period_end)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de compras da Academy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {purchases.length === 0 && <p className="text-muted-foreground">Nenhuma compra registrada ainda.</p>}
          {purchases.slice(0, 30).map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0">
              <span className="font-medium">{p.slug.replace(/-/g, " ")}</span>
              <span className="text-muted-foreground">{p.email ?? "sem e-mail"}</span>
              <span className="text-muted-foreground">
                {fmtDate(p.created_at)} · {p.downloads}/{p.max_downloads} downloads
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAcademySales;
