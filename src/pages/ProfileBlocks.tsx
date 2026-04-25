import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ShieldAlert,
  Crown,
  Lock,
  Download,
  FileText,
  ChevronRight,
  Search,
  X,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";

const MODULE_LABEL: Record<string, string> = {
  prescriptions: "Receitas digitais",
  certificates: "Atestados digitais",
  telehealth: "Teleconsulta",
  public_directory: "Diretório público",
  patients_limit: "Limite de pacientes",
  mentorship_limit: "Limite de mentoria IA",
  appointments_limit: "Limite de agenda",
  financial_limit: "Limite financeiro",
};

type BlockEvent = {
  id: string;
  module: string;
  reason: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

const PAGE_SIZE = 50;

/**
 * Converte o input <input type="date" value="YYYY-MM-DD" /> em ISO.
 * - `from`: início do dia local (00:00:00)
 * - `to`: fim do dia local (23:59:59.999) — torna o filtro INCLUSIVO,
 *   evitando que eventos do próprio dia "até" sejam excluídos.
 */
function toIsoStart(yyyymmdd: string): string {
  return new Date(`${yyyymmdd}T00:00:00`).toISOString();
}
function toIsoEndInclusive(yyyymmdd: string): string {
  return new Date(`${yyyymmdd}T23:59:59.999`).toISOString();
}

type SortOrder = "desc" | "asc";

const ProfileBlocks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // ---- Estado inicial vindo da query string (compartilhável / persistente) ----
  const [from, setFrom] = useState(() => searchParams.get("from") ?? "");
  const [to, setTo] = useState(() => searchParams.get("to") ?? "");
  const [moduleFilter, setModuleFilter] = useState<string>(
    () => searchParams.get("module") ?? "all",
  );
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [serverSearch, setServerSearch] = useState<boolean>(
    () => searchParams.get("serverSearch") === "1",
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    () => (searchParams.get("order") === "asc" ? "asc" : "desc"),
  );

  const [events, setEvents] = useState<BlockEvent[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<null | "csv" | "pdf">(null);
  const [selected, setSelected] = useState<BlockEvent | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Sincroniza estado -> query string (replace para não poluir histórico)
  useEffect(() => {
    const next = new URLSearchParams();
    if (from) next.set("from", from);
    if (to) next.set("to", to);
    if (moduleFilter !== "all") next.set("module", moduleFilter);
    if (search) next.set("q", search);
    if (serverSearch) next.set("serverSearch", "1");
    if (sortOrder !== "desc") next.set("order", sortOrder);
    setSearchParams(next, { replace: true });
  }, [from, to, moduleFilter, search, serverSearch, sortOrder, setSearchParams]);

  // Escapa % e _ pra não virarem wildcards no LIKE
  const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

  /**
   * Aplica os filtros server-side compartilhados por listagem e exports.
   * - data (gte/lte) e módulo são SEMPRE no servidor
   * - busca textual: server quando serverSearch=true (ilike em module/reason
   *   e cast da metadata para texto), senão fica só client-side
   * - ordenação: created_at conforme sortOrder
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyServerFilters = useCallback((q: any) => {
    if (from) q = q.gte("created_at", toIsoStart(from));
    if (to) q = q.lte("created_at", toIsoEndInclusive(to));
    if (moduleFilter !== "all") q = q.eq("module", moduleFilter);
    if (serverSearch && search.trim()) {
      const term = `%${escapeLike(search.trim())}%`;
      // OR em colunas texto + cast da jsonb metadata para text.
      q = q.or(
        `module.ilike.${term},reason.ilike.${term},metadata::text.ilike.${term}`,
      );
    }
    return q.order("created_at", { ascending: sortOrder === "asc" });
  }, [from, to, moduleFilter, serverSearch, search, sortOrder]);

  /**
   * Busca uma página específica respeitando os filtros.
   * Página 0 = nova consulta (substitui); demais páginas = anexa.
   */
  const fetchPage = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (!user) return;
      setLoading(true);
      const fromIdx = targetPage * PAGE_SIZE;
      const toIdx = fromIdx + PAGE_SIZE - 1;
      let q = supabase
        .from("premium_block_attempts")
        .select("id, module, reason, created_at, metadata")
        .eq("user_id", user.id)
        .range(fromIdx, toIdx);
      q = applyServerFilters(q);
      const { data, error } = await q;
      if (error) {
        setLoading(false);
        return;
      }
      const rows = (data as BlockEvent[]) ?? [];
      setEvents((prev) => (replace ? rows : [...prev, ...rows]));
      setHasMore(rows.length === PAGE_SIZE);
      setLoading(false);
    },
    [user, applyServerFilters],
  );

  // Reset ao mudar usuário ou filtros: busca página 0 substituindo o estado.
  useEffect(() => {
    if (!user) return;
    setPage(0);
    setHasMore(true);
    fetchPage(0, true);
  }, [user, fetchPage]);

  // Infinite scroll: observer no sentinela carrega próxima página.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          const next = page + 1;
          setPage(next);
          fetchPage(next, false);
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [page, hasMore, loading, fetchPage]);

  // Busca textual client-side: aplicada SOMENTE quando serverSearch=false,
  // para não filtrar duas vezes o que já veio filtrado do servidor.
  const visibleEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || serverSearch) return events;
    return events.filter((e) => {
      const label = MODULE_LABEL[e.module] ?? e.module;
      const meta = e.metadata ? JSON.stringify(e.metadata).toLowerCase() : "";
      return (
        e.id.toLowerCase().includes(q) ||
        e.module.toLowerCase().includes(q) ||
        label.toLowerCase().includes(q) ||
        e.reason.toLowerCase().includes(q) ||
        meta.includes(q)
      );
    });
  }, [events, search, serverSearch]);

  // Contagens refletem o que está visível (busca + filtros aplicados).
  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const e of visibleEvents) acc[e.module] = (acc[e.module] ?? 0) + 1;
    return acc;
  }, [visibleEvents]);

  const totalsList = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const filterSuffix = useMemo(() => {
    const parts: string[] = [];
    if (from || to) parts.push(`${from || "inicio"}_a_${to || "hoje"}`);
    if (moduleFilter !== "all") parts.push(moduleFilter);
    parts.push(sortOrder === "asc" ? "asc" : "desc");
    return parts.length > 0 ? parts.join("_") : "todos";
  }, [from, to, moduleFilter, sortOrder]);

  const hasAnyFilter =
    !!from || !!to || moduleFilter !== "all" || !!search || sortOrder !== "desc" || serverSearch;

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setModuleFilter("all");
    setSearch("");
    setServerSearch(false);
    setSortOrder("desc");
    setPage(0);
    setHasMore(true);
  };

  /**
   * Para exports: busca TODAS as páginas que casam com os filtros server-side
   * (data + módulo + busca, se serverSearch). A busca client-side é aplicada
   * em seguida quando serverSearch=false. A ordem segue sortOrder.
   */
  const fetchAllForExport = useCallback(async (): Promise<BlockEvent[]> => {
    if (!user) return [];
    const all: BlockEvent[] = [];
    const HARD_CAP = 5000;
    for (let p = 0; p * PAGE_SIZE < HARD_CAP; p++) {
      const fromIdx = p * PAGE_SIZE;
      let q = supabase
        .from("premium_block_attempts")
        .select("id, module, reason, created_at, metadata")
        .eq("user_id", user.id)
        .range(fromIdx, fromIdx + PAGE_SIZE - 1);
      q = applyServerFilters(q);
      const { data } = await q;
      const rows = (data as BlockEvent[]) ?? [];
      all.push(...rows);
      if (rows.length < PAGE_SIZE) break;
    }
    const term = search.trim().toLowerCase();
    if (!term || serverSearch) return all;
    return all.filter((e) => {
      const label = MODULE_LABEL[e.module] ?? e.module;
      const meta = e.metadata ? JSON.stringify(e.metadata).toLowerCase() : "";
      return (
        e.id.toLowerCase().includes(term) ||
        e.module.toLowerCase().includes(term) ||
        label.toLowerCase().includes(term) ||
        e.reason.toLowerCase().includes(term) ||
        meta.includes(term)
      );
    });
  }, [user, applyServerFilters, search, serverSearch]);


  // Coleta TODAS as chaves de metadata presentes no conjunto, para
  // virarem colunas indexadas no CSV (uma coluna por chave).
  const collectMetadataKeys = (rows: BlockEvent[]): string[] => {
    const set = new Set<string>();
    for (const e of rows) {
      if (e.metadata && typeof e.metadata === "object") {
        for (const k of Object.keys(e.metadata)) set.add(k);
      }
    }
    return Array.from(set).sort();
  };

  const exportCsv = async () => {
    if (exporting) return;
    setExporting("csv");
    try {
    const all = await fetchAllForExport();
    if (all.length === 0) {
      toast({ title: "Nada para exportar", description: "Sem eventos no período selecionado." });
      return;
    }
    const metaKeys = collectMetadataKeys(all);
    const rows = all.map((e) => {
      const base: Record<string, string> = {
        evento_id: e.id,
        data: new Date(e.created_at).toLocaleString("pt-BR"),
        modulo: MODULE_LABEL[e.module] ?? e.module,
        modulo_chave: e.module,
        motivo: e.reason,
        metadata_json: e.metadata ? JSON.stringify(e.metadata) : "",
      };
      for (const k of metaKeys) {
        const val = e.metadata && typeof e.metadata === "object"
          ? (e.metadata as Record<string, unknown>)[k]
          : undefined;
        base[`meta_${k}`] = val === undefined || val === null
          ? ""
          : typeof val === "object" ? JSON.stringify(val) : String(val);
      }
      return base;
    });
    const csv = Papa.unparse(rows);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bloqueios_${filterSuffix}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  const exportPdf = async () => {
    if (exporting) return;
    setExporting("pdf");
    try {
    const all = await fetchAllForExport();
    if (all.length === 0) {
      toast({ title: "Nada para exportar", description: "Sem eventos no período selecionado." });
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Atividades de bloqueio — SalbCare", 14, 16);
    doc.setFontSize(10);
    const periodo = `${from || "início"} → ${to || "hoje"}`;
    doc.text(`Período: ${periodo}`, 14, 23);
    if (moduleFilter !== "all") {
      doc.text(`Módulo: ${MODULE_LABEL[moduleFilter] ?? moduleFilter}`, 14, 29);
    }
    if (search.trim()) {
      doc.text(`Busca: "${search.trim()}"`, 14, moduleFilter !== "all" ? 35 : 29);
    }
    const headerEndY =
      29 + (moduleFilter !== "all" ? 6 : 0) + (search.trim() ? 6 : 0);
    doc.text(`Total de eventos: ${all.length}`, 14, headerEndY);

    const exportCounts: Record<string, number> = {};
    for (const e of all) exportCounts[e.module] = (exportCounts[e.module] ?? 0) + 1;
    const exportTotals = Object.entries(exportCounts).sort((a, b) => b[1] - a[1]);

    autoTable(doc, {
      startY: headerEndY + 7,
      head: [["Módulo", "Quantidade"]],
      body: exportTotals.map(([mod, n]) => [MODULE_LABEL[mod] ?? mod, String(n)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    autoTable(doc, {
      head: [["#", "Data/hora", "Módulo", "Motivo", "ID"]],
      body: all.map((e, i) => [
        String(i + 1),
        new Date(e.created_at).toLocaleString("pt-BR"),
        MODULE_LABEL[e.module] ?? e.module,
        e.reason,
        e.id.slice(0, 8),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    // Seção dedicada: metadata por evento, indexada (#1, #2, ...)
    // Cada evento vira uma mini-tabela chave/valor após o índice.
    const eventsWithMeta = all.filter(
      (e) => e.metadata && typeof e.metadata === "object" && Object.keys(e.metadata).length > 0,
    );
    if (eventsWithMeta.length > 0) {
      doc.addPage();
      doc.setFontSize(13);
      doc.text("Metadados por evento", 14, 16);
      doc.setFontSize(9);
      let cursorY = 22;
      all.forEach((e, i) => {
        if (!e.metadata || typeof e.metadata !== "object") return;
        const entries = Object.entries(e.metadata as Record<string, unknown>);
        if (entries.length === 0) return;
        autoTable(doc, {
          startY: cursorY,
          head: [[`#${i + 1} • ${MODULE_LABEL[e.module] ?? e.module} • ${e.id.slice(0, 8)}`, ""]],
          body: entries.map(([k, v]) => [
            k,
            typeof v === "object" ? JSON.stringify(v) : String(v),
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [71, 85, 105] },
          columnStyles: { 0: { cellWidth: 50, fontStyle: "bold" } },
        });
        // jspdf-autotable atualiza lastAutoTable.finalY
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cursorY = ((doc as any).lastAutoTable?.finalY ?? cursorY) + 4;
      });
    }

    doc.save(`bloqueios_${filterSuffix}.pdf`);
    } finally {
      setExporting(null);
    }
  };


  return (
    <PageContainer backTo="/profile">
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Atividades de bloqueio</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Mostra cada vez que você tentou acessar um recurso exclusivo do plano Essencial.
          Somente seus próprios eventos são exibidos.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">De</Label>
            <Input
              data-testid="block-filter-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-accent border-border"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Até</Label>
            <Input
              data-testid="block-filter-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-accent border-border"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Módulo</Label>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger
              data-testid="block-filter-module"
              className="bg-accent border-border"
            >
              <SelectValue placeholder="Todos os módulos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os módulos</SelectItem>
              {Object.entries(MODULE_LABEL).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Buscar</Label>
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              data-testid="block-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="motivo, módulo ou ID do evento…"
              className="bg-accent border-border pl-8 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <Label htmlFor="server-search" className="text-[11px] text-muted-foreground">
              Buscar no servidor (inclui eventos não carregados)
            </Label>
            <Switch
              id="server-search"
              data-testid="block-server-search"
              checked={serverSearch}
              onCheckedChange={setServerSearch}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1.5">
            <ArrowUpDown className="h-3 w-3" />
            Ordenação
          </Label>
          <Select
            value={sortOrder}
            onValueChange={(v) => setSortOrder(v as SortOrder)}
          >
            <SelectTrigger
              data-testid="block-filter-order"
              className="bg-accent border-border"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Mais recentes primeiro</SelectItem>
              <SelectItem value="asc">Mais antigos primeiro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasAnyFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            data-testid="clear-filters"
            className="w-full"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Limpar filtros
          </Button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={exporting !== null}
            data-testid="export-csv"
            aria-busy={exporting === "csv"}
          >
            {exporting === "csv" ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 mr-1.5" />
            )}
            {exporting === "csv" ? "Gerando CSV…" : "Exportar CSV"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportPdf}
            disabled={exporting !== null}
            data-testid="export-pdf"
            aria-busy={exporting === "pdf"}
          >
            {exporting === "pdf" ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5 mr-1.5" />
            )}
            {exporting === "pdf" ? "Gerando PDF…" : "Exportar PDF"}
          </Button>
        </div>

        <div className="glass-card p-4 space-y-2" data-testid="block-counts">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
            Contagens por módulo
          </p>
          {totalsList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum bloqueio registrado no período.</p>
          ) : (
            <ul className="space-y-1.5">
              {totalsList.map(([mod, n]) => (
                <li key={mod} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    {MODULE_LABEL[mod] ?? mod}
                  </span>
                  <Badge variant="secondary">{n}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
              Histórico recente
            </p>
            {search && (
              <p className="text-[11px] text-muted-foreground" data-testid="search-result-count">
                {visibleEvents.length} de {events.length}
              </p>
            )}
          </div>
          {!loading && visibleEvents.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {search || moduleFilter !== "all"
                ? "Nenhum evento bate com os filtros."
                : "Sem eventos no período."}
            </p>
          )}
          {visibleEvents.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setSelected(e)}
              data-testid="block-event-row"
              className="w-full text-left glass-card p-3 flex items-center justify-between text-sm hover:bg-accent/50 transition-colors"
            >
              <div>
                <p className="font-medium">{MODULE_LABEL[e.module] ?? e.module}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString("pt-BR")} • {e.reason}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{e.reason}</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}

          {/* Sentinela para infinite scroll. Continua ativa mesmo com busca
              client-side: usuários podem rolar para carregar mais e ampliar
              o conjunto sobre o qual a busca atua. */}
          <div ref={sentinelRef} aria-hidden className="h-4" />

          {loading && (
            <p className="text-xs text-center text-muted-foreground py-2">Carregando…</p>
          )}
          {!hasMore && events.length > 0 && (
            <p className="text-xs text-center text-muted-foreground py-2">
              Fim do histórico ({events.length} {events.length === 1 ? "evento" : "eventos"}).
            </p>
          )}
        </div>

        <Button onClick={() => navigate("/upgrade")} className="w-full gradient-primary">
          <Crown className="h-4 w-4 mr-2" />
          Assinar plano Essencial por R$ 89/mês
        </Button>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>{MODULE_LABEL[selected.module] ?? selected.module}</SheetTitle>
                <SheetDescription>
                  {new Date(selected.created_at).toLocaleString("pt-BR")}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <DetailRow label="ID do evento" value={selected.id} mono />
                <DetailRow label="Módulo (chave)" value={selected.module} mono />
                <DetailRow label="Motivo" value={selected.reason} />
                <DetailRow label="Quando" value={new Date(selected.created_at).toISOString()} mono />
                <div>
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider mb-1.5">
                    Payload / metadados do request
                  </p>
                  <pre
                    data-testid="event-payload"
                    className="text-[11px] bg-muted/50 border border-border rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all"
                  >
                    {selected.metadata
                      ? JSON.stringify(selected.metadata, null, 2)
                      : "(sem metadados registrados)"}
                  </pre>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Esses dados são privados, visíveis apenas para você (Row-Level Security).
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
};

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider mb-0.5">
        {label}
      </p>
      <p className={mono ? "font-mono text-xs break-all" : "text-sm"}>{value}</p>
    </div>
  );
}

export default ProfileBlocks;
