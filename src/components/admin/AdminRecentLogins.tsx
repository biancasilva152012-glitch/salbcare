import { useAdminUsers } from "@/hooks/useAdminData";

const fmt = (d: string) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Últimos acessos: toda entrada nova aparece no topo (atualiza a cada 30s). */
export default function AdminRecentLogins() {
  const { data = [], isLoading, error } = useAdminUsers();
  const rows = data
    .filter((u) => u.last_sign_in_at)
    .sort((a, b) => (b.last_sign_in_at! > a.last_sign_in_at! ? 1 : -1))
    .slice(0, 15);
  const day = Date.now() - 86400000;
  const today = rows.filter((u) => new Date(u.last_sign_in_at!).getTime() > day).length;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Logins recentes</h2>
        <p className="text-sm text-muted-foreground">Quem entrou por último no app. Nas últimas 24h: <span className="font-mono">{today}</span></p>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-destructive">Não foi possível carregar os logins.</p>}
      <ul className="space-y-2">
        {rows.map((u) => (
          <li key={u.user_id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">{u.name || "Sem nome"}</div>
              <div className="truncate text-xs text-muted-foreground">{u.email}</div>
            </div>
            <span className="shrink-0 font-mono text-xs text-foreground">{fmt(u.last_sign_in_at!)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
