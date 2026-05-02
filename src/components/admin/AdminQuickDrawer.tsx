import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Users, Inbox, UserPlus, BarChart3, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const SPECIALTIES = [
  { value: "psicologo", label: "Psicologia" },
  { value: "medico", label: "Medicina" },
  { value: "nutricionista", label: "Nutrição" },
  { value: "fisioterapeuta", label: "Fisioterapia" },
  { value: "dentista", label: "Odontologia" },
  { value: "outro", label: "Outro" },
];

function formatPhoneBR(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function AdminQuickDrawer() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("metrics");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="fixed top-4 right-4 z-50 h-10 w-10 rounded-full shadow-md bg-background"
          aria-label="Painel admin"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Painel Admin</SheetTitle>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 grid grid-cols-4">
            <TabsTrigger value="metrics"><BarChart3 className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Métricas</span></TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Usuários</span></TabsTrigger>
            <TabsTrigger value="leads"><Inbox className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Leads</span></TabsTrigger>
            <TabsTrigger value="new"><UserPlus className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Novo</span></TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <TabsContent value="metrics" className="mt-0"><MetricsTab /></TabsContent>
              <TabsContent value="users" className="mt-0"><UsersTab /></TabsContent>
              <TabsContent value="leads" className="mt-0">
                <LeadsTab onConvert={(lead) => { setTab("new"); window.dispatchEvent(new CustomEvent("admin:prefill-lead", { detail: lead })); }} />
              </TabsContent>
              <TabsContent value="new" className="mt-0"><NewClientTab onCreated={() => setTab("users")} /></TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

/* ---------------- METRICS ---------------- */
function MetricsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-quick-metrics"],
    queryFn: async () => {
      const [users, active, trial, leads] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true })
          .in("payment_status", ["active", "trialing", "paid"]),
        supabase.from("profiles").select("id", { count: "exact", head: true })
          .eq("payment_status", "trialing"),
        supabase.from("leads_demo").select("id", { count: "exact", head: true }),
      ]);
      return {
        users: users.count ?? 0,
        active: active.count ?? 0,
        trial: trial.count ?? 0,
        leads: leads.count ?? 0,
      };
    },
    staleTime: 60_000,
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const cards = [
    { label: "Usuários cadastrados", value: data?.users ?? 0 },
    { label: "Assinantes pagantes", value: data?.active ?? 0 },
    { label: "Em trial", value: data?.trial ?? 0 },
    { label: "Leads (demo)", value: data?.leads ?? 0 },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">{c.label}</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{c.value}</p></CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- USERS ---------------- */
function UsersTab() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-quick-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, name, email, professional_type, plan, payment_status, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const filtered = (data ?? []).filter((u) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou email" className="pl-9" />
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <Card key={u.user_id}>
              <CardContent className="p-3">
                <div className="flex justify-between gap-2 items-start">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{u.name || "(sem nome)"}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <p className="text-xs text-muted-foreground">{u.professional_type} · {u.plan} · {new Date(u.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Badge variant={["active", "trialing", "paid"].includes(u.payment_status) ? "default" : "secondary"}>{u.payment_status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">Nenhum usuário encontrado.</p>}
        </div>
      )}
    </div>
  );
}

/* ---------------- LEADS ---------------- */
function LeadsTab({ onConvert }: { onConvert: (lead: any) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-quick-leads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads_demo")
        .select("id, nome, email, whatsapp, dor_principal, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
    staleTime: 30_000,
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-2">
      {(data ?? []).map((l) => (
        <Card key={l.id}>
          <CardContent className="p-3 space-y-2">
            <div className="flex justify-between gap-2 items-start">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{l.nome}</p>
                <p className="text-xs text-muted-foreground truncate">{l.email} · {l.whatsapp}</p>
                <p className="text-xs mt-1 line-clamp-2">{l.dor_principal}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(l.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <Badge variant={l.status === "convertido" ? "default" : "secondary"}>{l.status}</Badge>
            </div>
            {l.status !== "convertido" && (
              <Button size="sm" variant="outline" className="w-full" onClick={() => onConvert(l)}>
                Converter em usuário
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
      {(data ?? []).length === 0 && <p className="text-center text-sm text-muted-foreground py-6">Nenhum lead recebido.</p>}
    </div>
  );
}

/* ---------------- NEW CLIENT ---------------- */
function NewClientTab({ onCreated }: { onCreated: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", professional_type: "",
    council_number: "", office_name: "", city: "", state: "",
    plan: "essencial_mensal" as "essencial_mensal" | "essencial_anual",
    notes: "", lead_id: "",
  });

  // Listen for prefill from leads tab
  useEffect(() => {
    const handler = (e: Event) => {
      const lead = (e as CustomEvent).detail;
      setForm((f) => ({
        ...f,
        name: lead.nome ?? "",
        email: lead.email ?? "",
        phone: lead.whatsapp ?? "",
        notes: lead.dor_principal ?? "",
        lead_id: lead.id ?? "",
      }));
    };
    window.addEventListener("admin:prefill-lead", handler);
    return () => window.removeEventListener("admin:prefill-lead", handler);
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: form,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`✅ ${form.name} cadastrado(a) com sucesso! Email de boas-vindas enviado.`);
      qc.invalidateQueries({ queryKey: ["admin-quick-users"] });
      qc.invalidateQueries({ queryKey: ["admin-quick-metrics"] });
      qc.invalidateQueries({ queryKey: ["admin-quick-leads"] });
      setForm({
        name: "", email: "", phone: "", professional_type: "",
        council_number: "", office_name: "", city: "", state: "",
        plan: "essencial_mensal", notes: "", lead_id: "",
      });
      onCreated();
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao criar usuário"),
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canSubmit = form.name && form.email && form.phone && form.professional_type && form.plan;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (canSubmit) mutation.mutate(); }}
      className="space-y-3"
    >
      <div>
        <Label>Nome completo *</Label>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={100} />
      </div>
      <div>
        <Label>Email profissional *</Label>
        <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required maxLength={255} />
      </div>
      <div>
        <Label>WhatsApp *</Label>
        <Input value={form.phone} onChange={(e) => set("phone", formatPhoneBR(e.target.value))} placeholder="(11) 91234-5678" required />
      </div>
      <div>
        <Label>Especialidade *</Label>
        <Select value={form.professional_type} onValueChange={(v) => set("professional_type", v)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {SPECIALTIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>CRM/CRP/CRN/CREFITO/CRO</Label>
        <Input value={form.council_number} onChange={(e) => set("council_number", e.target.value)} maxLength={50} />
      </div>
      <div>
        <Label>Nome do consultório</Label>
        <Input value={form.office_name} onChange={(e) => set("office_name", e.target.value)} maxLength={150} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Cidade</Label>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} maxLength={100} />
        </div>
        <div>
          <Label>Estado</Label>
          <Input value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" maxLength={2} />
        </div>
      </div>
      <div>
        <Label>Plano *</Label>
        <Select value={form.plan} onValueChange={(v) => set("plan", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="essencial_mensal">Essencial Mensal</SelectItem>
            <SelectItem value="essencial_anual">Essencial Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Observações da call</Label>
        <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} maxLength={2000} />
      </div>
      {form.lead_id && <p className="text-xs text-muted-foreground">Vinculado ao lead {form.lead_id.slice(0, 8)}…</p>}
      <Button type="submit" className="w-full" disabled={!canSubmit || mutation.isPending}>
        {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        Criar conta e ativar
      </Button>
    </form>
  );
}
