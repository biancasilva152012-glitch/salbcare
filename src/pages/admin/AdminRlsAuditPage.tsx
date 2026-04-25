import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  Eye,
  Loader2,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type PolicyRow = {
  policy_name: string;
  command: string;
  permissive: string;
  roles: string[];
  using_expr: string;
  with_check_expr: string;
};

type AuditRow = {
  table_name: string;
  rls_enabled: boolean;
  has_select: boolean;
  has_insert: boolean;
  has_update: boolean;
  has_delete: boolean;
  user_scoped: boolean;
  status: "ok" | "warning" | "fail";
  notes: string;
};

const statusVariants: Record<AuditRow["status"], { icon: any; color: string; label: string }> = {
  ok: { icon: ShieldCheck, color: "text-emerald-500", label: "OK" },
  warning: { icon: ShieldAlert, color: "text-amber-500", label: "Atenção" },
  fail: { icon: ShieldX, color: "text-destructive", label: "Falha" },
};

const Yes = () => <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-label="sim" />;
const No = () => <XCircle className="h-3.5 w-3.5 text-destructive" aria-label="não" />;

const AdminRlsAuditPage = () => {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("audit_rls_coverage");
      if (error) throw error;
      setRows((data ?? []) as AuditRow[]);
      setLastRunAt(new Date());
    } catch (err: any) {
      toast.error(err?.message ?? "Falha ao auditar RLS.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
  }, []);

  // ── Exports ────────────────────────────────────────────────────────────
  const stamp = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;

  const yn = (v: boolean) => (v ? "sim" : "não");

  const downloadCsv = () => {
    if (!rows || !lastRunAt) return;
    const header = [
      "tabela",
      "status",
      "rls_ativo",
      "select",
      "insert",
      "update",
      "delete",
      "user_scoped",
      "observacao",
    ];
    const escape = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(
        [
          r.table_name,
          r.status,
          yn(r.rls_enabled),
          yn(r.has_select),
          yn(r.has_insert),
          yn(r.has_update),
          yn(r.has_delete),
          yn(r.user_scoped),
          r.notes,
        ]
          .map(escape)
          .join(","),
      );
    }
    // Header comment line with timestamp for traceability
    const csv = `# SALBCARE — Auditoria RLS — ${lastRunAt.toLocaleString("pt-BR")}\n${lines.join("\n")}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salbcare-rls-audit-${stamp(lastRunAt)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado.");
  };

  const downloadPdf = () => {
    if (!rows || !lastRunAt) return;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("SALBCARE — Auditoria de RLS", 14, 14);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Gerado em ${lastRunAt.toLocaleString("pt-BR")}`, 14, 20);
    const counts = rows.reduce(
      (acc, r) => {
        acc[r.status] += 1;
        return acc;
      },
      { ok: 0, warning: 0, fail: 0 } as Record<AuditRow["status"], number>,
    );
    doc.text(
      `Resumo: ${counts.ok} OK • ${counts.warning} atenção • ${counts.fail} falha(s)`,
      14,
      25,
    );

    autoTable(doc, {
      startY: 30,
      head: [[
        "Tabela",
        "Status",
        "RLS",
        "SELECT",
        "INSERT",
        "UPDATE",
        "DELETE",
        "user_id?",
        "Observação",
      ]],
      body: rows.map((r) => [
        r.table_name,
        r.status,
        yn(r.rls_enabled),
        yn(r.has_select),
        yn(r.has_insert),
        yn(r.has_update),
        yn(r.has_delete),
        yn(r.user_scoped),
        r.notes,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] },
    });

    doc.save(`salbcare-rls-audit-${stamp(lastRunAt)}.pdf`);
    toast.success("PDF exportado.");
  };

  const summary = (() => {
    if (!rows) return null;
    const c = { ok: 0, warning: 0, fail: 0 };
    rows.forEach((r) => (c[r.status] += 1));
    return c;
  })();

  return (
    <AdminLayout>
      <SEOHead
        title="Auditoria RLS | Admin SALBCARE"
        description="Verificação automática de RLS nas tabelas usadas por Pacientes, Agenda e Financeiro."
        canonical="/admin/rls-audit"
      />
      <div className="space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Auditoria de RLS
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Verifica se as tabelas das telas Pacientes, Agenda e Financeiro têm
              proteção por linha (RLS) ativa e se as policies isolam cada
              usuário aos próprios dados (<code>auth.uid() = user_id</code>).
            </p>
            {lastRunAt && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Última verificação: {lastRunAt.toLocaleString("pt-BR")}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={run} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Reexecutar
            </Button>
            <Button
              onClick={downloadCsv}
              disabled={!rows || rows.length === 0}
              size="sm"
              variant="outline"
              data-testid="rls-export-csv"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              CSV
            </Button>
            <Button
              onClick={downloadPdf}
              disabled={!rows || rows.length === 0}
              size="sm"
              variant="outline"
              data-testid="rls-export-pdf"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </Button>
          </div>
        </header>

        {summary && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {summary.ok} OK
            </Badge>
            {summary.warning > 0 && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {summary.warning} atenção
              </Badge>
            )}
            {summary.fail > 0 && (
              <Badge variant="destructive">{summary.fail} falha(s)</Badge>
            )}
          </div>
        )}

        {loading && !rows ? (
          <p className="text-sm text-muted-foreground">Auditando…</p>
        ) : !rows || rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum resultado. Você precisa estar logado como administrador.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Tabela</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">RLS</th>
                  <th className="px-3 py-2 font-medium text-center">SELECT</th>
                  <th className="px-3 py-2 font-medium text-center">INSERT</th>
                  <th className="px-3 py-2 font-medium text-center">UPDATE</th>
                  <th className="px-3 py-2 font-medium text-center">DELETE</th>
                  <th className="px-3 py-2 font-medium text-center">user_id?</th>
                  <th className="px-3 py-2 font-medium">Observação</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const v = statusVariants[r.status];
                  const Icon = v.icon;
                  return (
                    <tr key={r.table_name} className="border-t">
                      <td className="px-3 py-2 font-mono">{r.table_name}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 ${v.color}`}>
                          <Icon className="h-3.5 w-3.5" /> {v.label}
                        </span>
                      </td>
                      <td className="px-3 py-2">{r.rls_enabled ? <Yes /> : <No />}</td>
                      <td className="px-3 py-2 text-center">{r.has_select ? <Yes /> : <No />}</td>
                      <td className="px-3 py-2 text-center">{r.has_insert ? <Yes /> : <No />}</td>
                      <td className="px-3 py-2 text-center">{r.has_update ? <Yes /> : <No />}</td>
                      <td className="px-3 py-2 text-center">{r.has_delete ? <Yes /> : <No />}</td>
                      <td className="px-3 py-2 text-center">{r.user_scoped ? <Yes /> : <No />}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          Esta verificação roda no banco via função <code>audit_rls_coverage()</code>{" "}
          (apenas administradores). Ela inspeciona <code>pg_class.relrowsecurity</code>{" "}
          e <code>pg_policies</code> para cada tabela auditada.
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminRlsAuditPage;
