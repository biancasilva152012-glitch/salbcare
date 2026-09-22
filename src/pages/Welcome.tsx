import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BookingLinkBlock from "@/components/BookingLinkBlock";
import { PROFESSION_CONFIG, ProfessionalType } from "@/config/professions";

const TYPES = Object.keys(PROFESSION_CONFIG) as ProfessionalType[];

/**
 * Primeiros passos logo após o primeiro acesso: completar o perfil e
 * pegar o link de agendamento. Não altera regras de assinatura nem RLS.
 */
const Welcome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    professional_type: "medico" as ProfessionalType,
    council_number: "",
    council_state: "",
    phone: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, professional_type, council_number, council_state, phone, profile_slug")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setSlug(data.profile_slug ?? null);
        setForm({
          name: data.name ?? "",
          professional_type: (data.professional_type as ProfessionalType) ?? "medico",
          council_number: data.council_number ?? "",
          council_state: data.council_state ?? "",
          phone: data.phone ?? "",
        });
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      toast.error("Informe o nome que os pacientes vão ver.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: form.name.trim(),
        professional_type: form.professional_type,
        council_number: form.council_number.trim() || null,
        council_state: form.council_state.trim().toUpperCase() || null,
        phone: form.phone.trim() || null,
      } as never)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar seus dados agora.");
      return;
    }
    toast.success("Perfil salvo.");
    setStep(2);
  };

  const council = PROFESSION_CONFIG[form.professional_type].councilPrefix;

  return (
    <div className="admin-theme min-h-screen bg-background px-5 py-8">
      <Helmet>
        <title>Primeiros passos | SalbCare</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mx-auto w-full max-w-md space-y-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Passo {step} de 2
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight">
            {step === 1 ? "Complete seu perfil" : "Seu link de agendamento"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === 1
              ? "Leva menos de um minuto. Você pode ajustar depois no seu perfil."
              : "Compartilhe com seus pacientes para receber pedidos de horário."}
          </p>
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>

        {step === 1 && (
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="space-y-1.5">
              <Label>Nome que aparece para os pacientes</Label>
              <Input
                value={form.name}
                placeholder="Dra. Maria Silva"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Profissão</Label>
              <select
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.professional_type}
                onChange={(e) => setForm({ ...form, professional_type: e.target.value as ProfessionalType })}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PROFESSION_CONFIG[t].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{council}</Label>
                <Input
                  value={form.council_number}
                  placeholder="000000"
                  onChange={(e) => setForm({ ...form, council_number: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Input
                  value={form.council_state}
                  placeholder="CE"
                  maxLength={2}
                  onChange={(e) => setForm({ ...form, council_state: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp de contato</Label>
              <Input
                value={form.phone}
                placeholder="88999999999"
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <Button className="h-12 w-full font-semibold" disabled={saving} onClick={save}>
              {saving ? "Salvando" : "Salvar e continuar"}
            </Button>
            <button
              type="button"
              className="w-full text-xs text-muted-foreground"
              onClick={() => navigate("/dashboard", { replace: true })}
            >
              Fazer isso depois
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {user && (
              <BookingLinkBlock userId={user.id} profileName={form.name} profileSlug={slug} />
            )}
            <Button
              className="h-12 w-full font-semibold"
              onClick={() => navigate("/dashboard", { replace: true })}
            >
              Ir para o painel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Welcome;
