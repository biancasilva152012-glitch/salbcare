import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, RefreshCw, Shield, CreditCard, Globe, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLANS } from "@/config/plans";

/* ── Plan Settings Tab ── */
const PlanSettingsTab = () => {
  const plan = PLANS.basic;
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">{plan.name}</h3>
            <p className="text-xs text-white/40 mt-0.5">Plano único da plataforma</p>
          </div>
          <span className="text-2xl font-bold text-blue-400">R$ {plan.price}<span className="text-xs text-white/40 font-normal">/mês</span></span>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between py-2 border-t border-white/5">
            <span className="text-xs text-white/60">Price ID (Stripe)</span>
            <code className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">{plan.price_id}</code>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-white/5">
            <span className="text-xs text-white/60">Product ID (Stripe)</span>
            <code className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">{plan.product_id}</code>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-white/5">
            <span className="text-xs text-white/60">Trial</span>
            <span className="text-xs text-emerald-400">{plan.hasTrial ? "7 dias grátis" : "Sem trial"}</span>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-[10px] text-white/30">Features incluídas:</p>
          <ul className="mt-1.5 space-y-1">
            {plan.features.map((f) => (
              <li key={f} className="text-xs text-white/50 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-blue-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-[10px] text-white/20">
        Para alterar preços ou criar novos planos, atualize o arquivo <code className="text-white/30">src/config/plans.ts</code> e o produto correspondente no Stripe.
      </p>
    </div>
  );
};

/* ── Platform Settings Tab ── */
const PlatformSettingsTab = () => {
  const qc = useQueryClient();

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

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Profissionais", value: stats?.totalProfiles ?? "—" },
          { label: "Pacientes", value: stats?.totalPatients ?? "—" },
          { label: "Consultas", value: stats?.totalAppointments ?? "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Platform config */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Configurações Gerais</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs text-white/70">Modo manutenção</p>
              <p className="text-[10px] text-white/30">Desativa o acesso público temporariamente</p>
            </div>
            <Switch disabled />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-white/5">
            <div>
              <p className="text-xs text-white/70">Auto-confirmação de e-mail</p>
              <p className="text-[10px] text-white/30">Novos cadastros entram sem confirmar e-mail</p>
            </div>
            <Switch disabled />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-white/5">
            <div>
              <p className="text-xs text-white/70">Diretório público</p>
              <p className="text-[10px] text-white/30">Profissionais visíveis em /profissionais</p>
            </div>
            <Switch defaultChecked disabled />
          </div>
        </div>
      </div>

      <p className="text-[10px] text-white/20">
        Configurações avançadas serão habilitadas em versões futuras.
      </p>
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
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Roles do Sistema</h3>
        <div className="space-y-2">
          {["admin", "contador", "user"].map((role) => (
            <div key={role} className="flex items-center justify-between py-2 border-t border-white/5 first:border-0">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs text-white/70 capitalize">{role}</span>
              </div>
              <span className="text-xs text-white/40">{roles?.[role] || 0} usuários</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Políticas de Segurança</h3>
        <div className="space-y-2 text-xs text-white/50">
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
      <h1 className="text-xl font-bold text-white">Configurações do Sistema</h1>
      <p className="text-sm text-white/40 mt-1">Gerencie planos, preços e configurações gerais</p>
    </div>

    <Tabs defaultValue="plans" className="space-y-4">
      <TabsList className="bg-white/5 border border-white/5">
        <TabsTrigger value="plans" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 text-xs">
          <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Planos
        </TabsTrigger>
        <TabsTrigger value="platform" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 text-xs">
          <Globe className="h-3.5 w-3.5 mr-1.5" /> Plataforma
        </TabsTrigger>
        <TabsTrigger value="security" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 text-xs">
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
