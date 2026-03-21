import { useState } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Clock, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { maskCpf } from "@/utils/masks";
import SEOHead from "@/components/SEOHead";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Aguardando Pagamento", color: "bg-amber-500" },
  pending_review: { label: "Aguardando Avaliação", color: "bg-blue-500" },
  in_progress: { label: "Em Andamento", color: "bg-primary" },
  completed: { label: "Concluído", color: "bg-green-500" },
  cancelled: { label: "Cancelado", color: "bg-destructive" },
};

const ProntoAtendimentoHistorico = () => {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const handleSearch = async () => {
    if (!cpf || !birthDate) {
      toast.error("Preencha CPF e data de nascimento.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("patient_cpf", cpf)
        .eq("patient_birth_date", birthDate)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResults(data || []);
      if (!data?.length) {
        toast.info("Nenhuma solicitação encontrada para esse CPF.");
      }
    } catch {
      toast.error("Erro ao buscar histórico.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Histórico de Atendimentos | SalbCare" description="Consulte suas receitas e atestados anteriores usando CPF e data de nascimento." />

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/pronto-atendimento")} className="p-2 rounded-lg hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">Meu Histórico</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          Consulte suas solicitações usando seu CPF e data de nascimento. Sem necessidade de login.
        </p>

        <div className="glass-card p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">CPF</Label>
            <Input
              value={cpf}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
              placeholder="000.000.000-00"
              className="bg-accent border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data de nascimento</Label>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="bg-accent border-border"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading} className="w-full gradient-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><Search className="h-4 w-4 mr-2" /> Buscar Histórico</>
            )}
          </Button>
        </div>

        {results && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {results.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">Nenhuma solicitação encontrada.</p>
              </div>
            ) : (
              results.map((req: any) => {
                const status = STATUS_MAP[req.status] || { label: req.status, color: "bg-muted" };
                const serviceLabel =
                  req.service_type === "prescription_renewal" ? "Renovação de Receita"
                  : req.service_type === "certificate" ? "Atestado"
                  : "Consulta";

                return (
                  <div key={req.id} className="glass-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{serviceLabel}</p>
                      <Badge className={`text-[10px] text-white ${status.color}`}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(req.created_at).toLocaleDateString("pt-BR")}
                      </p>
                      <p>Código: {req.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        <div className="text-center pt-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            A SALBCARE é uma plataforma de gestão e não substitui orientação médica profissional.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProntoAtendimentoHistorico;
