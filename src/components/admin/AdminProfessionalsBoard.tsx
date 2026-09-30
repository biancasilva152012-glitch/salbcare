import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

type Row = {
  user_id: string;
  name: string;
  email: string;
  professional_type: string;
  plan: string;
  payment_status: string;
  created_at: string;
  sub_plan: string | null;
  sub_status: string | null;
  upcoming_count: number;
  total_appointments: number;
  next_appointment: string | null;
};

const isPaid = (r: Row) =>
  r.payment_status === "active" || r.sub_status === "active" || r.sub_status === "trialing";

const fmtDate = (d: string | null) =>
  d ? new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("pt-BR") : "-";

export default function AdminProfessionalsBoard() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todas" | "pagas" | "gratis">("todas");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-professionals-overview"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_professionals_overview");
      if (error) throw error;
      return (data || []) as Row[];
    },
    refetchInterval: 30_000,
  });

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.filter((r) => {
      if (filter === "pagas" && !isPaid(r)) return false;
      if (filter === "gratis" && isPaid(r)) return false;
      if (!t) return true;
      return (r.name || "").toLowerCase().includes(t) || (r.email || "").toLowerCase().includes(t);
    });
  }, [data, q, filter]);

  const paid = data.filter(isPaid).length;
  const upcoming = data.reduce((s, r) => s + Number(r.upcoming_count || 0), 0);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Profissionais cadastradas</h2>
        <p className="text-sm text-muted-foreground">
          Acompanhe planos e consultas de todas sem entrar no perfil de cada uma. Mostra só contagens, sem dados de pacientes.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Cadastradas", value: data.length },
          { label: "Planos pagos", value: paid },
          { label: "Consultas futuras", value: upcoming },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-3">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="font-mono text-xl font-semibold text-foreground">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Buscar por nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} className="h-12" />
        <div className="flex gap-2">
          {(["todas", "pagas", "gratis"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-12 flex-1 rounded-lg border px-4 text-sm capitalize ${
                filter === f ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground"
              }`}
            >
              {f === "gratis" ? "Grátis" : f}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-destructive">Não foi possível carregar a lista.</p>}

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.user_id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{r.name || "Sem nome"}</div>
                <div className="truncate text-xs text-muted-foreground">{r.email}</div>
                <div className="text-xs text-muted-foreground capitalize">{r.professional_type}</div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                  isPaid(r) ? "bg-primary/15 text-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {isPaid(r) ? `Pago: ${r.sub_plan || r.plan}` : "Grátis"}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div><span className="text-muted-foreground">Futuras </span><span className="font-mono text-foreground">{r.upcoming_count}</span></div>
              <div><span className="text-muted-foreground">Total </span><span className="font-mono text-foreground">{r.total_appointments}</span></div>
              <div><span className="text-muted-foreground">Próxima </span><span className="font-mono text-foreground">{fmtDate(r.next_appointment)}</span></div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Cadastro em {fmtDate(r.created_at)}</div>
          </li>
        ))}
        {!isLoading && rows.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma profissional encontrada.</li>}
      </ul>
    </section>
  );
}
