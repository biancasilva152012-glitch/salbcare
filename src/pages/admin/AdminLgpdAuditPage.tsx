import { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw, Download, Filter, Loader2, BadgeCheck, AlertTriangle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";

type LogRow = {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_status: string | null;
  action: "view" | "create" | "update" | "delete";
  resource_table: string;
  resource_id: string | null;
  patient_id: string | null;
  patient_name: string | null;
  reason: string | null;
  ip_address: string | null;
  created_at: string;
  prev_hash: string | null;
  row_hash: string | null;
};

const TABLES = [
  "patients", "medical_records", "appointments",
  "digital_documents", "patient_documents", "teleconsultations",
  "lgpd_subject_export", "pii_access_log",
];

const ACTIONS = ["view", "create", "update", "delete"];

const ACTION_LABEL: Record<string, string> = {
  view: "Visualização", create: "Criação",
  update: "Alteração", delete: "Exclusão",
};
const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  view: "outline", create: "secondary", update: "default", delete: "destructive",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Ativo", trialing: "Trial", paid: "Pago",
  canceled: "Cancelado", past_due: "Em atraso", inactive: "Inativo",
};

export default function AdminLgpdAuditPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [actorEmail, setActorEmail] = useState("");
  const [patientFilter, setPatientFilter] = useState("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [chain, setChain] = useState<{ ok: boolean; total: number; bad?: string | null } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_pii_access_logs", {
        _limit: 500,
        _actor: null,
        _patient: patientFilter || null,
        _table: tableFilter !== "all" ? tableFilter : null,
        _action: actionFilter !== "all" ? actionFilter : null,
        _from: fromDate ? new Date(fromDate).toISOString() : null,
        _to: toDate ? new Date(toDate + "T23:59:59").toISOString() : null,
        _actor_email: actorEmail || null,
      } as any);
      if (error) throw error;
      setRows((data as LogRow[]) || []);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao carregar trilha");
    } finally {
      setLoading(false);
    }
  };

  const verifyChain = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.rpc("verify_pii_access_log_chain", { _limit: 10000 });
      if (error) throw error;
      const row: any = Array.isArray(data) ? data[0] : data;
      setChain({ ok: !!row?.ok, total: Number(row?.total || 0), bad: row?.first_invalid_id });
      if (row?.ok) toast.success(`Cadeia íntegra (${row.total} registros assinados)`);
      else toast.error(`Cadeia comprometida em ${row.first_invalid_id}`);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao verificar cadeia");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const exportCsv = () => {
    const header = ["Data/Hora", "Ator", "Status do ator", "Ação", "Tabela", "ID recurso", "Paciente", "Nome do paciente", "Motivo", "row_hash"];
    const lines = rows.map(r => [
      new Date(r.created_at).toISOString(),
      r.actor_email || r.actor_user_id || "",
      r.actor_status || "",
      ACTION_LABEL[r.action] || r.action,
      r.resource_table,
      r.resource_id || "",
      r.patient_id || "",
      (r.patient_name || "").replace(/[\r\n,;]/g, " "),
      (r.reason || "").replace(/[\r\n,;]/g, " "),
      r.row_hash || "",
    ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lgpd-audit-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <SEOHead title="Auditoria LGPD/CFM" description="Trilha de acesso a dados sensíveis de pacientes" noindex />

      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6" /> Auditoria LGPD / CFM
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Trilha imutável (assinada via cadeia SHA-256) de quem visualizou, criou, alterou ou excluiu dados de pacientes.
              Cumpre LGPD (art. 37) e CFM 2.314/2022. Retenção mínima: 5 anos.
            </p>
            {chain && (
              <div className="mt-2 text-xs flex items-center gap-2">
                {chain.ok ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <BadgeCheck className="h-4 w-4" /> Cadeia íntegra · {chain.total} registros
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Cadeia comprometida em {chain.bad?.slice(0,8)}…
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={verifyChain} disabled={verifying}>
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
              <span className="ml-2">Verificar integridade</span>
            </Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Recarregar</span>
            </Button>
            <Button onClick={exportCsv} disabled={!rows.length}>
              <Download className="h-4 w-4 mr-2" /> Exportar CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6 items-end p-4 rounded-lg border bg-card">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" /> Tabela
            </label>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {TABLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Ação</label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {ACTIONS.map(a => <SelectItem key={a} value={a}>{ACTION_LABEL[a]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">E-mail do ator</label>
            <Input value={actorEmail} onChange={(e) => setActorEmail(e.target.value.trim())} placeholder="contém…" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">ID do paciente</label>
            <Input value={patientFilter} onChange={(e) => setPatientFilter(e.target.value.trim())} placeholder="UUID" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">De</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Até</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="md:col-span-3 lg:col-span-6 flex justify-end">
            <Button onClick={load} disabled={loading}>Aplicar filtros</Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">Data/Hora</th>
                  <th className="px-3 py-2">Ator</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Ação</th>
                  <th className="px-3 py-2">Tabela</th>
                  <th className="px-3 py-2">Paciente</th>
                  <th className="px-3 py-2">Motivo</th>
                  <th className="px-3 py-2">Assinatura</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Carregando…</td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>
                )}
                {rows.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {r.actor_email || r.actor_user_id?.slice(0, 8) || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {r.actor_status ? (
                        <Badge variant="outline" className="text-[10px]">
                          {STATUS_LABEL[r.actor_status] || r.actor_status}
                        </Badge>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={ACTION_VARIANT[r.action] || "outline"}>
                        {ACTION_LABEL[r.action] || r.action}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.resource_table}</td>
                    <td className="px-3 py-2">
                      <div>{r.patient_name || "—"}</div>
                      {r.patient_id && (
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {r.patient_id.slice(0, 8)}…
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.reason || "—"}</td>
                    <td className="px-3 py-2 text-[10px] font-mono text-muted-foreground" title={r.row_hash || ""}>
                      {r.row_hash ? r.row_hash.slice(0, 10) + "…" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 text-xs text-muted-foreground border-t">
            Mostrando {rows.length} registros (máx. 500). Trilha append-only — alterações são bloqueadas por trigger.
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
