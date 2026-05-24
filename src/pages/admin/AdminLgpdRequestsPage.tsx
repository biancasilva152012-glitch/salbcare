import { useEffect, useState } from "react";
import { FileLock2, Plus, Download, Loader2, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";

type Req = {
  id: string;
  requester_user_id: string | null;
  subject_user_id: string | null;
  subject_email: string | null;
  subject_name: string | null;
  request_type: "access" | "copy" | "portability" | "rectify" | "delete" | "restrict";
  status: "pending" | "in_progress" | "fulfilled" | "rejected" | "cancelled";
  notes: string | null;
  fulfilled_by: string | null;
  fulfilled_at: string | null;
  created_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  access: "Acesso", copy: "Cópia", portability: "Portabilidade",
  rectify: "Retificação", delete: "Exclusão", restrict: "Restrição",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente", in_progress: "Em andamento",
  fulfilled: "Atendida", rejected: "Rejeitada", cancelled: "Cancelada",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary", in_progress: "default",
  fulfilled: "outline", rejected: "destructive", cancelled: "outline",
};

export default function AdminLgpdRequestsPage() {
  const [rows, setRows] = useState<Req[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // create dialog
  const [openNew, setOpenNew] = useState(false);
  const [newType, setNewType] = useState<Req["request_type"]>("access");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_lgpd_requests", {
        _status: statusFilter !== "all" ? statusFilter : null,
        _type: typeFilter !== "all" ? typeFilter : null,
        _limit: 500,
      });
      if (error) throw error;
      setRows((data as Req[]) || []);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao carregar solicitações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const createRequest = async () => {
    if (!newEmail && !newSubjectId) {
      toast.error("Informe e-mail ou ID do titular");
      return;
    }
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("lgpd_subject_requests").insert({
        requester_user_id: user?.id ?? null,
        subject_user_id: newSubjectId || null,
        subject_email: newEmail || null,
        subject_name: newName || null,
        request_type: newType,
        notes: newNotes || null,
      } as any);
      if (error) throw error;
      toast.success("Solicitação registrada");
      setOpenNew(false);
      setNewEmail(""); setNewName(""); setNewSubjectId(""); setNewNotes(""); setNewType("access");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao criar");
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (id: string, status: Req["status"]) => {
    try {
      const patch: any = { status };
      if (status === "fulfilled" || status === "rejected") {
        const { data: { user } } = await supabase.auth.getUser();
        patch.fulfilled_by = user?.id ?? null;
        patch.fulfilled_at = new Date().toISOString();
      }
      const { error } = await supabase.from("lgpd_subject_requests").update(patch).eq("id", id);
      if (error) throw error;
      toast.success("Status atualizado");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao atualizar");
    }
  };

  const exportSubject = async (req: Req) => {
    if (!req.subject_user_id) {
      toast.error("É necessário um ID de titular vinculado (subject_user_id).");
      return;
    }
    try {
      const { data, error } = await supabase.rpc("export_lgpd_subject_data", {
        _subject_user_id: req.subject_user_id,
      });
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lgpd-export-${req.subject_user_id.slice(0, 8)}-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      // anexa no registro (snapshot leve para auditoria)
      await supabase.from("lgpd_subject_requests").update({
        export_data: { exported_at: new Date().toISOString(), size_bytes: blob.size },
      } as any).eq("id", req.id);
      toast.success("Export gerado e anexado");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao exportar");
    }
  };

  return (
    <AdminLayout>
      <SEOHead title="Solicitações LGPD" description="Direitos do titular (LGPD art. 18)" noindex />

      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <FileLock2 className="h-6 w-6" /> Solicitações LGPD
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Direitos do titular (LGPD art. 18): acesso, cópia, portabilidade, retificação, exclusão e restrição.
              Cada exportação é registrada na trilha de auditoria.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Recarregar</span>
            </Button>
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Nova solicitação</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar solicitação LGPD</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Tipo</label>
                    <Select value={newType} onValueChange={(v) => setNewType(v as Req["request_type"])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_LABEL).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">E-mail do titular</label>
                    <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="titular@email.com" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Nome do titular</label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">ID do titular (opcional, UUID)</label>
                    <Input value={newSubjectId} onChange={(e) => setNewSubjectId(e.target.value.trim())} placeholder="necessário para exportar dados" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Observações</label>
                    <Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
                  <Button onClick={createRequest} disabled={creating}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-end p-4 rounded-lg border bg-card">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(STATUS_LABEL).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tipo</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(TYPE_LABEL).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={load} disabled={loading}>Filtrar</Button>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">Recebida em</th>
                  <th className="px-3 py-2">Titular</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Observações</th>
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Carregando…</td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Nenhuma solicitação registrada.</td></tr>
                )}
                {rows.map(r => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div>{r.subject_name || r.subject_email || "—"}</div>
                      {r.subject_email && r.subject_name && (
                        <div className="text-[10px] text-muted-foreground">{r.subject_email}</div>
                      )}
                      {r.subject_user_id && (
                        <div className="text-[10px] text-muted-foreground font-mono">{r.subject_user_id.slice(0,8)}…</div>
                      )}
                    </td>
                    <td className="px-3 py-2"><Badge variant="outline">{TYPE_LABEL[r.request_type]}</Badge></td>
                    <td className="px-3 py-2"><Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge></td>
                    <td className="px-3 py-2 text-xs text-muted-foreground max-w-xs">{r.notes || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 flex-wrap">
                        {r.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "in_progress")}>
                            Iniciar
                          </Button>
                        )}
                        {(r.status === "pending" || r.status === "in_progress") && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => exportSubject(r)} disabled={!r.subject_user_id}>
                              <Download className="h-3 w-3 mr-1" /> Exportar
                            </Button>
                            <Button size="sm" onClick={() => updateStatus(r.id, "fulfilled")}>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Atender
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, "rejected")}>
                              <XCircle className="h-3 w-3 mr-1" /> Rejeitar
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 text-xs text-muted-foreground border-t">
            Mostrando {rows.length} solicitações (máx. 500).
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
