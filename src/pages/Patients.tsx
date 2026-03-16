import { useState } from "react";
import { maskPhone } from "@/utils/masks";
import { motion } from "framer-motion";
import { Plus, Search, ChevronRight, Pencil, Trash2, FileDown, CalendarIcon, Users, FileSpreadsheet, Upload, Loader2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import PageSkeleton from "@/components/PageSkeleton";
import ListPagination from "@/components/ListPagination";
import { usePagination } from "@/hooks/usePagination";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageContainer from "@/components/PageContainer";
import PatientDocuments from "@/components/patients/PatientDocuments";
import PatientMedicalRecords from "@/components/patients/PatientMedicalRecords";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { exportPatientPdf } from "@/utils/exportPatientPdf";
import type { Tables } from "@/integrations/supabase/types";
import { downloadCsvTemplate, PATIENT_TEMPLATE_HEADERS, PATIENT_TEMPLATE_SAMPLE } from "@/utils/csvTemplates";

const emptyForm = { name: "", phone: "", email: "", birth_date: "", notes: "", medical_history: "", initial_anamnesis: "", procedure_performed: "" };

const Patients = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Tables<"patients"> | null>(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("patients").select("*").eq("user_id", user!.id).order("name");
      return data || [];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("patients").insert({
        user_id: user!.id, name: form.name, phone: form.phone || null, email: form.email || null,
        birth_date: form.birth_date || null, notes: form.notes || null, medical_history: form.medical_history || null,
        initial_anamnesis: form.initial_anamnesis || null, procedure_performed: form.procedure_performed || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setForm(emptyForm);
      setOpen(false);
      toast.success("Paciente cadastrado!");
    },
    onError: () => toast.error("Não conseguimos salvar. Tente de novo em instantes."),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("patients").update({
        name: form.name, phone: form.phone || null, email: form.email || null,
        birth_date: form.birth_date || null, notes: form.notes || null, medical_history: form.medical_history || null,
        initial_anamnesis: form.initial_anamnesis || null, procedure_performed: form.procedure_performed || null,
      }).eq("id", editId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setForm(emptyForm);
      setEditOpen(false);
      setEditId(null);
      if (selected && selected.id === editId) setSelected(null);
      toast.success("Paciente atualizado!");
    },
    onError: () => toast.error("Não conseguimos salvar. Tente de novo em instantes."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setSelected(null);
      toast.success("Paciente excluído!");
    },
    onError: () => toast.error("Não conseguimos salvar. Tente de novo em instantes."),
  });

  const openEdit = (p: Tables<"patients">) => {
    setEditId(p.id);
    setForm({ name: p.name, phone: p.phone || "", email: (p as any).email || "", birth_date: p.birth_date || "", notes: p.notes || "", medical_history: p.medical_history || "", initial_anamnesis: (p as any).initial_anamnesis || "", procedure_performed: (p as any).procedure_performed || "" });
    setEditOpen(true);
  };

  const handleExportPdf = async (patient: Tables<"patients">) => {
    try {
      const [{ data: appts }, { data: docs }] = await Promise.all([
        supabase.from("appointments").select("date, time, appointment_type, notes, status").eq("user_id", user!.id).eq("patient_id", patient.id).order("date", { ascending: false }),
        supabase.from("patient_documents").select("file_name, description, created_at").eq("patient_id", patient.id).order("created_at", { ascending: false }),
      ]);

      exportPatientPdf(patient, appts || [], docs || []);
      toast.success("PDF gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar PDF");
    }
  };

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const pagination = usePagination(filtered);

  const renderPatientForm = (isEdit: boolean) => (
    <div className="space-y-3 pt-2">
      <div className="space-y-1.5"><Label>Nome</Label><Input placeholder="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent border-border" /></div>
      <div className="space-y-1.5"><Label>Telefone</Label><Input placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} className="bg-accent border-border" /></div>
      <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" placeholder="paciente@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-accent border-border" /></div>
      <div className="space-y-1.5">
        <Label>Data de nascimento</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal bg-accent border-border",
                !form.birth_date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {form.birth_date
                ? format(parse(form.birth_date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")
                : "Selecionar data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={form.birth_date ? parse(form.birth_date, "yyyy-MM-dd", new Date()) : undefined}
              onSelect={(d) => setForm({ ...form, birth_date: d ? format(d, "yyyy-MM-dd") : "" })}
              locale={ptBR}
              captionLayout="dropdown-buttons"
              fromYear={1920}
              toYear={new Date().getFullYear()}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1.5"><Label>Anamnese Inicial</Label><Textarea placeholder="Queixa principal, história da doença atual, antecedentes..." value={form.initial_anamnesis} onChange={(e) => setForm({ ...form, initial_anamnesis: e.target.value })} className="bg-accent border-border" rows={3} /></div>
      <div className="space-y-1.5"><Label>Procedimento Realizado</Label><Textarea placeholder="Descrição do procedimento..." value={form.procedure_performed} onChange={(e) => setForm({ ...form, procedure_performed: e.target.value })} className="bg-accent border-border" rows={3} /></div>
      <div className="space-y-1.5"><Label>Observações</Label><Textarea placeholder="Notas..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-accent border-border" /></div>
      <div className="space-y-1.5"><Label>Histórico médico</Label><Textarea placeholder="Histórico..." value={form.medical_history} onChange={(e) => setForm({ ...form, medical_history: e.target.value })} className="bg-accent border-border" /></div>
      <Button onClick={() => isEdit ? updateMutation.mutate() : addMutation.mutate()} className="w-full gradient-primary font-semibold" disabled={addMutation.isPending || updateMutation.isPending}>
        {isEdit ? (updateMutation.isPending ? "Salvando..." : "Salvar") : (addMutation.isPending ? "Cadastrando..." : "Cadastrar")}
      </Button>
    </div>
  );

  if (isLoading) {
    return <PageContainer><PageSkeleton variant="list" /></PageContainer>;
  }

  return (
    <PageContainer onRefresh={() => queryClient.invalidateQueries({ queryKey: ["patients"] })}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => downloadCsvTemplate("modelo-pacientes.csv", PATIENT_TEMPLATE_HEADERS, PATIENT_TEMPLATE_SAMPLE)}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Modelo
            </Button>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setForm(emptyForm); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary gap-1"><Plus className="h-4 w-4" /> Novo</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Novo Paciente</DialogTitle></DialogHeader>
                {renderPatientForm(false)}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-accent border-border pl-9" />
        </div>

        {selected && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{selected.name}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => handleExportPdf(selected)} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <FileDown className="h-3 w-3" /> PDF
                </button>
                <button onClick={() => openEdit(selected)} className="text-xs text-primary hover:underline flex items-center gap-1"><Pencil className="h-3 w-3" /> Editar</button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="text-xs text-destructive hover:underline flex items-center gap-1"><Trash2 className="h-3 w-3" /> Excluir</button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir paciente?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(selected.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground">Fechar</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Telefone:</span> {selected.phone || "—"}</div>
              <div><span className="text-muted-foreground">E-mail:</span> {(selected as any).email || "—"}</div>
              <div><span className="text-muted-foreground">Nascimento:</span> {selected.birth_date ? new Date(selected.birth_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</div>
            </div>
            {selected.notes && <div className="text-sm"><span className="text-muted-foreground">Notas:</span> {selected.notes}</div>}
            {(selected as any).initial_anamnesis && (
              <div className="text-sm rounded-lg bg-accent p-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Anamnese Inicial</span>
                <p className="mt-1">{(selected as any).initial_anamnesis}</p>
              </div>
            )}
            {(selected as any).procedure_performed && (
              <div className="text-sm rounded-lg bg-accent p-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Procedimento Realizado</span>
                <p className="mt-1">{(selected as any).procedure_performed}</p>
              </div>
            )}
            {selected.medical_history && (
              <div className="text-sm rounded-lg bg-accent p-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Histórico Médico</span>
                <p className="mt-1">{selected.medical_history}</p>
              </div>
            )}

            {/* Medical Records History */}
            <PatientMedicalRecords patientId={selected.id} patientName={selected.name} />

            {/* Documents Section */}
            <PatientDocuments patientId={selected.id} />
          </motion.div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Editar Paciente</DialogTitle></DialogHeader>
            {renderPatientForm(true)}
          </DialogContent>
        </Dialog>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {filtered.length === 0 && !search && (
            <EmptyState
              icon={Users}
              title="Nenhum paciente cadastrado"
              description="Nenhum paciente cadastrado ainda. Você pode cadastrar manualmente ou baixar a planilha modelo para importação."
              actionLabel="Cadastrar paciente"
              onAction={() => { setForm(emptyForm); setOpen(true); }}
              extra={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 mt-2"
                  onClick={() => downloadCsvTemplate("modelo-pacientes.csv", PATIENT_TEMPLATE_HEADERS, PATIENT_TEMPLATE_SAMPLE)}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Baixar planilha modelo
                </Button>
              }
            />
          )}
          {filtered.length === 0 && search && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum paciente encontrado</p>
          )}
          {pagination.paginatedItems.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)} className="glass-card flex w-full items-center justify-between p-3 text-left transition-all hover:border-primary/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                  {p.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.phone || "Sem telefone"}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
          <ListPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            onNext={pagination.nextPage}
            onPrev={pagination.prevPage}
          />
        </motion.div>
      </div>
    </PageContainer>
  );
};

export default Patients;
