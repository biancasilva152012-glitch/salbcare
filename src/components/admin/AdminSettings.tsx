import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, RefreshCw, Shield, CreditCard, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLANS } from "@/config/plans";
import { useAuth } from "@/contexts/AuthContext";

/* ── Plan Settings Tab ── */
const PlanSettingsTab = () => {
  const plan = PLANS.basic;
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/30 bg-card/50 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{plan.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Plano único da plataforma</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">R$ {plan.price}<span className="text-xs text-muted-foreground font-normal">/mês</span></span>
            <p className="text-xs text-muted-foreground">ou R$ {plan.annualPrice}/mês no anual</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between py-2 border-t border-border/30">
            <span className="text-xs text-muted-foreground">Price ID Mensal</span>
            <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{plan.price_id}</code>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border/30">
            <span className="text-xs text-muted-foreground">Price ID Anual</span>
            <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{plan.annual_price_id}</code>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border/30">
            <span className="text-xs text-muted-foreground">Trial</span>
            <span className="text-xs text-primary">{plan.hasTrial ? "7 dias grátis" : "Sem trial"}</span>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-[10px] text-muted-foreground">Features incluídas:</p>
          <ul className="mt-1.5 space-y-1">
            {plan.features.map((f) => (
              <li key={f} className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/* ── Platform Settings Tab ── */
const PlatformSettingsTab = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings" as any)
        .select("key, value");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data as any[])?.forEach((s: any) => { map[s.key] = s.value; });
      return map;
    },
    staleTime: 30_000,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-platform-stats"],
    queryFn: async () => {
      const [profiles, patients, appointments] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
      ]);
      return {
        totalProfiles: profiles.count || 0,
        totalPatients: patients.count || 0,
        totalAppointments: appointments.count || 0,
      };
    },
    staleTime: 60_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("platform_settings" as any)
        .update({ value, updated_at: new Date().toISOString(), updated_by: user?.id } as any)
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success(`Configuração "${vars.key}" atualizada`);
    },
    onError: () => toast.error("Erro ao salvar configuração"),
  });

  const toggleSetting = (key: string) => {
    const current = settings?.[key] === "true";
    toggleMutation.mutate({ key, value: String(!current) });
  };

  const settingsList = [
    { key: "maintenance_mode", label: "Modo manutenção", desc: "Desativa o acesso público temporariamente" },
    { key: "auto_confirm_email", label: "Auto-confirmação de e-mail", desc: "Novos cadastros entram sem confirmar e-mail" },
    { key: "public_directory", label: "Diretório público", desc: "Profissionais visíveis em /profissionais" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Profissionais", value: stats?.totalProfiles ?? "—" },
          { label: "Pacientes", value: stats?.totalPatients ?? "—" },
          { label: "Consultas", value: stats?.totalAppointments ?? "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/30 bg-card/50 p-4 text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/30 bg-card/50 p-6 space-y-4">
        <h3 className="text-sm font-semibold">Configurações Gerais</h3>
        <div className="space-y-3">
          {settingsList.map((s, i) => (
            <div key={s.key} className={`flex items-center justify-between py-2 ${i > 0 ? "border-t border-border/30" : ""}`}>
              <div>
                <p className="text-xs font-medium">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
              <Switch
                checked={settings?.[s.key] === "true"}
                onCheckedChange={() => toggleSetting(s.key)}
                disabled={settingsLoading || toggleMutation.isPending}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Security Tab ── */
const SecurityTab = () => {
  const { data: roles } = useQuery({
    queryKey: ["admin-roles-count"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role");
      const counts: Record<string, number> = {};
      data?.forEach((r: any) => {
        counts[r.role] = (counts[r.role] || 0) + 1;
      });
      return counts;
    },
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/30 bg-card/50 p-6 space-y-4">
        <h3 className="text-sm font-semibold">Roles do Sistema</h3>
        <div className="space-y-2">
          {["admin", "contador", "user"].map((role) => (
            <div key={role} className="flex items-center justify-between py-2 border-t border-border/30 first:border-0">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs capitalize">{role}</span>
              </div>
              <span className="text-xs text-muted-foreground">{roles?.[role] || 0} usuários</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/30 bg-card/50 p-6 space-y-4">
        <h3 className="text-sm font-semibold">Políticas de Segurança</h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>• RLS ativa em todas as tabelas</p>
          <p>• JWT validado em edge functions</p>
          <p>• Roles verificadas via has_role() server-side</p>
          <p>• Suspensão automática após 3 cancelamentos/mês</p>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const AdminSettings = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-xl font-bold">Configurações do Sistema</h1>
      <p className="text-sm text-muted-foreground mt-1">Gerencie planos, preços e configurações gerais</p>
    </div>

    <Tabs defaultValue="plans" className="space-y-4">
      <TabsList className="bg-muted/50 border border-border/30">
        <TabsTrigger value="plans" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-xs">
          <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Planos
        </TabsTrigger>
        <TabsTrigger value="platform" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-xs">
          <Globe className="h-3.5 w-3.5 mr-1.5" /> Plataforma
        </TabsTrigger>
        <TabsTrigger value="security" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-xs">
          <Shield className="h-3.5 w-3.5 mr-1.5" /> Segurança
        </TabsTrigger>
      </TabsList>

      <TabsContent value="plans"><PlanSettingsTab /></TabsContent>
      <TabsContent value="platform"><PlatformSettingsTab /></TabsContent>
      <TabsContent value="security"><SecurityTab /></TabsContent>
    </Tabs>
  </div>
);

export default AdminSettings;
