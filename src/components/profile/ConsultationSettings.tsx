import { useState, useEffect } from "react";
import { Clock, DollarSign, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const DAY_LABELS: Record<string, string> = {
  mon: "Segunda", tue: "Terça", wed: "Quarta", thu: "Quinta",
  fri: "Sexta", sat: "Sábado", sun: "Domingo",
};

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

type TimeSlot = { start: string; end: string };
type AvailableHours = Record<string, TimeSlot[]>;

const DEFAULT_HOURS: AvailableHours = {
  mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
};

const ConsultationSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [hours, setHours] = useState<AvailableHours>(DEFAULT_HOURS);
  const [hours, setHours] = useState<AvailableHours>(DEFAULT_HOURS);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-settings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("consultation_price, slot_duration, office_address, available_hours")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setPrice(profile.consultation_price?.toString() || "");
      setDuration(profile.slot_duration?.toString() || "30");
      setAddress(profile.office_address || "");
      if (profile.available_hours && typeof profile.available_hours === "object") {
        setHours({ ...DEFAULT_HOURS, ...(profile.available_hours as AvailableHours) });
      }
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          consultation_price: price ? parseFloat(price) : null,
          slot_duration: parseInt(duration),
          office_address: address || null,
          available_hours: hours as any,
        })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Configurações salvas!");
    },
    onError: () => toast.error("Erro ao salvar. Tente novamente."),
  });

  const toggleDay = (day: string) => {
    setHours((prev) => {
      const current = prev[day] || [];
      if (current.length > 0) return { ...prev, [day]: [] };
      return { ...prev, [day]: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }] };
    });
  };

  const addSlot = (day: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { start: "08:00", end: "12:00" }],
    }));
  };

  const removeSlot = (day: string, idx: number) => {
    setHours((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== idx),
    }));
  };

  const updateSlot = (day: string, idx: number, field: "start" | "end", value: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: prev[day].map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  };

  const timeOptions = Array.from({ length: 28 }, (_, i) => {
    const h = Math.floor(i / 2) + 7;
    const m = i % 2 === 0 ? "00" : "30";
    return `${String(h).padStart(2, "0")}:${m}`;
  });

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Clock className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Configurações da Consulta</h2>
      </div>

      {/* Price & Duration */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1 text-xs">
            <DollarSign className="h-3 w-3" /> Valor da consulta (R$)
          </Label>
          <Input
            type="number"
            placeholder="150,00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="bg-accent border-border"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" /> Duração padrão
          </Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="bg-accent border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="45">45 minutos</SelectItem>
              <SelectItem value="60">60 minutos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Office Address */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1 text-xs">
          <MapPin className="h-3 w-3" /> Endereço do consultório
        </Label>
        <Textarea
          placeholder="Rua, número, bairro, cidade — usado nos lembretes de consultas presenciais"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="bg-accent border-border text-sm resize-none"
          rows={2}
        />
      </div>

      {/* Available Hours */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Horários disponíveis para agendamento</Label>
        <div className="space-y-2">
          {DAY_KEYS.map((day) => {
            const slots = hours[day] || [];
            const isActive = slots.length > 0;
            return (
              <div key={day} className="glass-card p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={isActive} onCheckedChange={() => toggleDay(day)} />
                    <span className="text-xs font-medium">{DAY_LABELS[day]}</span>
                  </div>
                  {isActive && (
                    <button onClick={() => addSlot(day)} className="text-primary hover:text-primary/80">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {isActive && slots.map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-2 pl-10">
                    <Select value={slot.start} onValueChange={(v) => updateSlot(day, idx, "start", v)}>
                      <SelectTrigger className="h-7 text-[11px] bg-accent border-border w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {timeOptions.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <span className="text-[10px] text-muted-foreground">às</span>
                    <Select value={slot.end} onValueChange={(v) => updateSlot(day, idx, "end", v)}>
                      <SelectTrigger className="h-7 text-[11px] bg-accent border-border w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {timeOptions.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {slots.length > 1 && (
                      <button onClick={() => removeSlot(day, idx)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full gradient-primary font-semibold gap-2"
      >
        {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saveMutation.isPending ? "Salvando..." : "Salvar configurações"}
      </Button>
    </div>
  );
};

export default ConsultationSettings;
