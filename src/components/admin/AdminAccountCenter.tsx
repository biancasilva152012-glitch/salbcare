import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Mail, Search, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useActivateUser, useAdminUsers } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type AppRole = "admin" | "user";

type PendingRole = {
  userId: string;
  name: string;
  nextRole: AppRole;
  isAdmin: boolean;
};

const SPECIALTIES = [
  ["medico", "Medicina"],
  ["dentista", "Odontologia"],
  ["psicologo", "Psicologia"],
  ["nutricionista", "Nutrição"],
  ["fisioterapeuta", "Fisioterapia"],
  ["outro", "Outro"],
] as const;

const initialForm = {
  name: "",
  email: "",
  phone: "",
  professional_type: "",
  plan: "essencial_mensal" as "essencial_mensal" | "essencial_anual",
};

const AdminAccountCenter = () => {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useAdminUsers();
  const activateUser = useActivateUser();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [pendingRole, setPendingRole] = useState<PendingRole | null>(null);

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-operation-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data || [];
    },
  });

  const adminIds = useMemo(
    () => new Set(roles.filter((role) => role.role === "admin").map((role) => role.user_id)),
    [roles],
  );

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    return users
      .filter((item) => !value || item.name?.toLowerCase().includes(value) || item.email?.toLowerCase().includes(value))
      .slice(0, 40);
  }, [search, users]);

  const pendingEmails = users.filter((item) => !item.email_confirmed_at).length;

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { ...form, council_number: "", office_name: "", city: "", state: "", notes: "" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success("Conta criada e convite enviado por e-mail.");
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível criar a conta."),
  });

  const roleMutation = useMutation({
    mutationFn: async (change: PendingRole) => {
      if (change.isAdmin) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", change.userId).eq("role", "admin");
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("user_roles").insert({ user_id: change.userId, role: "admin" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Acesso administrativo atualizado.");
      queryClient.invalidateQueries({ queryKey: ["admin-operation-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-roles-list"] });
      setPendingRole(null);
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível atualizar o acesso."),
  });

  const canCreate = form.name.trim() && form.email.trim() && form.phone.trim() && form.professional_type;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="admin-card p-4">
          <p className="admin-eyebrow">Contas</p>
          <p className="admin-num mt-2 text-2xl font-semibold">{users.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Perfis disponíveis para administração.</p>
        </div>
        <div className="admin-card p-4">
          <p className="admin-eyebrow">E-mail pendente</p>
          <p className="admin-num mt-2 text-2xl font-semibold">{pendingEmails}</p>
          <p className="mt-1 text-xs text-muted-foreground">Pessoas que ainda não confirmaram o endereço.</p>
        </div>
        <div className="admin-card p-4">
          <p className="admin-eyebrow">Administradores</p>
          <p className="admin-num mt-2 text-2xl font-semibold">{adminIds.size}</p>
          <p className="mt-1 text-xs text-muted-foreground">Contas com acesso total ao painel.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section className="admin-card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent"><UserPlus className="h-5 w-5 text-secondary" /></span>
            <div><p className="admin-eyebrow">Nova conta</p><h2 className="text-lg">Cadastrar profissional</h2></div>
          </div>
          <form className="mt-5 space-y-3" onSubmit={(event) => { event.preventDefault(); if (canCreate) createMutation.mutate(); }}>
            <div><Label>Nome completo</Label><Input className="mt-1 h-12" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
            <div><Label>E-mail profissional</Label><Input className="mt-1 h-12" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div>
            <div><Label>WhatsApp</Label><Input className="mt-1 h-12" inputMode="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required /></div>
            <div><Label>Profissão</Label><Select value={form.professional_type} onValueChange={(value) => setForm({ ...form, professional_type: value })}><SelectTrigger className="mt-1 h-12"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{SPECIALTIES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Plano</Label><Select value={form.plan} onValueChange={(value: "essencial_mensal" | "essencial_anual") => setForm({ ...form, plan: value })}><SelectTrigger className="mt-1 h-12"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="essencial_mensal">Essencial mensal</SelectItem><SelectItem value="essencial_anual">Essencial anual</SelectItem></SelectContent></Select></div>
            <Button type="submit" className="min-h-12 w-full gap-2" disabled={!canCreate || createMutation.isPending}>{createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Criar conta e enviar convite</Button>
          </form>
        </section>

        <section className="admin-card overflow-hidden">
          <div className="border-b border-border p-4 sm:p-5">
            <p className="admin-eyebrow">Acessos</p>
            <h2 className="mt-1 text-lg">E-mails e administradores</h2>
            <div className="relative mt-4"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 pl-10" placeholder="Buscar nome ou e-mail" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          </div>
          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-secondary" /></div> : (
            <div className="divide-y divide-border">
              {filtered.map((account) => {
                const isAdmin = adminIds.has(account.user_id);
                const emailConfirmed = Boolean(account.email_confirmed_at);
                return (
                  <div key={account.user_id} className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="admin-num flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{account.name?.slice(0, 1).toUpperCase() || "?"}</span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{account.name || "Sem nome"}</p><p className="truncate text-xs text-muted-foreground">{account.email}</p></div>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${emailConfirmed ? "border-secondary/30 bg-accent text-accent-foreground" : "border-gold/30 bg-gold/10 text-foreground"}`}>{emailConfirmed ? <CheckCircle2 className="h-3 w-3" /> : <Mail className="h-3 w-3" />}{emailConfirmed ? "E-mail confirmado" : "E-mail pendente"}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {account.payment_status !== "active" && <Button variant="outline" className="min-h-11" onClick={() => activateUser.mutate(account.user_id)} disabled={activateUser.isPending}>Ativar conta</Button>}
                      <Button variant={isAdmin ? "outline" : "default"} className="min-h-11 gap-2" onClick={() => setPendingRole({ userId: account.user_id, name: account.name, nextRole: isAdmin ? "user" : "admin", isAdmin })}><ShieldCheck className="h-4 w-4" />{isAdmin ? "Remover admin" : "Liberar admin"}</Button>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma conta encontrada.</p>}
            </div>
          )}
        </section>
      </div>

      <AlertDialog open={Boolean(pendingRole)} onOpenChange={(open) => !open && setPendingRole(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{pendingRole?.isAdmin ? "Remover acesso administrativo?" : "Liberar acesso administrativo?"}</AlertDialogTitle><AlertDialogDescription>{pendingRole?.name} {pendingRole?.isAdmin ? "deixará de acessar as telas administrativas." : "poderá acessar dados e controles administrativos."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => pendingRole && roleMutation.mutate(pendingRole)}>Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAccountCenter;