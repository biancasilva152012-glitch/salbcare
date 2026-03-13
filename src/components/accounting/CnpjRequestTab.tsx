import { useState } from "react";
import { maskCpf, maskPhone } from "@/utils/masks";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Send, CheckCircle, Clock, Loader2, FileText } from "lucide-react";
import { motion } from "framer-motion";

const specialties = [
  "Cardiologia", "Dermatologia", "Endocrinologia", "Gastroenterologia",
  "Ginecologia", "Neurologia", "Oftalmologia", "Ortopedia",
  "Otorrinolaringologia", "Pediatria", "Psiquiatria", "Urologia",
  "Clínica Geral", "Cirurgia Geral", "Medicina do Trabalho",
  "Fisioterapia", "Fonoaudiologia", "Nutrição", "Odontologia", "Psicologia",
];

const statusMap: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  analysis: { label: "Em análise", icon: Clock, className: "text-yellow-400 bg-yellow-400/10" },
  in_progress: { label: "Em andamento", icon: Loader2, className: "text-blue-400 bg-blue-400/10" },
  completed: { label: "Concluído", icon: CheckCircle, className: "text-success bg-success/10" },
};

const CnpjRequestTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", cpf: "", whatsapp: "", specialty: "" });
  const [submitted, setSubmitted] = useState(false);

  const { data: requests = [] } = useQuery({
    queryKey: ["cnpj_requests", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("cnpj_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cnpj_requests").insert({
        user_id: user!.id,
        name: form.name.trim(),
        cpf: form.cpf.trim(),
        profession: form.specialty,
        city: form.whatsapp.trim(),
        documents: "",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cnpj_requests"] });
      setForm({ name: "", cpf: "", whatsapp: "", specialty: "" });
      setSubmitted(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isValid = form.name.trim() && form.cpf.trim() && form.whatsapp.trim() && form.specialty;

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center space-y-4"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-lg font-semibold">Solicitação Enviada!</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Nossa equipe de contabilidade entrará em contato em até 24h para abrir seu CNPJ.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSubmitted(false)}
          className="mt-2"
        >
          Enviar outra solicitação
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Solicitação de Abertura de Empresa</h3>
            <p className="text-xs text-muted-foreground">Preencha seus dados e nosso contador parceiro cuidará de tudo</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome Completo *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Seu nome completo"
              className="bg-accent border-border"
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>CPF *</Label>
              <Input
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                placeholder="000.000.000-00"
                className="bg-accent border-border"
                maxLength={14}
              />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp *</Label>
              <Input
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="(11) 99999-9999"
                className="bg-accent border-border"
                maxLength={15}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Especialidade Médica *</Label>
            <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
              <SelectTrigger className="bg-accent border-border">
                <SelectValue placeholder="Selecione sua especialidade" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={() => sendMutation.mutate()}
          disabled={!isValid || sendMutation.isPending}
          className="w-full gradient-primary font-semibold text-base py-5 gap-2"
          size="lg"
        >
          <Send className="h-4 w-4" />
          {sendMutation.isPending ? "Enviando..." : "Enviar para nosso Contador Parceiro"}
        </Button>
      </motion.div>

      {/* Previous requests */}
      {requests.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solicitações anteriores</p>
          {requests.map((r) => {
            const st = statusMap[r.status] || statusMap.analysis;
            const Icon = st.icon;
            return (
              <div key={r.id} className="glass-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.profession}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${st.className}`}>
                  <Icon className="h-3 w-3" />
                  {st.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CnpjRequestTab;
