import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, DollarSign, Pencil, Plus, Search, Stethoscope, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { maskCurrency, parseBRL } from "@/utils/currencyMask";
import AdminAcademySalesSummary from "@/components/admin/AdminAcademySalesSummary";

type Mode = "patients" | "appointments" | "income" | "expense";

type AdminRecord = Record<string, string | number | null> & { id: string };

type Field = {
  key: string;
  label: string;
  type?: "text" | "email" | "date" | "time" | "money" | "textarea" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
};

const configs: Record<Mode, { label: string; title: string; icon: React.ElementType; table: string; fields: Field[]; query: string; defaults: Record<string, string> }> = {
  patients: {
    label: "Pacientes",
    title: "Gerenciar pacientes",
    icon: Users,
    table: "patients",
    query: "id, user_id, name, email, phone, birth_date, notes, created_at",
    defaults: { name: "", email: "", phone: "", birth_date: "", notes: "" },
    fields: [
      { key: "user_id", label: "ID do profissional", required: true },
      { key: "name", label: "Nome", required: true },
      { key: "email", label: "E-mail", type: "email" },
      { key: "phone", label: "Telefone" },
      { key: "birth_date", label: "Nascimento", type: "date" },
      { key: "notes", label: "Observações", type: "textarea" },
    ],
  },
  appointments: {
    label: "Consultas",
    title: "Gerenciar consultas",
    icon: CalendarDays,
    table: "appointments",
    query: "id, user_id, patient_name, date, time, appointment_type, status, notes, created_at",
    defaults: { patient_name: "", date: format(new Date(), "yyyy-MM-dd"), time: "09:00", appointment_type: "consulta", status: "scheduled", notes: "" },
    fields: [
      { key: "user_id", label: "ID do profissional", required: true },
      { key: "patient_name", label: "Paciente", required: true },
      { key: "date", label: "Data", type: "date", required: true },
      { key: "time", label: "Hora", type: "time", required: true },
      { key: "appointment_type", label: "Tipo" },
      { key: "status", label: "Status", type: "select", options: [{ value: "scheduled", label: "Agendada" }, { value: "completed", label: "Concluída" }, { value: "cancelled", label: "Cancelada" }, { value: "pending", label: "Pendente" }] },
      { key: "notes", label: "Observações", type: "textarea" },
    ],
  },
  income: {
    label: "Receitas",
    title: "Gerenciar receitas",
    icon: DollarSign,
    table: "financial_transactions",
    query: "id, user_id, description, amount, type, category, date, created_at",
    defaults: { description: "", amount: "", category: "consulta", date: format(new Date(), "yyyy-MM-dd"), type: "income" },
    fields: [
      { key: "user_id", label: "ID do profissional", required: true },
      { key: "description", label: "Descrição", required: true },
      { key: "amount", label: "Valor", type: "money", required: true },
      { key: "category", label: "Categoria" },
      { key: "date", label: "Data", type: "date", required: true },
    ],
  },
  expense: {
    label: "Despesas",
    title: "Gerenciar despesas",
    icon: Stethoscope,
    table: "financial_transactions",
    query: "id, user_id, description, amount, type, category, date, created_at",
    defaults: { description: "", amount: "", category: "outros", date: format(new Date(), "yyyy-MM-dd"), type: "expense" },
    fields: [
      { key: "user_id", label: "ID do profissional", required: true },
      { key: "description", label: "Descrição", required: true },
      { key: "amount", label: "Valor", type: "money", required: true },
      { key: "category", label: "Categoria" },
      { key: "date", label: "Data", type: "date", required: true },
    ],
  },
};

const fieldValue = (record: AdminRecord, key: string) => String(record[key] ?? "");

const cleanValues = (values: Record<string, string>, mode: Mode) => {
  const config = configs[mode];
  const payload: Record<string, string | number | null> = {};
  config.fields.forEach((field) => {
    const value = values[field.key]?.trim() || "";
    if (field.required && !value) throw new Error(`Preencha ${field.label}.`);
    if (field.type === "money") {
      const amount = parseBRL(value);
      if (field.required && amount <= 0) throw new Error("Informe um valor válido.");
      payload[field.key] = amount || null;
      return;
    }
    payload[field.key] = value || null;
  });
  if (mode === "income" || mode === "expense") payload.type = mode;
  return payload;
};

const AdminOperationsManager = () => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("patients");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AdminRecord | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const config = configs[mode];

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["admin-operations", mode],
    queryFn: async (): Promise<AdminRecord[]> => {
      let query = (supabase as any).from(config.table).select(config.query).order("created_at", { ascending: false }).limit(200);
      if (mode === "income" || mode === "expense") query = query.eq("type", mode);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) =>
      config.fields.some((field) => fieldValue(record, field.key).toLowerCase().includes(needle)),
    );
  }, [config.fields, records, search]);

  const openCreate = () => {
    setEditRecord(null);
    setValues(config.defaults);
    setOpen(true);
  };

  const openEdit = (record: AdminRecord) => {
    const nextValues: Record<string, string> = {};
    config.fields.forEach((field) => {
      const raw = fieldValue(record, field.key);
      nextValues[field.key] = field.type === "money" && raw ? Number(raw).toLocaleString("pt-BR") : raw;
    });
    setEditRecord(record);
    setValues(nextValues);
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = cleanValues(values, mode);
      if (editRecord) {
        const { error } = await (supabase as any).from(config.table).update(payload).eq("id", editRecord.id);
        if (error) throw error;
        return;
      }
      const { error } = await (supabase as any).from(config.table).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-operations", mode] });
      setOpen(false);
      setEditRecord(null);
      toast.success("Registro salvo.");
    },
    onError: (error: Error) => toast.error(error.message || "Não conseguimos salvar."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(config.table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-operations", mode] });
      toast.success("Registro removido.");
    },
    onError: () => toast.error("Não conseguimos remover."),
  });

  return (
    <div className="space-y-6 text-foreground">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operação</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Administração do consultório</h1>
            <p className="text-sm text-muted-foreground">Gerencie dados reais sem entrar na tela do profissional.</p>
          </div>
          <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Novo registro</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {(Object.keys(configs) as Mode[]).map((key) => {
          const item = configs[key];
          const Icon = item.icon;
          return (
            <button
              key={key}
              type="button"
              onClick={() => { setMode(key); setSearch(""); }}
              className={`min-h-16 rounded-2xl border px-3 text-left transition-colors ${mode === key ? "border-secondary bg-accent" : "border-border bg-card hover:bg-accent"}`}
            >
              <Icon className="h-4 w-4 text-secondary" />
              <span className="mt-2 block text-sm font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold">{config.title}</h2>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar" className="pl-9" />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando registros.</p>}
          {!isLoading && filtered.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhum registro encontrado.</p>}
          {filtered.map((record) => (
            <div key={record.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {fieldValue(record, "name") || fieldValue(record, "patient_name") || fieldValue(record, "description") || record.id}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {fieldValue(record, "email") || fieldValue(record, "date") || fieldValue(record, "category") || fieldValue(record, "status")}
                </p>
              </div>
              {(mode === "income" || mode === "expense") && (
                <p className="shrink-0 font-mono text-sm font-semibold">R$ {Number(record.amount || 0).toLocaleString("pt-BR")}</p>
              )}
              <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => openEdit(record)}><Pencil className="h-4 w-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteMutation.mutate(record.id)}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </section>

      <AdminAcademySalesSummary />

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permissões</p>
        <h2 className="mt-1 text-lg font-bold">Cadastrar outros administradores</h2>
        <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li>1. Peça para a pessoa criar a conta no SalbCare com o e-mail dela.</li>
          <li>2. Abra a tela de permissões e busque pelo nome ou e-mail.</li>
          <li>3. Troque a permissão para Admin e confirme.</li>
        </ol>
        <Button variant="outline" className="mt-3 w-full sm:w-auto" onClick={() => window.location.assign("/admin/roles")}>
          Abrir permissões
        </Button>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{editRecord ? "Editar registro" : "Novo registro"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            {config.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea value={values[field.key] || ""} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} />
                ) : field.type === "select" ? (
                  <Select value={values[field.key] || ""} onValueChange={(value) => setValues({ ...values, [field.key]: value })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {(field.options || []).map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.type === "date" || field.type === "time" || field.type === "email" ? field.type : "text"}
                    inputMode={field.type === "money" ? "numeric" : undefined}
                    value={values[field.key] || ""}
                    onChange={(event) => setValues({ ...values, [field.key]: field.type === "money" ? maskCurrency(event.target.value) : event.target.value })}
                  />
                )}
              </div>
            ))}
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOperationsManager;
