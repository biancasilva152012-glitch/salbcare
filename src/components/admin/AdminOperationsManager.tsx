import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ClipboardList, DollarSign, HelpCircle, Pencil, Plus, Search, ShieldCheck, Stethoscope, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { maskCurrency, parseBRL } from "@/utils/currencyMask";
import AdminAcademySalesSummary from "@/components/admin/AdminAcademySalesSummary";
import { cn } from "@/lib/utils";
import AdminAccountCenter from "@/components/admin/AdminAccountCenter";

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

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  completed: "Concluída",
  cancelled: "Cancelada",
  pending: "Pendente",
  aguardando_confirmacao: "Aguardando",
  aguardando_comprovante: "Aguardando",
};

const statusTone = (status: string) => {
  if (status === "completed" || status === "confirmed") return "border-secondary/30 bg-accent text-accent-foreground";
  if (status === "cancelled") return "border-destructive/25 bg-destructive/10 text-destructive";
  if (status.startsWith("aguardando") || status === "pending") return "border-gold/30 bg-gold/10 text-foreground";
  return "border-border bg-muted text-muted-foreground";
};

const initials = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

const prettyDate = (value: string) => {
  if (!value) return "";
  try {
    return format(parseISO(value), "dd MMM yyyy", { locale: ptBR }).replace(".", "");
  } catch {
    return value;
  }
};

const PAGE_SIZE = 12;

const AdminOperationsManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const area = searchParams.get("area") === "contas" ? "accounts" : "records";
  const [mode, setMode] = useState<Mode>("patients");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AdminRecord | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState("all");
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

  const { data: summary } = useQuery({
    queryKey: ["admin-operation-summary"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const [patients, appointments, transactions] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }).gte("date", monthStart),
        supabase.from("financial_transactions").select("amount, type").gte("date", monthStart),
      ]);
      const rows = transactions.data || [];
      return {
        patients: patients.count || 0,
        appointments: appointments.count || 0,
        income: rows.filter((row) => row.type === "income").reduce((sum, row) => sum + Number(row.amount), 0),
        expense: rows.filter((row) => row.type === "expense").reduce((sum, row) => sum + Number(row.amount), 0),
      };
    },
  });

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    let list = records;
    if (needle) {
      list = list.filter((record) =>
        config.fields.some((field) => fieldValue(record, field.key).toLowerCase().includes(needle)),
      );
    }
    if (mode === "appointments" && statusFilter !== "all") {
      list = list.filter((record) => fieldValue(record, "status") === statusFilter);
    }
    return list;
  }, [config.fields, mode, records, search, statusFilter]);

  const page = filtered.slice(0, visible);

  const switchMode = (key: Mode) => {
    setMode(key);
    setSearch("");
    setStatusFilter("all");
    setVisible(PAGE_SIZE);
  };

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

  const primaryLabel = (record: AdminRecord) =>
    fieldValue(record, "name") || fieldValue(record, "patient_name") || fieldValue(record, "description") || record.id;

  const secondaryLabel = (record: AdminRecord) => {
    if (mode === "patients") return fieldValue(record, "email") || fieldValue(record, "phone");
    if (mode === "appointments") return fieldValue(record, "appointment_type") || "Consulta";
    return fieldValue(record, "category");
  };

  const dateLabel = (record: AdminRecord) => {
    if (mode === "appointments") {
      const time = fieldValue(record, "time").slice(0, 5);
      return [prettyDate(fieldValue(record, "date")), time].filter(Boolean).join(" · ");
    }
    if (mode === "income" || mode === "expense") return prettyDate(fieldValue(record, "date"));
    return prettyDate(fieldValue(record, "created_at").slice(0, 10));
  };

  const RowActions = ({ record }: { record: AdminRecord }) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        size="icon"
        variant="ghost"
        aria-label="Editar"
        className="h-9 w-9 text-muted-foreground opacity-100 transition-opacity hover:bg-muted hover:text-foreground md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        onClick={() => openEdit(record)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Excluir"
            className="h-9 w-9 opacity-100 transition-opacity hover:bg-destructive/10 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="border-border bg-card">
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
  );

  return (
    <div className="space-y-8 text-foreground">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="admin-eyebrow">Operação</p>
          <h1 className="text-2xl leading-tight sm:text-3xl">Administração do consultório</h1>
          <p className="text-sm text-muted-foreground">Gerencie dados reais sem entrar na tela do profissional.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="icon" className="h-12 w-12" aria-label="Ajuda da administração"><Link to="/admin/ajuda"><HelpCircle className="h-5 w-5" /></Link></Button>
          {area === "records" && <Button className="min-h-12 flex-1 gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover sm:flex-none" onClick={openCreate}><Plus className="h-4 w-4" /> Novo registro</Button>}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
        <Button variant={area === "records" ? "default" : "ghost"} className="min-h-12 gap-2" onClick={() => setSearchParams({})}><ClipboardList className="h-4 w-4" /> Registros</Button>
        <Button variant={area === "accounts" ? "default" : "ghost"} className="min-h-12 gap-2" onClick={() => setSearchParams({ area: "contas" })}><UserPlus className="h-4 w-4" /> Contas e acessos</Button>
      </div>

      {area === "records" ? <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Pacientes", value: summary?.patients || 0, note: "Total de pacientes cadastrados", icon: Users },
          { label: "Consultas", value: summary?.appointments || 0, note: "Consultas marcadas neste mês", icon: CalendarDays },
          { label: "Receitas", value: `R$ ${(summary?.income || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, note: "Receitas lançadas neste mês", icon: DollarSign },
          { label: "Despesas", value: `R$ ${(summary?.expense || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, note: "Despesas lançadas neste mês", icon: Stethoscope },
        ].map(({ label, value, note, icon: Icon }) => <div key={label} className="admin-card min-w-0 p-4"><div className="flex items-start justify-between gap-2"><p className="admin-eyebrow">{label}</p><Icon className="h-4 w-4 shrink-0 text-secondary" /></div><p className="admin-num mt-2 truncate text-xl font-semibold sm:text-2xl">{value}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{note}</p></div>)}
      </section>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-2 shadow-sm sm:grid-cols-4">
        {(Object.keys(configs) as Mode[]).map((key) => {
          const item = configs[key];
          const Icon = item.icon;
          const active = mode === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => switchMode(key)}
              className={cn(
                "flex min-h-12 items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors duration-150",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", active ? "bg-white/15" : "bg-accent")}>
                <Icon className={cn("h-4 w-4", active ? "text-primary-foreground" : "text-secondary")} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{item.label}</span>
                {active && <span className="admin-num block text-[11px] opacity-70">{records.length} registros</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table card */}
      <section className="admin-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <h2 className="text-lg leading-snug">{config.title}</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setVisible(PAGE_SIZE); }}
                placeholder="Buscar"
                className="h-11 rounded-lg border-border bg-background pl-9 pr-14 text-sm"
              />
              <span className="admin-num pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
                ⌘K
              </span>
            </div>
            {mode === "appointments" && (
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setVisible(PAGE_SIZE); }}>
                <SelectTrigger className="h-11 w-full rounded-lg border-border bg-background text-sm sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(STATUS_LABELS).slice(0, 5).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Skeleton */}
        {isLoading && (
          <div className="divide-y divide-border">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-3 p-4">
                <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />
                <span className="h-3 flex-1 animate-pulse rounded bg-muted" />
                <span className="hidden h-3 w-24 animate-pulse rounded bg-muted sm:block" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
              <config.icon className="h-6 w-6 text-secondary" />
            </span>
            <div>
              <p className="text-sm font-semibold">Nenhum registro encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">Ajuste a busca ou crie um novo registro.</p>
            </div>
            <Button variant="outline" className="min-h-11 rounded-lg" onClick={openCreate}>Novo registro</Button>
          </div>
        )}

        {/* Desktop table */}
        {!isLoading && filtered.length > 0 && (
          <>
            <table className="hidden w-full table-fixed md:table">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="admin-eyebrow px-5 py-3 font-semibold">{mode === "patients" ? "Paciente" : mode === "appointments" ? "Paciente" : "Descrição"}</th>
                  <th className="admin-eyebrow w-44 px-5 py-3 font-semibold">{mode === "patients" ? "Cadastro" : "Data"}</th>
                  <th className="admin-eyebrow w-36 px-5 py-3 font-semibold">{mode === "appointments" ? "Status" : mode === "patients" ? "Telefone" : "Valor"}</th>
                  <th className="admin-eyebrow w-28 px-5 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {page.map((record) => {
                  const status = fieldValue(record, "status");
                  return (
                    <tr key={record.id} className="group border-b border-border transition-colors last:border-0 hover:bg-muted/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="admin-num flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                            {initials(primaryLabel(record))}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{primaryLabel(record)}</span>
                            <span className="block truncate text-xs text-muted-foreground">{secondaryLabel(record)}</span>
                          </span>
                        </div>
                      </td>
                      <td className="admin-num px-5 py-3.5 text-sm text-muted-foreground">{dateLabel(record)}</td>
                      <td className="px-5 py-3.5">
                        {mode === "appointments" ? (
                          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusTone(status))}>
                            {STATUS_LABELS[status] || status}
                          </span>
                        ) : mode === "income" || mode === "expense" ? (
                          <span className={cn("admin-num text-sm font-semibold", mode === "income" ? "text-gold" : "text-foreground")}>
                            R$ {Number(record.amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="admin-num text-sm text-muted-foreground">{fieldValue(record, "phone") || "sem telefone"}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5"><RowActions record={record} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
              {page.map((record) => {
                const status = fieldValue(record, "status");
                return (
                  <div key={record.id} className="group flex items-start gap-3 p-4">
                    <span className="admin-num flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {initials(primaryLabel(record))}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{primaryLabel(record)}</p>
                      <p className="truncate text-xs text-muted-foreground">{secondaryLabel(record)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="admin-num text-xs text-muted-foreground">{dateLabel(record)}</span>
                        {mode === "appointments" && (
                          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusTone(status))}>
                            {STATUS_LABELS[status] || status}
                          </span>
                        )}
                        {(mode === "income" || mode === "expense") && (
                          <span className={cn("admin-num text-xs font-semibold", mode === "income" ? "text-gold" : "text-foreground")}>
                            R$ {Number(record.amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                    <RowActions record={record} />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!isLoading && filtered.length > page.length && (
          <div className="border-t border-border p-4 text-center">
            <Button variant="outline" className="min-h-11 rounded-lg" onClick={() => setVisible(visible + PAGE_SIZE)}>
              Carregar mais
            </Button>
            <p className="admin-num mt-2 text-xs text-muted-foreground">{page.length} de {filtered.length}</p>
          </div>
        )}
      </section>

      <AdminAcademySalesSummary />

      <section className="admin-card p-4 sm:p-5">
        <p className="admin-eyebrow">Permissões</p>
        <h2 className="mt-1.5 text-lg leading-snug">Cadastrar outros administradores</h2>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2.5">
            <span className="admin-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">1</span>
            Peça para a pessoa criar a conta no SalbCare com o e-mail dela.
          </li>
          <li className="flex gap-2.5">
            <span className="admin-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">2</span>
            Abra a tela de permissões e busque pelo nome ou e-mail.
          </li>
          <li className="flex gap-2.5">
            <span className="admin-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">3</span>
            Troque a permissão para Admin e confirme.
          </li>
        </ol>
        <Button variant="outline" className="mt-4 min-h-11 w-full gap-2 rounded-lg sm:w-auto" onClick={() => setSearchParams({ area: "contas" })}>
          <ShieldCheck className="h-4 w-4 text-secondary" /> Gerenciar nesta tela
        </Button>
      </section>
      </> : <AdminAccountCenter />}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-border bg-card">
          <DialogHeader><DialogTitle>{editRecord ? "Editar registro" : "Novo registro"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            {config.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea className="rounded-lg" value={values[field.key] || ""} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} />
                ) : field.type === "select" ? (
                  <Select value={values[field.key] || ""} onValueChange={(value) => setValues({ ...values, [field.key]: value })}>
                    <SelectTrigger className="h-11 rounded-lg"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {(field.options || []).map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="h-11 rounded-lg"
                    type={field.type === "date" || field.type === "time" || field.type === "email" ? field.type : "text"}
                    inputMode={field.type === "money" ? "numeric" : undefined}
                    value={values[field.key] || ""}
                    onChange={(event) => setValues({ ...values, [field.key]: field.type === "money" ? maskCurrency(event.target.value) : event.target.value })}
                  />
                )}
              </div>
            ))}
            <Button className="min-h-11 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOperationsManager;
