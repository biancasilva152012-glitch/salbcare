import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon, Clock, Video, User, Send, ArrowLeft, ArrowRight, Check, QrCode, CalendarPlus, Copy, ExternalLink } from "lucide-react";
import { format, parse, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { maskPhone } from "@/utils/masks";
import { SPECIALTY_LEGAL_NOTICES } from "@/config/specialtyLegalNotices";
import { PROFESSION_CONFIG } from "@/config/professions";

type TimeSlot = { start: string; end: string };
type AvailableHours = Record<string, TimeSlot[]>;
const DAY_MAP: Record<number, string> = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };

function generateSlots(availableHours: AvailableHours, dateStr: string, durationMin: number): string[] {
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  const dayKey = DAY_MAP[date.getDay()];
  const ranges = availableHours[dayKey] || [];
  const slots: string[] = [];
  const now = new Date();
  const isToday = format(now, "yyyy-MM-dd") === dateStr;

  for (const range of ranges) {
    const [startH, startM] = range.start.split(":").map(Number);
    const [endH, endM] = range.end.split(":").map(Number);
    let cursor = startH * 60 + startM;
    const end = endH * 60 + endM;
    while (cursor + durationMin <= end) {
      const h = Math.floor(cursor / 60);
      const m = cursor % 60;
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      if (!isToday || h > now.getHours() || (h === now.getHours() && m > now.getMinutes())) {
        slots.push(timeStr);
      }
      cursor += durationMin;
    }
  }
  return slots;
}

function hasAvailability(availableHours: AvailableHours, date: Date): boolean {
  const dayKey = DAY_MAP[date.getDay()];
  const ranges = availableHours[dayKey] || [];
  return ranges.length > 0;
}

const STEPS = ["Horário", "Seus dados", "Confirmação", "Sucesso"];

const PatientBooking = () => {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get("doctor");
  const doctorName = searchParams.get("name") || "Profissional";

  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    reason: "",
    isReturning: false,
  });

  const { data: doctor } = useQuery({
    queryKey: ["booking-doctor", doctorId],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_professionals", { specialty_filter: null });
      return (data || []).find((p: any) => p.user_id === doctorId) || null;
    },
    enabled: !!doctorId,
  });

  // Fetch existing appointments to exclude booked slots
  const { data: existingAppointments = [] } = useQuery({
    queryKey: ["booked-slots", doctorId, selectedDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("time")
        .eq("user_id", doctorId!)
        .eq("date", selectedDate)
        .neq("status", "cancelled");
      return data || [];
    },
    enabled: !!doctorId && !!selectedDate,
  });

  const availableHours: AvailableHours = (doctor?.available_hours as AvailableHours) || {};
  const slotDuration = doctor?.slot_duration || 30;
  const price = doctor?.consultation_price ? Number(doctor.consultation_price) : 0;
  const profType = doctor?.professional_type || "medico";
  const legalNotice = SPECIALTY_LEGAL_NOTICES[profType];
  const profConfig = PROFESSION_CONFIG[profType as keyof typeof PROFESSION_CONFIG];

  const allSlots = useMemo(() => {
    if (!selectedDate) return [];
    return generateSlots(availableHours, selectedDate, slotDuration);
  }, [availableHours, selectedDate, slotDuration]);

  const bookedTimes = new Set(existingAppointments.map((a: any) => a.time?.substring(0, 5)));
  const freeSlots = allSlots.filter((s) => !bookedTimes.has(s));

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const cityFromTz = tz.split("/").pop()?.replace(/_/g, " ") || tz;

  const pixDiscount = price > 0 ? price * 0.05 : 0;
  const pixPrice = price - pixDiscount;
  const canInstall = price > 150;

  const handleSubmit = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      // If there's a price, redirect to Stripe Checkout
      if (price > 0) {
        const finalAmount = paymentMethod === "pix" ? pixPrice : price;
        const { data, error } = await supabase.functions.invoke("create-consultation-payment", {
          body: {
            doctor_id: doctorId,
            patient_name: form.name,
            patient_email: form.email,
            patient_phone: form.phone,
            date: selectedDate,
            time: selectedTime,
            payment_method: paymentMethod,
            amount: finalAmount,
            notes: `Tel: ${form.phone} | Nasc: ${form.birthDate} | Motivo: ${form.reason || "—"} | Retorno: ${form.isReturning ? "Sim" : "Não"}`,
          },
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }

      // Free consultation — just create appointment
      const { error } = await supabase.from("appointments").insert({
        user_id: doctorId,
        patient_name: form.name,
        date: selectedDate,
        time: selectedTime,
        appointment_type: "telehealth",
        notes: `[Agendamento online] Tel: ${form.phone} | Email: ${form.email} | Nasc: ${form.birthDate} | Motivo: ${form.reason || "—"} | Retorno: ${form.isReturning ? "Sim" : "Não"} | Pagamento: ${paymentMethod}`,
        status: "scheduled",
      });
      if (error) throw error;
      setStep(3);
    } catch {
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const canGoNext = () => {
    if (step === 0) return !!selectedDate && !!selectedTime;
    if (step === 1) return !!form.name && !!form.email && !!form.phone && !!form.birthDate;
    if (step === 2) return true;
    return false;
  };

  const handleNext = () => {
    if (step === 2) {
      handleSubmit();
      return;
    }
    if (canGoNext()) setStep(step + 1);
  };

  const googleCalUrl = useMemo(() => {
    if (!selectedDate || !selectedTime) return "";
    const start = `${selectedDate.replace(/-/g, "")}T${selectedTime.replace(":", "")}00`;
    const endDate = new Date(`${selectedDate}T${selectedTime}`);
    endDate.setMinutes(endDate.getMinutes() + slotDuration);
    const end = format(endDate, "yyyyMMdd'T'HHmmss");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Consulta online - ${doctorName}`)}&dates=${start}/${end}&details=${encodeURIComponent("Consulta online via SALBCARE. Acesse a plataforma 5 minutos antes do horário.")}`;
  }, [selectedDate, selectedTime, slotDuration, doctorName]);

  if (!doctorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-3">
          <h1 className="text-lg font-bold">Link inválido</h1>
          <p className="text-sm text-muted-foreground">Este link de agendamento não é válido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-md space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
            <Video className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold">Agendar Teleconsulta</h1>
          <p className="text-sm text-muted-foreground">com <strong>{doctorName}</strong></p>
          {profConfig && (
            <p className="text-[10px] text-muted-foreground">{profConfig.label} • {profConfig.councilPrefix}</p>
          )}
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center justify-center gap-1">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  i <= step ? "bg-primary" : "bg-muted"
                )} />
                {i < 2 && <div className={cn("h-px w-6", i < step ? "bg-primary" : "bg-muted")} />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 0: Date & Time */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" /> Escolha o horário
              </h2>
              <p className="text-[10px] text-muted-foreground">🕐 Horários no fuso de {cityFromTz}</p>

              <div className="space-y-1.5">
                <Label className="text-xs">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-accent border-border", !selectedDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(parse(selectedDate, "yyyy-MM-dd", new Date()), "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate ? parse(selectedDate, "yyyy-MM-dd", new Date()) : undefined}
                      onSelect={(d) => {
                        setSelectedDate(d ? format(d, "yyyy-MM-dd") : "");
                        setSelectedTime("");
                      }}
                      locale={ptBR}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0)) || !hasAvailability(availableHours, d)}
                      fromDate={new Date()}
                      toDate={addDays(new Date(), 60)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {selectedDate && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Horário — consulta de {slotDuration} min</Label>
                  {freeSlots.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">Nenhum horário disponível nesta data.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5">
                      {freeSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={cn(
                            "rounded-lg border px-2 py-2 text-xs font-medium transition-all",
                            selectedTime === slot
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-accent text-foreground hover:border-primary/50"
                          )}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 1: Patient Data */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-5 space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Seus dados
              </h2>

              <div className="space-y-1.5">
                <Label className="text-xs">Nome completo *</Label>
                <Input placeholder="Seu nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">E-mail *</Label>
                <Input type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-accent border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">WhatsApp (com DDD) *</Label>
                <Input placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} className="bg-accent border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data de nascimento *</Label>
                <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="bg-accent border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Motivo da consulta</Label>
                <Textarea
                  placeholder="Descreva brevemente seus sintomas ou motivo..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value.slice(0, 300) })}
                  className="bg-accent border-border text-sm resize-none"
                  rows={2}
                />
                <p className="text-[10px] text-muted-foreground text-right">{form.reason.length}/300</p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.isReturning}
                  onCheckedChange={(v) => setForm({ ...form, isReturning: !!v })}
                />
                <Label className="text-xs cursor-pointer">Já fui paciente deste profissional</Label>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Payment & Confirmation */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" /> Confirmação e pagamento
              </h2>

              {/* Summary */}
              <div className="rounded-lg bg-accent/50 border border-border p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Profissional</span>
                  <span className="font-medium">{doctorName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium">{selectedDate ? format(parse(selectedDate, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : ""}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Horário</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Duração</span>
                  <span className="font-medium">{slotDuration} min</span>
                </div>
                {price > 0 && (
                  <div className="flex justify-between text-xs pt-1 border-t border-border">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-bold text-foreground">R$ {price.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Payment method */}
              {price > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Forma de pagamento</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod("pix")}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all",
                        paymentMethod === "pix"
                          ? "border-green-500 bg-green-500/10 ring-1 ring-green-500"
                          : "border-border bg-accent hover:bg-accent/80"
                      )}
                    >
                      <QrCode className="h-5 w-5" />
                      <span className="text-xs font-medium">Pix</span>
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">5% desconto</span>
                      <span className="text-xs font-bold">R$ {pixPrice.toFixed(2)}</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all",
                        paymentMethod === "card"
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border bg-accent hover:bg-accent/80"
                      )}
                    >
                      <CreditCard className="h-5 w-5" />
                      <span className="text-xs font-medium">Cartão</span>
                      {canInstall && <span className="text-[10px] text-muted-foreground">até 3x sem juros</span>}
                      <span className="text-xs font-bold">R$ {price.toFixed(2)}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Legal notice */}
              {legalNotice && (
                <p className="text-[10px] text-muted-foreground leading-relaxed bg-muted/50 rounded-lg border border-border p-2">
                  ⚖️ {legalNotice}
                </p>
              )}

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                O pagamento vai direto para o profissional via Pix. 100% do valor é do profissional.
              </p>
            </motion.div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mx-auto">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-lg font-bold">Consulta agendada com sucesso! ✅</h2>
              <p className="text-sm text-muted-foreground">
                Você receberá a confirmação por WhatsApp e e-mail com o link de acesso à videochamada.
              </p>

              <div className="rounded-lg bg-accent/50 border border-border p-3 space-y-1.5 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Profissional</span>
                  <span className="font-medium">{doctorName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium">{selectedDate ? format(parse(selectedDate, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : ""}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Horário</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p>📱 Clique no link <strong>5 minutos antes</strong> do horário</p>
                <p>❌ Precisa cancelar? Faça com até <strong>2h de antecedência</strong></p>
              </div>

              <a
                href={googleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-accent px-4 py-2 text-xs font-medium hover:bg-accent/80 transition-colors"
              >
                <CalendarPlus className="h-4 w-4" />
                Adicionar ao Google Agenda
              </a>

              {legalNotice && (
                <p className="text-[10px] text-muted-foreground leading-relaxed pt-2 border-t border-border">
                  ⚖️ {legalNotice}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {step < 3 && (
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1 border-border">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canGoNext() || loading}
              className="flex-1 gradient-primary font-semibold gap-1"
            >
              {step === 2 ? (
                loading ? "Confirmando..." : <>Confirmar agendamento <Send className="h-4 w-4" /></>
              ) : (
                <>Próximo <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        )}

        <p className="text-[10px] text-center text-muted-foreground">Powered by SALBCARE</p>
      </div>
    </div>
  );
};

export default PatientBooking;
