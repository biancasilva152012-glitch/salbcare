import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Receipt, Trash2, FileJson, Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { downloadAbrasfJson } from "@/utils/exportAbrasf";

const paymentMethods = [
  { value: "pix", label: "PIX" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "debit_card", label: "Cartão de Débito" },
  { value: "cash", label: "Dinheiro" },
  { value: "bank_transfer", label: "Transferência" },
];

const commonServiceCodes = [
  { value: "4.01", label: "4.01 – Medicina e biomedicina" },
  { value: "4.02", label: "4.02 – Análises clínicas" },
  { value: "4.03", label: "4.03 – Hospitais, clínicas" },
  { value: "4.06", label: "4.06 – Enfermagem" },
  { value: "4.07", label: "4.07 – Ortóptica" },
  { value: "4.08", label: "4.08 – Próteses" },
  { value: "4.09", label: "4.09 – Terapia ocupacional e fisioterapia" },
  { value: "4.10", label: "4.10 – Nutrição" },
  { value: "4.11", label: "4.11 – Obstetrícia" },
  { value: "4.12", label: "4.12 – Odontologia" },
  { value: "4.13", label: "4.13 – Fonoaudiologia" },
  { value: "4.14", label: "4.14 – Clínicas de vacinação" },
  { value: "4.16", label: "4.16 – Psicologia" },
];

const brazilianStates = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const emptyForm = {
  patient_name: "", service: "", amount: "", date: "", payment_method: "pix",
  cpf_cnpj: "", service_code: "", iss_rate: "",
  address_street: "", address_number: "", address_complement: "",
  address_neighborhood: "", address_city: "", address_state: "", address_zip: "",
};

const InvoicesTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-for-nf", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoices").insert({
        user_id: user!.id,
        patient_name: form.patient_name,
        service: form.service,
        amount: Number(form.amount),
        date: form.date,
        payment_method: form.payment_method,
        cpf_cnpj: form.cpf_cnpj,
        service_code: form.service_code,
        iss_rate: Number(form.iss_rate),
        address_street: form.address_street,
        address_number: form.address_number,
        address_complement: form.address_complement || null,
        address_neighborhood: form.address_neighborhood,
        address_city: form.address_city,
        address_state: form.address_state,
        address_zip: form.address_zip,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setForm(emptyForm);
      setOpen(false);
      toast.success("Nota fiscal gerada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Nota fiscal excluída!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleExportAbrasf = (inv: any) => {
    if (!inv.cpf_cnpj || !inv.service_code || !inv.iss_rate) {
      toast.error("NF sem dados fiscais obrigatórios para exportar ABRASF");
      return;
    }
    downloadAbrasfJson(
      {
        id: inv.id,
        patient_name: inv.patient_name,
        cpf_cnpj: inv.cpf_cnpj,
        service: inv.service,
        service_code: inv.service_code,
        amount: Number(inv.amount),
        iss_rate: Number(inv.iss_rate),
        date: inv.date,
        payment_method: inv.payment_method,
        address_street: inv.address_street || "",
        address_number: inv.address_number || "",
        address_complement: inv.address_complement,
        address_neighborhood: inv.address_neighborhood || "",
        address_city: inv.address_city || "",
        address_state: inv.address_state || "",
        address_zip: inv.address_zip || "",
      },
      {
        name: profile?.name || "Prestador",
        email: profile?.email || "",
      }
    );
    toast.success("JSON ABRASF exportado!");
  };

  const isValid =
    form.patient_name && form.service && form.amount && form.date &&
    form.cpf_cnpj && form.service_code && form.iss_rate &&
    form.address_street && form.address_number &&
    form.address_neighborhood && form.address_city && form.address_state && form.address_zip;

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Gere notas fiscais de serviços</p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary gap-1"><Plus className="h-4 w-4" /> Nova NF</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Gerar Nota Fiscal</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Tomador */}
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tomador do Serviço</p>
              <div className="space-y-1.5"><Label>Nome / Razão Social *</Label><Input value={form.patient_name} onChange={f("patient_name")} className="bg-accent border-border" /></div>
              <div className="space-y-1.5"><Label>CPF / CNPJ *</Label><Input value={form.cpf_cnpj} onChange={f("cpf_cnpj")} placeholder="000.000.000-00 ou 00.000.000/0001-00" className="bg-accent border-border" /></div>

              {/* Endereço */}
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">Endereço do Tomador</p>
              <div className="space-y-1.5"><Label>Logradouro *</Label><Input value={form.address_street} onChange={f("address_street")} className="bg-accent border-border" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Número *</Label><Input value={form.address_number} onChange={f("address_number")} className="bg-accent border-border" /></div>
                <div className="space-y-1.5"><Label>Complemento</Label><Input value={form.address_complement} onChange={f("address_complement")} className="bg-accent border-border" /></div>
              </div>
              <div className="space-y-1.5"><Label>Bairro *</Label><Input value={form.address_neighborhood} onChange={f("address_neighborhood")} className="bg-accent border-border" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 col-span-1"><Label>CEP *</Label><Input value={form.address_zip} onChange={f("address_zip")} placeholder="00000-000" className="bg-accent border-border" /></div>
                <div className="space-y-1.5"><Label>Cidade *</Label><Input value={form.address_city} onChange={f("address_city")} className="bg-accent border-border" /></div>
                <div className="space-y-1.5">
                  <Label>UF *</Label>
                  <Select value={form.address_state} onValueChange={(v) => setForm({ ...form, address_state: v })}>
                    <SelectTrigger className="bg-accent border-border"><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>{brazilianStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Serviço */}
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">Dados do Serviço</p>
              <div className="space-y-1.5"><Label>Descrição do Serviço *</Label><Input value={form.service} onChange={f("service")} placeholder="Ex: Consulta médica" className="bg-accent border-border" /></div>
              <div className="space-y-1.5">
                <Label>Código de Serviço (LC 116) *</Label>
                <Select value={form.service_code} onValueChange={(v) => setForm({ ...form, service_code: v })}>
                  <SelectTrigger className="bg-accent border-border"><SelectValue placeholder="Selecione o código" /></SelectTrigger>
                  <SelectContent>{commonServiceCodes.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label>Valor (R$) *</Label><Input type="number" value={form.amount} onChange={f("amount")} className="bg-accent border-border" /></div>
                <div className="space-y-1.5"><Label>Alíquota ISS (%) *</Label><Input type="number" step="0.01" value={form.iss_rate} onChange={f("iss_rate")} placeholder="2 a 5" className="bg-accent border-border" /></div>
                <div className="space-y-1.5"><Label>Data *</Label><Input type="date" value={form.date} onChange={f("date")} className="bg-accent border-border" /></div>
              </div>
              <div className="space-y-1.5">
                <Label>Forma de Pagamento</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger className="bg-accent border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{paymentMethods.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <Button onClick={() => addMutation.mutate()} className="w-full gradient-primary font-semibold" disabled={!isValid || addMutation.isPending}>
                {addMutation.isPending ? "Gerando..." : "Gerar Nota Fiscal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        {invoices.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma nota fiscal gerada</p>}
        {invoices.map((inv) => (
          <div key={inv.id} className="glass-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10">
                <Receipt className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">{inv.patient_name}</p>
                <p className="text-xs text-muted-foreground">
                  {inv.service} • {new Date(inv.date + "T12:00:00").toLocaleDateString("pt-BR")}
                  {(inv as any).service_code && ` • LC ${(inv as any).service_code}`}
                </p>
                {inv.status === "pending" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] mt-1 px-1.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400">
                    <Clock className="h-2.5 w-2.5" /> Pendente de emissão pelo contador
                  </span>
                ) : inv.status === "issued" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] mt-1 px-1.5 py-0.5 rounded-full bg-success/10 text-success">
                    <CheckCircle className="h-2.5 w-2.5" /> Emitida
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-success">R$ {Number(inv.amount).toLocaleString("pt-BR")}</span>
              <button
                onClick={() => handleExportAbrasf(inv)}
                className="p-1 text-primary hover:text-primary/80"
                title="Exportar JSON ABRASF"
              >
                <FileJson className="h-3.5 w-3.5" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-destructive hover:text-destructive/80"><Trash2 className="h-3.5 w-3.5" /></button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir nota fiscal?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate(inv.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
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

export default InvoicesTab;
