import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import PremiumOnlyGuard from "@/components/PremiumOnlyGuard";

const DashboardTeleconsultaInner = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [linkInput, setLinkInput] = useState("");

  const { data: meetLink, isLoading } = useQuery({
    queryKey: ["meet-link", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("meet_link")
        .eq("user_id", user!.id)
        .single();
      return data?.meet_link || "";
    },
    enabled: !!user,
  });

  // Initialize local state from query
  const displayLink = linkInput || meetLink || "";

  const saveMutation = useMutation({
    mutationFn: async (link: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ meet_link: link })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meet-link"] });
      toast.success("Link salvo com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar."),
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(displayLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const hasSavedLink = !!meetLink;

  return (
    <PageContainer backTo="/dashboard">
      <div className="space-y-5">
        <div className="space-y-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" /> Sua Teleconsulta
          </h1>
        </div>

        <div className="glass-card p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Seu link fixo do Google Meet</Label>
            <Input
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              value={linkInput || meetLink || ""}
              onChange={(e) => setLinkInput(e.target.value)}
              className="bg-background/50 border-border/60"
            />
          </div>
          <Button
            onClick={() => saveMutation.mutate(linkInput || meetLink || "")}
            disabled={saveMutation.isPending || (!linkInput && !meetLink)}
            className="w-full gradient-primary font-semibold"
          >
            {saveMutation.isPending ? "Salvando..." : "Salvar link"}
          </Button>
        </div>

        {hasSavedLink && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 space-y-3 ring-1 ring-primary/20"
          >
            <p className="text-sm font-semibold">Seu link de atendimento</p>
            <p className="text-xs text-muted-foreground break-all">{meetLink}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado!" : "Copiar link"}
              </Button>
              <Button size="sm" className="flex-1 gap-1" asChild>
                <a href={meetLink!} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir Meet agora
                </a>
              </Button>
            </div>
          </motion.div>
        )}

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Compartilhe esse link com seu paciente antes da consulta.
        </p>
      </div>
    </PageContainer>
  );
};

const DashboardTeleconsulta = () => (
  <PremiumOnlyGuard
    feature="A Teleconsulta"
    description="Configure seu link de Google Meet após assinar o plano Essencial para começar a atender pacientes online."
    reason="telehealth"
    redirectAfter="/dashboard/teleconsulta"
  >
    <DashboardTeleconsultaInner />
  </PremiumOnlyGuard>
);

export default DashboardTeleconsulta;
