import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldX, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Backend RLS gate — calls public.check_rls_health() on mount and BLOCKS the
 * admin shell when any essential table (patients/appointments/financial_*
 * /teleconsultations/etc.) has no RLS or no auth.uid()=user_id policy.
 *
 * Shown as a full-screen blocker because the admin operates with elevated
 * powers and any leak there propagates everywhere.
 */
type Health = {
  overall_ok: boolean;
  failing_tables: string[] | null;
  checked_at: string;
};

interface Props {
  children: React.ReactNode;
}

const RlsHealthGate = ({ children }: Props) => {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc("check_rls_health");
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as Health | undefined;
      setHealth(row ?? { overall_ok: false, failing_tables: ["unknown"], checked_at: new Date().toISOString() });
    } catch (err: any) {
      setError(err?.message ?? "Falha ao verificar RLS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
  }, []);

  if (loading && !health) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(220,20%,8%)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    // Network/permission error — don't block the admin completely, but warn.
    return (
      <div className="bg-destructive/10 border-b border-destructive/40 px-4 py-2 text-xs text-destructive">
        Verificação de RLS indisponível: {error}.{" "}
        <button onClick={run} className="underline">tentar novamente</button>
        <div>{children}</div>
      </div>
    );
  }

  if (health && !health.overall_ok) {
    const failing = health.failing_tables ?? [];
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(220,20%,8%)] px-4">
        <div className="max-w-lg space-y-4 rounded-2xl border border-destructive/50 bg-[hsl(220,20%,10%)] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
            <ShieldX className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-lg font-bold text-white">
            Acesso administrativo bloqueado
          </h1>
          <p className="text-sm text-white/70">
            A verificação automática detectou tabelas essenciais sem RLS ativo
            ou sem policy isolando por <code>auth.uid() = user_id</code>. Isto
            pode expor dados de outros usuários e o painel administrativo está
            bloqueado até que o problema seja corrigido.
          </p>
          {failing.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left">
              <p className="text-[11px] uppercase tracking-wide text-destructive/80 mb-1.5">
                Tabelas com problema
              </p>
              <ul className="text-xs text-white/80 font-mono space-y-0.5">
                {failing.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[11px] text-white/50">
            Verificado em {new Date(health.checked_at).toLocaleString("pt-BR")}.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={run} size="sm" variant="outline" disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Reverificar
            </Button>
            <Button asChild size="sm">
              <Link to="/admin/rls-audit">Ver auditoria detalhada</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RlsHealthGate;
