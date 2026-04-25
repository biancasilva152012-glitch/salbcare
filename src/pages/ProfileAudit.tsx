import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, ShieldAlert, ChevronLeft, ChevronRight, FileDown } from "lucide-react";

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

const FALLBACK_OUTCOMES = new Set([
  "fallback-disallowed",
  "fallback-traversal",
  "fallback-external-origin",
  "fallback-ambiguous",
]);

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
  const [fallbackCounts, setFallbackCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
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

  const totalFallbacks = useMemo(
    () => Object.values(fallbackCounts).reduce((a, b) => a + b, 0),
    [fallbackCounts],
  );

  const buildBaseQuery = () => {
    if (!user) return null;
    let q = supabase
      .from("redirect_audit_events")
      .select("id, flow, source, preserved_keys, resolved_path, outcome, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (from) q = q.gte("created_at", new Date(from).toISOString());
    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      q = q.lt("created_at", toDate.toISOString());
    }
    return q;
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);

      // Página atual
      const pageQuery = buildBaseQuery()!.range(
        page * PAGE_SIZE,
        page * PAGE_SIZE + PAGE_SIZE - 1,
      );
      const { data, count, error } = await pageQuery;

      // Contagem de fallbacks por outcome (sem paginação, mesmos filtros).
      // RLS garante que só vemos eventos do próprio usuário.
      const fallbackQuery = buildBaseQuery()!
        .in("outcome", [...FALLBACK_OUTCOMES])
        .limit(1000);
      const { data: fbData } = await fallbackQuery;

      if (cancelled) return;
      if (error) {
        console.error("[profile-audit] load error", error);
        setEvents([]);
        setTotal(0);
      } else {
        setEvents((data ?? []) as AuditEvent[]);
        setTotal(count ?? 0);
      }
      const counts: Record<string, number> = {};
      (fbData ?? []).forEach((row: any) => {
        counts[row.outcome] = (counts[row.outcome] ?? 0) + 1;
      });
      setFallbackCounts(counts);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, from, to]);

  const handleExportPdf = async () => {
    if (!user) return;
    setExporting(true);
    try {
      // Exporta TODOS os eventos do filtro atual (limite hard de 1000 para
      // proteger memória do navegador).
      const { data, error } = await buildBaseQuery()!.limit(1000);
      if (error) throw error;
      const rows = (data ?? []) as AuditEvent[];

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      doc.setFontSize(14);
      doc.text("Auditoria de redirecionamentos", 40, 40);
      doc.setFontSize(9);
      doc.setTextColor(120);
      const filterLine = `Filtros: ${from || "início"} → ${to || "hoje"} • ${rows.length} evento(s)`;
      doc.text(filterLine, 40, 56);
      doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 40, 68);
      doc.setTextColor(0);

      autoTable(doc, {
        startY: 84,
        head: [["Data", "Fluxo", "Origem", "Resultado", "Destino", "Chaves"]],
        body: rows.map((ev) => [
          new Date(ev.created_at).toLocaleString("pt-BR"),
          ev.flow === "authed" ? "Logado" : "Visitante",
          ev.source,
          outcomeLabel(ev.outcome),
          ev.resolved_path ?? "—",
          ev.preserved_keys.join(", ") || "—",
        ]),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [15, 23, 42] },
        columnStyles: {
          0: { cellWidth: 110 },
          1: { cellWidth: 60 },
          2: { cellWidth: 90 },
          3: { cellWidth: 120 },
        },
      });

      const stamp = new Date().toISOString().slice(0, 10);
      doc.save(`auditoria-redirects-${stamp}.pdf`);
    } catch (err) {
      console.error("[profile-audit] export error", err);
    } finally {
      setExporting(false);
    }
  };

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

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                  Limpar
                </Button>
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full gap-2"
                  onClick={handleExportPdf}
                  disabled={exporting || total === 0}
                  data-testid="export-pdf"
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  Exportar PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fallbacks destacados */}
        <Card data-testid="fallback-section" className={totalFallbacks > 0 ? "border-destructive/50" : ""}>
          <CardHeader className="flex flex-row items-center gap-2">
            <ShieldAlert
              className={`h-5 w-5 ${totalFallbacks > 0 ? "text-destructive" : "text-muted-foreground"}`}
              aria-hidden
            />
            <CardTitle className="text-base">
              Eventos bloqueados{" "}
              <span className="text-sm text-muted-foreground font-normal">
                ({totalFallbacks})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalFallbacks === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma tentativa de redirect bloqueada no período. ✨
              </p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[...FALLBACK_OUTCOMES].map((outcome) => {
                  const count = fallbackCounts[outcome] ?? 0;
                  if (count === 0) return null;
                  return (
                    <li
                      key={outcome}
                      className="flex items-center justify-between p-3 rounded-md border bg-muted/30"
                      data-testid={`fallback-${outcome}`}
                    >
                      <span className="text-sm">{outcomeLabel(outcome)}</span>
                      <Badge variant="destructive">{count}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Lista paginada */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Eventos</CardTitle>
            <span className="text-xs text-muted-foreground" data-testid="total-count">
              {total} {total === 1 ? "evento" : "eventos"}
            </span>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center" data-testid="empty-state">
                Nenhum redirecionamento registrado neste período.
              </p>
            ) : (
              <ul className="divide-y" data-testid="event-list">
                {events.map((ev) => (
                  <li
                    key={ev.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                    data-testid="event-item"
                  >
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
                  data-testid="prev-page"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground" data-testid="page-indicator">
                  Página {page + 1} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  data-testid="next-page"
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
