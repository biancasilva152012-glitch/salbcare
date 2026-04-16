import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, Shield, ShieldCheck, ShieldOff, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type AppRole = "admin" | "contador" | "user";

interface ProfileRow {
  user_id: string;
  name: string;
  email: string;
  professional_type: string;
  created_at: string;
}

interface RoleRow {
  user_id: string;
  role: AppRole;
}

interface PendingChange {
  userId: string;
  userName: string;
  newRole: AppRole;
  currentRoles: AppRole[];
}

const ROLE_META: Record<AppRole, { label: string; color: string; icon: React.ElementType }> = {
  admin: { label: "Admin", color: "border-blue-500/20 text-blue-400 bg-blue-500/10", icon: ShieldCheck },
  contador: { label: "Contador", color: "border-violet-500/20 text-violet-400 bg-violet-500/10", icon: Shield },
  user: { label: "Usuário", color: "border-white/10 text-white/40", icon: UserCog },
};

const AdminRolesManager = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<PendingChange | null>(null);

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery<ProfileRow[]>({
    queryKey: ["admin-roles-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, email, professional_type, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: roles = [], isLoading: loadingRoles } = useQuery<RoleRow[]>({
    queryKey: ["admin-roles-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return (data || []) as RoleRow[];
    },
  });

  const rolesByUser = useMemo(() => {
    const map = new Map<string, AppRole[]>();
    roles.forEach((r) => {
      const arr = map.get(r.user_id) || [];
      arr.push(r.role);
      map.set(r.user_id, arr);
    });
    return map;
  }, [roles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
    );
  }, [profiles, search]);

  const setRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole, currentRoles }: PendingChange) => {
      // Remove all existing non-matching roles, then insert the new one
      if (currentRoles.length > 0) {
        const { error: delError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);
        if (delError) throw delError;
      }
      if (newRole !== "user") {
        const { error: insError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });
        if (insError) throw insError;
      }
    },
    onSuccess: () => {
      toast.success("Permissão atualizada com sucesso");
      qc.invalidateQueries({ queryKey: ["admin-roles-list"] });
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao atualizar permissão"),
  });

  const handleRoleChange = (
    userId: string,
    userName: string,
    newRole: AppRole,
    currentRoles: AppRole[]
  ) => {
    setPending({ userId, userName, newRole, currentRoles });
  };

  const confirmChange = () => {
    if (pending) setRoleMutation.mutate(pending);
    setPending(null);
  };

  if (loadingProfiles || loadingRoles) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const adminCount = roles.filter((r) => r.role === "admin").length;
  const contadorCount = roles.filter((r) => r.role === "contador").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Permissões e Roles</h1>
        <p className="text-sm text-white/40 mt-1">
          Gerencie quem tem acesso administrativo à plataforma
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-4">
          <div className="flex items-center gap-2 text-white/40 text-[11px] uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> Admins
          </div>
          <p className="text-2xl font-bold text-white mt-2">{adminCount}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-4">
          <div className="flex items-center gap-2 text-white/40 text-[11px] uppercase tracking-wider">
            <Shield className="h-3.5 w-3.5 text-violet-400" /> Contadores
          </div>
          <p className="text-2xl font-bold text-white mt-2">{contadorCount}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-4">
          <div className="flex items-center gap-2 text-white/40 text-[11px] uppercase tracking-wider">
            <UserCog className="h-3.5 w-3.5 text-white/40" /> Total
          </div>
          <p className="text-2xl font-bold text-white mt-2">{profiles.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="pl-10 bg-white/[0.03] border-white/10 text-white placeholder:text-white/30"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-medium uppercase tracking-wider text-white/40">
          <div className="col-span-5">Usuário</div>
          <div className="col-span-3">Permissão atual</div>
          <div className="col-span-4 text-right">Alterar role</div>
        </div>
        <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-sm">
              Nenhum usuário encontrado
            </div>
          ) : (
            filtered.map((p) => {
              const userRoles = rolesByUser.get(p.user_id) || [];
              const primaryRole: AppRole = userRoles.includes("admin")
                ? "admin"
                : userRoles.includes("contador")
                ? "contador"
                : "user";
              const meta = ROLE_META[primaryRole];
              const Icon = meta.icon;
              return (
                <div
                  key={p.user_id}
                  className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors"
                >
                  <div className="col-span-5 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    <p className="text-[11px] text-white/40 truncate">{p.email}</p>
                  </div>
                  <div className="col-span-3">
                    <Badge variant="outline" className={`text-[10px] ${meta.color}`}>
                      <Icon className="h-3 w-3 mr-1" />
                      {meta.label}
                    </Badge>
                  </div>
                  <div className="col-span-4 flex justify-end">
                    <Select
                      value={primaryRole}
                      onValueChange={(v: AppRole) =>
                        handleRoleChange(p.user_id, p.name, v, userRoles)
                      }
                    >
                      <SelectTrigger className="w-[160px] h-8 bg-white/[0.03] border-white/10 text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[hsl(220,20%,10%)] border-white/10 text-white">
                        <SelectItem value="user">Usuário (sem role)</SelectItem>
                        <SelectItem value="contador">Contador</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation */}
      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent className="bg-[hsl(220,20%,10%)] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-amber-400" />
              Confirmar alteração de permissão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Você está prestes a alterar a role de <strong className="text-white">{pending?.userName}</strong>{" "}
              para <strong className="text-white">{pending && ROLE_META[pending.newRole].label}</strong>.
              {pending?.newRole === "admin" && (
                <span className="block mt-2 text-amber-400 text-xs">
                  ⚠️ Este usuário terá acesso total ao painel administrativo.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmChange}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRolesManager;
