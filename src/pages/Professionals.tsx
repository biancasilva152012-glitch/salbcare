import { useState } from "react";
import { maskPhone } from "@/utils/masks";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, UserCheck, UserX, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PageContainer from "@/components/PageContainer";
import FeatureGate from "@/components/FeatureGate";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const specialties = [
  // Medicina
  "Clínico Geral", "Cardiologia", "Dermatologia", "Endocrinologia",
  "Ginecologia", "Neurologia", "Oftalmologia", "Ortopedia",
  "Pediatria", "Psiquiatria",
  // Odontologia
  "Odontologia Geral", "Ortodontia", "Implantodontia", "Endodontia",
  "Periodontia", "Odontopediatria", "Cirurgia Bucomaxilofacial",
  // Psicologia
  "Psicologia Clínica", "Neuropsicologia", "Psicologia Organizacional",
  // Fisioterapia
  "Fisioterapia Geral", "Fisioterapia Ortopédica", "Fisioterapia Respiratória",
  "Fisioterapia Neurológica", "Fisioterapia Esportiva", "Pilates Clínico",
  // Nutrição
  "Nutrição Clínica", "Nutrição Esportiva", "Nutrição Materno-Infantil",
  // Enfermagem
  "Enfermagem Geral", "Enfermagem Obstétrica", "Enfermagem do Trabalho",
  // Fonoaudiologia
  "Fonoaudiologia Clínica", "Audiologia", "Motricidade Orofacial",
  // Terapia Ocupacional
  "Terapia Ocupacional",
  // Farmácia
  "Farmácia Clínica",
  // Biomedicina
  "Biomedicina",
  // Outros
  "Outro",
];

const emptyForm = { name: "", email: "", phone: "", specialty: "", crm: "", status: "active" };

const ProfessionalsContent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("professionals").select("*").eq("user_id", user!.id).order("name");
      return data || [];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("professionals").insert({
        user_id: user!.id,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        specialty: form.specialty,
        crm: form.crm || null,
        status: form.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      setForm(emptyForm);
      setOpen(false);
      toast.success("Profissional cadastrado!");
    },
    onError: () => toast.error("Não conseguimos salvar. Tente de novo em instantes."),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("professionals").update({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        specialty: form.specialty,
        crm: form.crm || null,
        status: form.status,
      }).eq("id", editId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      setForm(emptyForm);
      setEditOpen(false);
      setEditId(null);
      toast.success("Profissional atualizado!");
    },
    onError: () => toast.error("Não conseguimos salvar. Tente de novo em instantes."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("professionals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional removido!");
    },
    onError: () => toast.error("Não conseguimos salvar. Tente de novo em instantes."),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const { error } = await supabase.from("professionals").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Não conseguimos salvar. Tente de novo em instantes."),
  });

  const openEdit = (p: typeof professionals[0]) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      email: p.email || "",
      phone: p.phone || "",
      specialty: p.specialty || "",
      crm: p.crm || "",
      status: p.status,
    });
    setEditOpen(true);
  };

  const filtered = professionals.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.specialty && p.specialty.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount = professionals.filter((p) => p.status === "active").length;

  const ProfessionalForm = ({ isEdit }: { isEdit: boolean }) => (
    <div className="space-y-3 pt-2">
      <div className="space-y-1.5">
        <Label>Nome completo</Label>
        <Input placeholder="Nome do profissional" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent border-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input placeholder="email@exemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-accent border-border" />
        </div>
        <div className="space-y-1.5">
          <Label>Telefone</Label>
          <Input placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} className="bg-accent border-border" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Especialidade</Label>
        <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
          <SelectTrigger className="bg-accent border-border"><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            {specialties.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>CRM / Registro</Label>
          <Input placeholder="CRM/SP 123456" value={form.crm} onChange={(e) => setForm({ ...form, crm: e.target.value })} className="bg-accent border-border" />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger className="bg-accent border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        onClick={() => isEdit ? updateMutation.mutate() : addMutation.mutate()}
        className="w-full gradient-primary font-semibold"
        disabled={!form.name || !form.specialty || addMutation.isPending || updateMutation.isPending}
      >
        {isEdit ? (updateMutation.isPending ? "Salvando..." : "Salvar") : (addMutation.isPending ? "Cadastrando..." : "Cadastrar")}
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{activeCount} profissional(is) ativo(s)</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary gap-1"><Plus className="h-4 w-4" /> Novo</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Novo Profissional</DialogTitle></DialogHeader>
            <ProfessionalForm isEdit={false} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou especialidade..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-accent border-border pl-9" />
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Editar Profissional</DialogTitle></DialogHeader>
          <ProfessionalForm isEdit={true} />
        </DialogContent>
      </Dialog>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum profissional encontrado</p>
        )}
        {filtered.map((p) => (
          <div key={p.id} className={`glass-card p-4 space-y-2 transition-all ${p.status === "inactive" ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${p.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {p.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{p.name}</p>
                    <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                      {p.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Stethoscope className="h-3 w-3" />
                    <span>{p.specialty || "—"}</span>
                    {p.crm && <span>• {p.crm}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {p.email && <span>{p.email}</span>}
              {p.email && p.phone && <span>•</span>}
              {p.phone && <span>{p.phone}</span>}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => toggleStatus.mutate({ id: p.id, currentStatus: p.status })}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${p.status === "active" ? "text-destructive hover:bg-destructive/10" : "text-success hover:bg-success/10"}`}
              >
                {p.status === "active" ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                {p.status === "active" ? "Desativar" : "Ativar"}
              </button>
              <button onClick={() => openEdit(p)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Pencil className="h-3 w-3" /> Editar
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-1 text-xs text-destructive hover:underline">
                    <Trash2 className="h-3 w-3" /> Excluir
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir profissional?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const Professionals = () => {
  return (
    <PageContainer>
      <FeatureGate feature="multi_professionals">
        <ProfessionalsContent />
      </FeatureGate>
    </PageContainer>
  );
};

export default Professionals;
