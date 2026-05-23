import { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw, Download, Filter, Loader2 } from "lucide-react";
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
  action: "view" | "create" | "update" | "delete";
  resource_table: string;
  resource_id: string | null;
  patient_id: string | null;
  patient_name: string | null;
  reason: string | null;
  ip_address: string | null;
  created_at: string;
};

const TABLES = [
  "patients", "medical_records", "appointments",
  "digital_documents", "patient_documents", "teleconsultations",
];

const ACTION_LABEL: Record<string, string> = {
  view: "Visualização", create: "Criação",
  update: "Alteração", delete: "Exclusão",
};
const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  view: "outline", create: "secondary", update: "default", delete: "destructive",
};

export default function AdminLgpdAuditPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [patientFilter, setPatientFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_pii_access_logs", {
        _limit: 500,
        _actor: null,
        _patient: patientFilter ? patientFilter : null,
        _table: tableFilter !== "all" ? tableFilter : null,
      });
      if (error) throw error;
      setRows((data as LogRow[]) || []);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao carregar trilha");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const exportCsv = () => {
    const header = ["Data/Hora", "Ator", "Ação", "Tabela", "ID recurso", "Paciente", "Nome do paciente", "Motivo"];
    const lines = rows.map(r => [
      new Date(r.created_at).toISOString(),
      r.actor_email || r.actor_user_id || "",
      ACTION_LABEL[r.action] || r.action,
      r.resource_table,
      r.resource_id || "",
      r.patient_id || "",
      (r.patient_name || "").replace(/[\r\n,;]/g, " "),
      (r.reason || "").replace(/[\r\n,;]/g, " "),
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
      <SEOHead title="Auditoria LGPD/CFM" description="Trilha de acesso a dados sensíveis de pacientes" noIndex />

      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6" /> Auditoria LGPD / CFM
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registro de quem visualizou, criou, alterou ou excluiu dados de pacientes.
              Trilha imutável usada para cumprimento da LGPD (art. 37) e CFM 2.314/2022.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Recarregar</span>
            </Button>
            <Button onClick={exportCsv} disabled={!rows.length}>
              <Download className="h-4 w-4 mr-2" /> Exportar CSV
            </Button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-end p-4 rounded-lg border bg-card">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" /> Tabela
            </label>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {TABLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 flex-1 min-w-[240px]">
            <label className="text-xs text-muted-foreground">ID do paciente (UUID)</label>
            <Input
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value.trim())}
              placeholder="opcional"
            />
          </div>
          <Button onClick={load} disabled={loading}>Filtrar</Button>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">Data/Hora</th>
                  <th className="px-3 py-2">Ator</th>
                  <th className="px-3 py-2">Ação</th>
                  <th className="px-3 py-2">Tabela</th>
                  <th className="px-3 py-2">Paciente</th>
                  <th className="px-3 py-2">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    Carregando…
                  </td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </td></tr>
                )}
                {rows.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {r.actor_email || r.actor_user_id?.slice(0, 8) || "—"}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 text-xs text-muted-foreground border-t">
            Mostrando {rows.length} registros (máx. 500). Use os filtros para refinar.
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
