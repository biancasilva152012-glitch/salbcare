import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";

type AuditEvent = {
  id: string;
  flow: "visitor" | "authed";
  source: string;
  preserved_keys: string[];
  resolved_path: string | null;
  outcome: string;
  created_at: string;
};

const PAGE_SIZE = 20;

const outcomeVariant = (outcome: string): "default" | "secondary" | "destructive" => {
  if (outcome === "ok") return "default";
  if (outcome === "fallback-empty") return "secondary";
  return "destructive";
};

const outcomeLabel = (outcome: string) => {
  switch (outcome) {
    case "ok":
      return "OK";
    case "fallback-empty":
      return "Sem destino";
    case "fallback-disallowed":
      return "Bloqueado: rota não permitida";
    case "fallback-traversal":
      return "Bloqueado: path traversal";
    case "fallback-external-origin":
      return "Bloqueado: origem externa";
    case "fallback-ambiguous":
      return "Bloqueado: destinos divergentes";
    default:
      return outcome;
  }
};

const ProfileAudit = () => {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    document.title = "Auditoria de redirecionamentos | SALBCARE";
  }, []);

  const totalPages = useMemo(
    () => (total > 0 ? Math.ceil(total / PAGE_SIZE) : 0),
    [total],
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("redirect_audit_events")
        .select("id, flow, source, preserved_keys, resolved_path, outcome, created_at", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (from) {
        query = query.gte("created_at", new Date(from).toISOString());
      }
      if (to) {
        // Inclusivo: somar 1 dia.
        const toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        query = query.lt("created_at", toDate.toISOString());
      }

      const { data, count, error } = await query;
      if (cancelled) return;
      if (error) {
        console.error("[profile-audit] load error", error);
        setEvents([]);
        setTotal(0);
      } else {
        setEvents((data ?? []) as AuditEvent[]);
        setTotal(count ?? 0);
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user, page, from, to]);

  if (authLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Faça login para ver sua auditoria.</p>
            <Button asChild className="mt-4">
              <Link to="/login">Entrar</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-primary mt-1" aria-hidden />
          <div>
            <h1 className="text-2xl font-semibold">Auditoria de redirecionamentos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Histórico dos redirects seguros associados à sua conta. Apenas nomes de
              chaves preservadas (utm_*, ref) são registrados — nenhum valor é armazenado.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="from">De</Label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPage(0);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="to">Até</Label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPage(0);
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setFrom("");
                    setTo("");
                    setPage(0);
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Eventos</CardTitle>
            <span className="text-xs text-muted-foreground">
              {total} {total === 1 ? "evento" : "eventos"}
            </span>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhum redirecionamento registrado neste período.
              </p>
            ) : (
              <ul className="divide-y">
                {events.map((ev) => (
                  <li key={ev.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={outcomeVariant(ev.outcome)}>{outcomeLabel(ev.outcome)}</Badge>
                        <Badge variant="outline">{ev.flow === "authed" ? "Logado" : "Visitante"}</Badge>
                        <span className="text-xs text-muted-foreground">{ev.source}</span>
                      </div>
                      <p className="text-sm mt-1 truncate">
                        {ev.resolved_path ?? <span className="text-muted-foreground">(sem destino)</span>}
                      </p>
                      {ev.preserved_keys.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Chaves: {ev.preserved_keys.join(", ")}
                        </p>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground shrink-0" dateTime={ev.created_at}>
                      {new Date(ev.created_at).toLocaleString("pt-BR")}
                    </time>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || loading}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  Página {page + 1} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default ProfileAudit;
