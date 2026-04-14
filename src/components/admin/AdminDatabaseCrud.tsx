import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Download, Pencil, Trash2, Plus, RefreshCw, Database, Users, Stethoscope, FileText,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type TableName = "profiles" | "patients" | "appointments" | "medical_records" | "financial_transactions";

interface TabConfig {
  key: TableName;
  label: string;
  icon: React.ElementType;
  columns: { key: string; label: string; editable?: boolean }[];
}

const TABS: TabConfig[] = [
  {
    key: "profiles",
    label: "Perfis",
    icon: Users,
    columns: [
      { key: "name", label: "Nome", editable: true },
      { key: "email", label: "Email" },
      { key: "phone", label: "Telefone", editable: true },
      { key: "professional_type", label: "Tipo", editable: true },
      { key: "plan", label: "Plano", editable: true },
      { key: "payment_status", label: "Status Pgto", editable: true },
      { key: "bio", label: "Bio", editable: true },
      { key: "council_number", label: "Conselho", editable: true },
    ],
  },
  {
    key: "patients",
    label: "Pacientes",
    icon: Stethoscope,
    columns: [
      { key: "name", label: "Nome", editable: true },
      { key: "email", label: "Email", editable: true },
      { key: "phone", label: "Telefone", editable: true },
      { key: "cpf", label: "CPF", editable: true },
      { key: "birth_date", label: "Nascimento", editable: true },
      { key: "notes", label: "Notas", editable: true },
    ],
  },
  {
    key: "appointments",
    label: "Agendamentos",
    icon: FileText,
    columns: [
      { key: "patient_name", label: "Paciente", editable: true },
      { key: "date", label: "Data", editable: true },
      { key: "time", label: "Hora", editable: true },
      { key: "status", label: "Status", editable: true },
      { key: "appointment_type", label: "Tipo", editable: true },
      { key: "notes", label: "Notas", editable: true },
    ],
  },
  {
    key: "medical_records",
    label: "Prontuários",
    icon: FileText,
    columns: [
      { key: "patient_name", label: "Paciente" },
      { key: "diagnosis", label: "Diagnóstico", editable: true },
      { key: "icd_code", label: "CID", editable: true },
      { key: "treatment_plan", label: "Tratamento", editable: true },
      { key: "consultation_date", label: "Data" },
    ],
  },
  {
    key: "financial_transactions",
    label: "Transações",
    icon: Database,
    columns: [
      { key: "description", label: "Descrição", editable: true },
      { key: "amount", label: "Valor", editable: true },
      { key: "type", label: "Tipo", editable: true },
      { key: "category", label: "Categoria", editable: true },
      { key: "date", label: "Data", editable: true },
    ],
  },
];

const AdminDatabaseCrud = () => {
  const [activeTab, setActiveTab] = useState<TableName>("profiles");
  const [search, setSearch] = useState("");
  const [editRow, setEditRow] = useState<any>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const qc = useQueryClient();

  const tabConfig = TABS.find((t) => t.key === activeTab)!;

  const { data: rows = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-crud", activeTab],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(activeTab)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, any> }) => {
      const { error } = await (supabase as any)
        .from(activeTab)
        .update(values)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro atualizado");
      qc.invalidateQueries({ queryKey: ["admin-crud", activeTab] });
      setEditRow(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from(activeTab)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro excluído");
      qc.invalidateQueries({ queryKey: ["admin-crud", activeTab] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = rows.filter((r: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return tabConfig.columns.some((c) =>
      String(r[c.key] ?? "").toLowerCase().includes(s)
    );
  });

  const openEdit = (row: any) => {
    setEditRow(row);
    const vals: Record<string, string> = {};
    tabConfig.columns.filter((c) => c.editable).forEach((c) => {
      vals[c.key] = row[c.key] ?? "";
    });
    setEditValues(vals);
  };

  const saveEdit = () => {
    if (!editRow) return;
    const changed: Record<string, any> = {};
    for (const [k, v] of Object.entries(editValues)) {
      if (String(editRow[k] ?? "") !== v) {
        changed[k] = v || null;
      }
    }
    if (Object.keys(changed).length === 0) {
      setEditRow(null);
      return;
    }
    updateMutation.mutate({ id: editRow.id, values: changed });
  };

  const exportCSV = () => {
    const header = tabConfig.columns.map((c) => c.label);
    const csvRows = [
      header.join(","),
      ...filtered.map((r: any) =>
        tabConfig.columns.map((c) => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Banco de Dados</h1>
          <p className="text-sm text-white/40">Gerencie registros diretamente</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-white/10 text-white/60 hover:bg-white/5"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as TableName); setSearch(""); }}>
        <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto gap-1 p-1">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.key}
              value={t.key}
              className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white/50 gap-1.5"
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="mt-4">
            <Card className="bg-[hsl(220,20%,10%)] border-white/5">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-sm font-medium text-white/60">
                    {tab.label} ({filtered.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                      <Input
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30 w-44"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportCSV}
                      className="h-8 text-xs border-white/10 text-white/60 hover:bg-white/5"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/5 hover:bg-transparent">
                          {tab.columns.map((c) => (
                            <TableHead key={c.key} className="text-white/40 text-xs whitespace-nowrap">
                              {c.label}
                            </TableHead>
                          ))}
                          <TableHead className="text-white/40 text-xs text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.length === 0 ? (
                          <TableRow className="border-white/5">
                            <TableCell colSpan={tab.columns.length + 1} className="text-center text-white/30 py-8 text-sm">
                              Nenhum registro
                            </TableCell>
                          </TableRow>
                        ) : (
                          filtered.map((row: any) => (
                            <TableRow key={row.id} className="border-white/5 hover:bg-white/[0.02]">
                              {tab.columns.map((c) => (
                                <TableCell key={c.key} className="text-white/70 text-xs max-w-[200px] truncate">
                                  {String(row[c.key] ?? "—")}
                                </TableCell>
                              ))}
                              <TableCell className="text-right whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-white/30 hover:text-blue-400 hover:bg-blue-500/10"
                                  onClick={() => openEdit(row)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-white/30 hover:text-red-400 hover:bg-red-500/10"
                                  onClick={() => {
                                    if (confirm("Excluir este registro permanentemente?")) {
                                      deleteMutation.mutate(row.id);
                                    }
                                  }}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editRow} onOpenChange={(open) => !open && setEditRow(null)}>
        <DialogContent className="bg-[hsl(220,20%,12%)] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Registro</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {tabConfig.columns
              .filter((c) => c.editable)
              .map((c) => (
                <div key={c.key} className="space-y-1">
                  <label className="text-xs text-white/50 font-medium">{c.label}</label>
                  {(c.key === "bio" || c.key === "notes" || c.key === "treatment_plan") ? (
                    <Textarea
                      value={editValues[c.key] ?? ""}
                      onChange={(e) => setEditValues((p) => ({ ...p, [c.key]: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white text-sm min-h-[80px]"
                    />
                  ) : (
                    <Input
                      value={editValues[c.key] ?? ""}
                      onChange={(e) => setEditValues((p) => ({ ...p, [c.key]: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white text-sm h-9"
                    />
                  )}
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditRow(null)}
              className="border-white/10 text-white/60"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={saveEdit}
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDatabaseCrud;
