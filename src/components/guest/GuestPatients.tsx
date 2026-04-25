import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PageContainer from "@/components/PageContainer";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";
import {
  addGuestPatient,
  deleteGuestPatient,
  readGuestPatients,
  GUEST_LIMITS,
  type GuestPatient,
} from "@/lib/guestStorage";

const emptyForm = { name: "", phone: "", email: "", notes: "" };

/**
 * Guest version of the Patients page — uses localStorage instead of Supabase.
 * Hard-capped at GUEST_LIMITS.patients (3) so visitors quickly hit a paywall.
 */
const GuestPatients = () => {
  const [list, setList] = useState<GuestPatient[]>(() => readGuestPatients());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const reload = () => setList(readGuestPatients());

  const handleAdd = () => {
    const result = addGuestPatient(form);
    if (result.ok === false) {
      if (result.reason === "limit") {
        toast.error(
          `Limite do modo guest atingido (${GUEST_LIMITS.patients} pacientes). Crie sua conta grátis para subir para 5.`,
        );
      } else {
        toast.error("Informe ao menos o nome do paciente.");
      }
      return;
    }
    toast.success("Paciente cadastrado no modo guest.");
    setForm(emptyForm);
    setOpen(false);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteGuestPatient(id);
    reload();
  };

  const remaining = GUEST_LIMITS.patients - list.length;
  const blocked = remaining <= 0;

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
        data-testid="guest-patients"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Pacientes</h1>
            <p className="text-xs text-muted-foreground">
              Modo guest · {list.length}/{GUEST_LIMITS.patients} cadastrados
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={blocked} className="gradient-primary">
                <Plus className="h-4 w-4 mr-1.5" />
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Novo paciente (guest)</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Nome *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Notas</Label>
                  <Textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <Button onClick={handleAdd} className="w-full gradient-primary">
                  Salvar paciente
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {blocked && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            Você atingiu o limite do modo guest.{" "}
            <Link to="/register?next=/dashboard/pacientes" className="font-semibold text-primary underline">
              Crie sua conta grátis
            </Link>{" "}
            para cadastrar mais pacientes.
          </div>
        )}

        {list.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sem pacientes ainda"
            description="Cadastre seu primeiro paciente para testar a plataforma."
            actionLabel="Adicionar paciente"
            onAction={() => setOpen(true)}
          />
        ) : (
          <div className="space-y-2">
            {list.map((p) => (
              <div
                key={p.id}
                className="glass-card p-3 flex items-center gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  {(p.phone || p.email) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {[p.phone, p.email].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(p.id)}
                  aria-label={`Remover ${p.name}`}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </PageContainer>
  );
};

export default GuestPatients;
