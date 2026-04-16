import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Copy, ExternalLink, Users, TrendingUp, DollarSign } from "lucide-react";

interface PartnerStats {
  id: string;
  name: string;
  contact_name: string;
  contact_email: string;
  slug: string;
  discount_percent: number;
  commission_percent: number;
  status: string;
  created_at: string;
  total_referrals: number;
  active_subscribers: number;
}

interface PartnerReferral {
  user_id: string;
  name: string;
  email: string;
  professional_type: string;
  payment_status: string;
  plan: string;
  created_at: string;
}

const PLAN_PRICE = 89; // Essencial plan in BRL

const slugify = (s: string) =>
  s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const AdminPartners = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerStats | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const { data: partners = [], isLoading } = useQuery<PartnerStats[]>({
    queryKey: ["admin-partners"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_partners_with_stats" as any);
      if (error) throw error;
      return (data as PartnerStats[]) || [];
    },
  });

  const { data: referrals = [] } = useQuery<PartnerReferral[]>({
    queryKey: ["admin-partner-referrals", selectedSlug],
    queryFn: async () => {
      if (!selectedSlug) return [];
      const { data, error } = await supabase.rpc("get_partner_referrals" as any, { _slug: selectedSlug });
      if (error) throw error;
      return (data as PartnerReferral[]) || [];
    },
    enabled: !!selectedSlug,
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: Partial<PartnerStats>) => {
      const row = {
        name: payload.name,
        contact_name: payload.contact_name,
        contact_email: payload.contact_email,
        slug: slugify(payload.slug || ""),
        discount_percent: payload.discount_percent ?? 0,
        commission_percent: payload.commission_percent ?? 0,
        status: payload.status ?? "active",
      };
      if (editing) {
        const { error } = await supabase.from("partners" as any).update(row).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("partners" as any).insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Parceiro atualizado" : "Parceiro cadastrado");
      qc.invalidateQueries({ queryKey: ["admin-partners"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message?.includes("duplicate") ? "Slug já em uso" : e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async (p: PartnerStats) => {
      const newStatus = p.status === "active" ? "inactive" : "active";
      const { error } = await supabase.from("partners" as any).update({ status: newStatus }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-partners"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const totalRefs = partners.reduce((s, p) => s + Number(p.total_referrals), 0);
  const totalActive = partners.reduce((s, p) => s + Number(p.active_subscribers), 0);
  const totalCommission = partners.reduce(
    (s, p) => s + Number(p.active_subscribers) * PLAN_PRICE * (Number(p.commission_percent) / 100),
    0,
  );

  const buildLink = (slug: string) => `https://salbcare.com.br/cadastro?ref=${slug}`;

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(buildLink(slug));
    toast.success("Link copiado");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Parcerias</h1>
          <p className="text-sm text-white/40 mt-1">Gerencie programas de indicação e comissão</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
              <Plus className="h-4 w-4 mr-1" /> Novo parceiro
            </Button>
          </DialogTrigger>
          <PartnerDialog
            editing={editing}
            onSubmit={(data) => upsertMutation.mutate(data)}
            loading={upsertMutation.isPending}
          />
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total de indicações" value={String(totalRefs)} />
        <StatCard icon={TrendingUp} label="Assinantes ativos" value={String(totalActive)} />
        <StatCard
          icon={DollarSign}
          label="Comissão acumulada (estimada)"
          value={totalCommission.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        />
      </div>

      {/* Partners table */}
      <div className="rounded-xl border border-white/[0.06] bg-[hsl(220,20%,10%)]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className="text-white/50">Nome</TableHead>
              <TableHead className="text-white/50">Slug / Link</TableHead>
              <TableHead className="text-white/50 text-center">Indicações</TableHead>
              <TableHead className="text-white/50 text-center">Ativos</TableHead>
              <TableHead className="text-white/50 text-center">Desc. / Com.</TableHead>
              <TableHead className="text-white/50 text-center">Status</TableHead>
              <TableHead className="text-white/50 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-white/30" />
              </TableCell></TableRow>
            ) : partners.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-white/30 text-sm">
                Nenhum parceiro cadastrado ainda
              </TableCell></TableRow>
            ) : partners.map((p) => (
              <TableRow key={p.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                <TableCell>
                  <div className="text-sm text-white font-medium">{p.name}</div>
                  <div className="text-[11px] text-white/40">{p.contact_name} • {p.contact_email}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">{p.slug}</code>
                    <button onClick={() => copyLink(p.slug)} className="text-white/30 hover:text-white/70" title="Copiar link">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <a href={buildLink(p.slug)} target="_blank" rel="noopener" className="text-white/30 hover:text-white/70" title="Abrir">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </TableCell>
                <TableCell className="text-center text-sm text-white/70">{p.total_referrals}</TableCell>
                <TableCell className="text-center text-sm text-emerald-400 font-medium">{p.active_subscribers}</TableCell>
                <TableCell className="text-center text-xs text-white/60">
                  {p.discount_percent}% / {p.commission_percent}%
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={p.status === "active"}
                    onCheckedChange={() => toggleStatus.mutate(p)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm" variant="ghost"
                      className="text-white/50 hover:text-white h-7 px-2 text-xs"
                      onClick={() => setSelectedSlug(p.slug)}
                    >
                      Ver indicados
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="text-white/50 hover:text-white h-7 px-2 text-xs"
                      onClick={() => { setEditing(p); setOpen(true); }}
                    >
                      Editar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Referrals dialog */}
      <Dialog open={!!selectedSlug} onOpenChange={(o) => !o && setSelectedSlug(null)}>
        <DialogContent className="max-w-3xl bg-[hsl(220,20%,10%)] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Indicados de "{selectedSlug}"</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06]">
                  <TableHead className="text-white/50">Nome</TableHead>
                  <TableHead className="text-white/50">Email</TableHead>
                  <TableHead className="text-white/50">Tipo</TableHead>
                  <TableHead className="text-white/50">Plano</TableHead>
                  <TableHead className="text-white/50">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-white/30 text-sm">
                    Nenhum indicado ainda
                  </TableCell></TableRow>
                ) : referrals.map((r) => (
                  <TableRow key={r.user_id} className="border-white/[0.04]">
                    <TableCell className="text-sm text-white">{r.name}</TableCell>
                    <TableCell className="text-xs text-white/60">{r.email}</TableCell>
                    <TableCell className="text-xs text-white/60">{r.professional_type}</TableCell>
                    <TableCell className="text-xs text-white/60">{r.plan}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        ["active", "trialing", "paid"].includes(r.payment_status)
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/[0.06] text-white/40"
                      }`}>
                        {r.payment_status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="rounded-xl border border-white/[0.06] bg-[hsl(220,20%,10%)] p-5">
    <div className="flex items-center gap-2 text-white/40 text-xs">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
    <div className="mt-2 text-2xl font-bold text-white">{value}</div>
  </div>
);

const PartnerDialog = ({
  editing, onSubmit, loading,
}: {
  editing: PartnerStats | null;
  onSubmit: (data: Partial<PartnerStats>) => void;
  loading: boolean;
}) => {
  const [form, setForm] = useState({
    name: editing?.name || "",
    contact_name: editing?.contact_name || "",
    contact_email: editing?.contact_email || "",
    slug: editing?.slug || "",
    discount_percent: editing?.discount_percent ?? 0,
    commission_percent: editing?.commission_percent ?? 0,
    status: editing?.status || "active",
  });

  const valid = form.name && form.contact_name && form.contact_email && form.slug;

  return (
    <DialogContent className="bg-[hsl(220,20%,10%)] border-white/10 text-white">
      <DialogHeader>
        <DialogTitle>{editing ? "Editar parceiro" : "Novo parceiro"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <Field label="Nome da empresa">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} placeholder="Nymu" />
        </Field>
        <Field label="Nome do contato">
          <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
        </Field>
        <Field label="Email do contato">
          <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
        </Field>
        <Field label="Slug (link de indicação)">
          <Input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
            placeholder="nymu"
          />
          <p className="text-[11px] text-white/40 mt-1">
            Link: salbcare.com.br/cadastro?ref={form.slug || "..."}
          </p>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Desconto p/ indicado (%)">
            <Input
              type="number" min="0" max="100"
              value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })}
            />
          </Field>
          <Field label="Comissão p/ parceiro (%)">
            <Input
              type="number" min="0" max="100"
              value={form.commission_percent}
              onChange={(e) => setForm({ ...form, commission_percent: Number(e.target.value) })}
            />
          </Field>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Label className="text-sm text-white/70">Parceria ativa</Label>
          <Switch
            checked={form.status === "active"}
            onCheckedChange={(c) => setForm({ ...form, status: c ? "active" : "inactive" })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={!valid || loading}
          onClick={() => onSubmit(form)}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {editing ? "Salvar" : "Cadastrar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-xs text-white/60">{label}</Label>
    {children}
  </div>
);

export default AdminPartners;
