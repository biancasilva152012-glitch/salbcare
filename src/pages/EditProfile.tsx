import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Hours = { days: number[]; start: string; end: string };
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DEFAULT_HOURS: Hours = { days: [1, 2, 3, 4, 5], start: "08:00", end: "18:00" };

const EditProfile = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState<Hours>(DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["edit-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("name, phone, available_hours").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setName(data.name || "");
    setPhone(data.phone || "");
    const h = data.available_hours as Partial<Hours> | null;
    if (h && Array.isArray(h.days)) setHours({ ...DEFAULT_HOURS, ...h } as Hours);
  }, [data]);

  const toggleDay = (d: number) =>
    setHours((h) => ({ ...h, days: h.days.includes(d) ? h.days.filter((x) => x !== d) : [...h.days, d].sort() }));

  const save = async () => {
    if (!user) return;
    if (name.trim().length < 2) return toast.error("Informe seu nome.");
    const digits = phone.replace(/\D/g, "");
    if (digits && (digits.length < 10 || digits.length > 13)) return toast.error("WhatsApp inválido. Use DDD + número.");
    if (hours.start >= hours.end) return toast.error("O horário final deve ser depois do inicial.");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim().slice(0, 100), phone: digits || null, available_hours: hours })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar.");
    qc.invalidateQueries();
    toast.success("Perfil salvo.");
    navigate("/dashboard");
  };

  return (
    <PageContainer className="admin-theme" backTo="/dashboard">
      <p className="admin-eyebrow">Perfil</p>
      <h1 className="font-heading mb-4 text-2xl font-semibold">Editar perfil</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="ep-name">Nome</Label>
            <Input id="ep-name" className="h-12" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ep-email">E-mail</Label>
            <Input id="ep-email" className="h-12" value={user?.email || ""} disabled />
            <p className="text-xs text-muted-foreground">O e-mail é o mesmo do login.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ep-phone">WhatsApp</Label>
            <Input id="ep-phone" className="h-12" inputMode="tel" placeholder="(88) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Dias de atendimento</Label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`h-12 rounded-lg border text-xs ${hours.days.includes(i) ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="ep-start">Início</Label>
              <Input id="ep-start" type="time" className="h-12" value={hours.start} onChange={(e) => setHours({ ...hours, start: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ep-end">Fim</Label>
              <Input id="ep-end" type="time" className="h-12" value={hours.end} onChange={(e) => setHours({ ...hours, end: e.target.value })} />
            </div>
          </div>
          <Button className="h-12 w-full" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </div>
      )}
    </PageContainer>
  );
};

export default EditProfile;
