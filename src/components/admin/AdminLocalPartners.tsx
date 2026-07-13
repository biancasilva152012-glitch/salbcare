import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Star, Trash2, Upload } from "lucide-react";

interface LocalPartner {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  location: string | null;
  description: string | null;
  image_url: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  featured: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
}

const CATEGORIES: { value: string; label: string; group: string }[] = [
  { value: "dental", label: "Dental Clinic", group: "Healthcare" },
  { value: "doctor", label: "Doctor", group: "Healthcare" },
  { value: "physio", label: "Physiotherapist", group: "Healthcare" },
  { value: "rehab", label: "Rehabilitation", group: "Healthcare" },
  { value: "hotel", label: "Hotel", group: "Local Experience" },
  { value: "pousada", label: "Pousada", group: "Local Experience" },
  { value: "restaurant", label: "Restaurant", group: "Local Experience" },
  { value: "transfer", label: "Transfer", group: "Local Experience" },
  { value: "kite_school", label: "Kite School", group: "Local Experience" },
  { value: "local_service", label: "Local Service", group: "Local Experience" },
];

const emptyForm: Partial<LocalPartner> = {
  name: "",
  category: "dental",
  subcategory: "",
  location: "",
  description: "",
  image_url: "",
  whatsapp: "",
  instagram: "",
  website: "",
  featured: false,
  active: true,
  sort_order: 0,
};

const AdminLocalPartners = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LocalPartner | null>(null);

  const { data: partners = [], isLoading } = useQuery<LocalPartner[]>({
    queryKey: ["admin-local-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("local_partners" as any)
        .select("*")
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as LocalPartner[]) || [];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: Partial<LocalPartner>) => {
      const row = {
        name: payload.name?.trim(),
        category: payload.category,
        subcategory: payload.subcategory || null,
        location: payload.location || null,
        description: payload.description || null,
        image_url: payload.image_url || null,
        whatsapp: payload.whatsapp || null,
        instagram: payload.instagram || null,
        website: payload.website || null,
        featured: payload.featured ?? false,
        active: payload.active ?? true,
        sort_order: payload.sort_order ?? 0,
      };
      if (editing) {
        const { error } = await supabase.from("local_partners" as any).update(row).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("local_partners" as any).insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Partner atualizado" : "Partner cadastrado");
      qc.invalidateQueries({ queryKey: ["admin-local-partners"] });
      qc.invalidateQueries({ queryKey: ["local-partners-public"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ p, field }: { p: LocalPartner; field: "active" | "featured" }) => {
      const { error } = await supabase
        .from("local_partners" as any)
        .update({ [field]: !p[field] })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-local-partners"] });
      qc.invalidateQueries({ queryKey: ["local-partners-public"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("local_partners" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Partner removido");
      qc.invalidateQueries({ queryKey: ["admin-local-partners"] });
      qc.invalidateQueries({ queryKey: ["local-partners-public"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">SalbCare Local Partner Network</h1>
          <p className="text-sm text-white/40 mt-1">
            Rede curada de parceiros exibidos publicamente na home do Kite Hub
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
              <Plus className="h-4 w-4 mr-1" /> Novo parceiro
            </Button>
          </DialogTrigger>
          <PartnerFormDialog
            key={editing?.id || "new"}
            editing={editing}
            onSubmit={(data) => upsert.mutate(data)}
            loading={upsert.isPending}
          />
        </Dialog>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[hsl(220,20%,10%)]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className="text-white/50">Parceiro</TableHead>
              <TableHead className="text-white/50">Categoria</TableHead>
              <TableHead className="text-white/50">Localização</TableHead>
              <TableHead className="text-white/50 text-center">Destaque</TableHead>
              <TableHead className="text-white/50 text-center">Ativo</TableHead>
              <TableHead className="text-white/50 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-white/30" />
                </TableCell>
              </TableRow>
            ) : partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-white/30 text-sm">
                  Nenhum parceiro cadastrado ainda
                </TableCell>
              </TableRow>
            ) : (
              partners.map((p) => (
                <TableRow key={p.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center text-white/40 text-sm">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-white font-medium">{p.name}</div>
                        {p.description && (
                          <div className="text-[11px] text-white/40 line-clamp-1 max-w-xs">
                            {p.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-white/60">
                    {CATEGORIES.find((c) => c.value === p.category)?.label || p.category}
                  </TableCell>
                  <TableCell className="text-xs text-white/60">{p.location || "—"}</TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => toggle.mutate({ p, field: "featured" })}
                      className="inline-flex"
                      title="Alternar destaque"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          p.featured ? "fill-amber-400 text-amber-400" : "text-white/20"
                        }`}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={p.active}
                      onCheckedChange={() => toggle.mutate({ p, field: "active" })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white/50 hover:text-white h-7 px-2 text-xs"
                        onClick={() => {
                          setEditing(p);
                          setOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400/70 hover:text-red-400 h-7 px-2 text-xs"
                        onClick={() => {
                          if (confirm(`Remover "${p.name}" da rede?`)) remove.mutate(p.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const PartnerFormDialog = ({
  editing,
  onSubmit,
  loading,
}: {
  editing: LocalPartner | null;
  onSubmit: (data: Partial<LocalPartner>) => void;
  loading: boolean;
}) => {
  const [form, setForm] = useState<Partial<LocalPartner>>(editing || emptyForm);
  const [uploading, setUploading] = useState(false);

  const valid = form.name && form.category;

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user?.id) throw new Error("Sessão expirada");
      const uid = userData.user.id;
      const ext = file.name.split(".").pop();
      const path = `${uid}/local-partners/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("professional-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("professional-assets").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Imagem enviada");
    } catch (e: any) {
      toast.error(e.message || "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DialogContent className="bg-[hsl(220,20%,10%)] border-white/10 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editing ? "Editar parceiro" : "Novo parceiro"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome *">
            <Input
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Clínica Sorriso"
            />
          </Field>
          <Field label="Categoria *">
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v })}
            >
              <SelectTrigger className="bg-white/[0.03] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(220,20%,12%)] text-white border-white/10">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.group} · {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Subcategoria">
            <Input
              value={form.subcategory || ""}
              onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
              placeholder="Opcional"
            />
          </Field>
          <Field label="Localização">
            <Input
              value={form.location || ""}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Ilha do Guajiru, CE"
            />
          </Field>
        </div>

        <Field label="Descrição">
          <Textarea
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Breve descrição exibida no card público"
            className="bg-white/[0.03] border-white/10 text-white"
          />
        </Field>

        <Field label="Imagem / Logo">
          <div className="flex items-center gap-3">
            {form.image_url && (
              <img
                src={form.image_url}
                alt=""
                className="w-16 h-16 rounded-lg object-cover border border-white/10"
              />
            )}
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
              <div className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-white/20 text-xs text-white/60 hover:bg-white/[0.03]">
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {uploading ? "Enviando..." : "Selecionar arquivo"}
              </div>
            </label>
          </div>
          <Input
            value={form.image_url || ""}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="ou cole uma URL"
            className="mt-2"
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="WhatsApp">
            <Input
              value={form.whatsapp || ""}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="5588999999999"
            />
          </Field>
          <Field label="Instagram">
            <Input
              value={form.instagram || ""}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="@handle"
            />
          </Field>
          <Field label="Website">
            <Input
              value={form.website || ""}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://"
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3 items-end">
          <Field label="Ordem de exibição">
            <Input
              type="number"
              value={form.sort_order ?? 0}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </Field>
          <div className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
            <Label className="text-xs text-white/70">Destaque</Label>
            <Switch
              checked={!!form.featured}
              onCheckedChange={(c) => setForm({ ...form, featured: c })}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
            <Label className="text-xs text-white/70">Ativo</Label>
            <Switch
              checked={!!form.active}
              onCheckedChange={(c) => setForm({ ...form, active: c })}
            />
          </div>
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

export default AdminLocalPartners;
