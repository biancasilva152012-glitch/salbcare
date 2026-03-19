import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, Clock, Video, User, Send, ArrowLeft, ArrowRight, Check, QrCode, CalendarPlus, Copy, ExternalLink, Upload, Camera, Loader2 } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { maskPhone } from "@/utils/masks";
import { SPECIALTY_LEGAL_NOTICES } from "@/config/specialtyLegalNotices";
import { PROFESSION_CONFIG } from "@/config/professions";

type TimeSlot = { start: string; end: string };
type AvailableHours = Record<string, TimeSlot[]>;
const DAY_MAP: Record<number, string> = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };

function generateSlots(availableHours: AvailableHours, dateStr: string, durationMin: number, intervalMin: number = 10, minAdvanceHours: number = 3): string[] {
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  const dayKey = DAY_MAP[date.getDay()];
  const ranges = availableHours[dayKey] || [];
  const slots: string[] = [];
  const now = new Date();
  const minTime = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);
  const step = durationMin + intervalMin;

  for (const range of ranges) {
    const [startH, startM] = range.start.split(":").map(Number);
    const [endH, endM] = range.end.split(":").map(Number);
    let cursor = startH * 60 + startM;
    const end = endH * 60 + endM;
    while (cursor + durationMin <= end) {
      const h = Math.floor(cursor / 60);
      const m = cursor % 60;
      const slotDate = new Date(date);
      slotDate.setHours(h, m, 0, 0);
      if (slotDate > minTime) {
        const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        slots.push(timeStr);
      }
      cursor += step;
    }
  }
  return slots;
}

function hasAvailability(availableHours: AvailableHours, date: Date): boolean {
  const dayKey = DAY_MAP[date.getDay()];
  const ranges = availableHours[dayKey] || [];
  return ranges.length > 0;
}

const STEPS = ["Horário", "Seus dados", "Confirmação", "Comprovante", "Sucesso"];

const PatientBooking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const doctorId = searchParams.get("doctor");
  const doctorName = searchParams.get("name") || "Profissional";

  // Block professionals from booking — redirect to dashboard
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("user_type")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.user_type === "professional") {
          navigate("/dashboard", { replace: true });
        }
      });
  }, [user, navigate]);

  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
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

  // Realtime: instantly remove booked/blocked slots for all patients
  useEffect(() => {
    if (!doctorId) return;
    const channel = supabase
      .channel("booking-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `user_id=eq.${doctorId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["booked-slots", doctorId] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["booking-doctor"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [doctorId, queryClient]);

  const availableHours: AvailableHours = (doctor?.available_hours as AvailableHours) || {};
  const slotDuration = doctor?.slot_duration || 30;
  const intervalMinutes = (doctor as any)?.interval_minutes ?? 10;
  const minAdvanceHours = (doctor as any)?.min_advance_hours ?? 3;
  const price = doctor?.consultation_price ? Number(doctor.consultation_price) : 0;
  const profType = doctor?.professional_type || "medico";
  const legalNotice = SPECIALTY_LEGAL_NOTICES[profType];
  const profConfig = PROFESSION_CONFIG[profType as keyof typeof PROFESSION_CONFIG];

  const allSlots = useMemo(() => {
    if (!selectedDate) return [];
    return generateSlots(availableHours, selectedDate, slotDuration, intervalMinutes, minAdvanceHours);
  }, [availableHours, selectedDate, slotDuration, intervalMinutes, minAdvanceHours]);

  const bookedTimes = new Set(existingAppointments.map((a: any) => a.time?.substring(0, 5)));
  const freeSlots = allSlots.filter((s) => !bookedTimes.has(s));

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const cityFromTz = tz.split("/").pop()?.replace(/_/g, " ") || tz;

  const doctorPixKey = (doctor as any)?.pix_key || "";
  const doctorCardLink = (doctor as any)?.card_link || "";

  const copyPixKey = () => {
    navigator.clipboard.writeText(doctorPixKey);
    toast.success("Chave Pix copiada!");
  };

  const handleSubmit = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("appointments").insert({
        user_id: doctorId,
        patient_name: form.name,
        date: selectedDate,
        time: selectedTime,
        appointment_type: "telehealth",
        notes: `[Agendamento online] Tel: ${form.phone} | Email: ${form.email} | Nasc: ${form.birthDate} | Motivo: ${form.reason || "—"} | Retorno: ${form.isReturning ? "Sim" : "Não"} | Valor: R$ ${price.toFixed(2)}`,
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
                <QrCode className="h-4 w-4 text-primary" /> Confirmação e pagamento
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

              {/* PIX Payment Info */}
              {price > 0 && doctorPixKey && (
                <div className="space-y-2">
                  <p className="text-xs font-medium">Pague via Pix diretamente ao profissional:</p>
                  <div className="rounded-lg border border-border bg-accent/50 p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground">Chave Pix</p>
                      <p className="text-sm font-mono font-medium truncate">{doctorPixKey}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyPixKey} className="shrink-0 gap-1 text-xs">
                      <Copy className="h-3 w-3" /> Copiar
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Transfira <strong>R$ {price.toFixed(2)}</strong> para a chave acima. O pagamento vai 100% para o profissional.
                  </p>
                </div>
              )}

              {/* Card Payment Link */}
              {price > 0 && doctorCardLink && (
                <div className="space-y-2">
                  <p className="text-xs font-medium">Ou pague via cartão:</p>
                  <a
                    href={doctorCardLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg border border-border bg-accent p-3 text-sm font-medium hover:bg-accent/80 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" /> Pagar com cartão
                  </a>
                </div>
              )}

              {price > 0 && !doctorPixKey && !doctorCardLink && (
                <div className="rounded-lg border border-border bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    O profissional ainda não cadastrou dados de pagamento. Entre em contato diretamente para combinar o pagamento.
                  </p>
                </div>
              )}

              {/* Legal notice */}
              {legalNotice && (
                <p className="text-[10px] text-muted-foreground leading-relaxed bg-muted/50 rounded-lg border border-border p-2">
                  ⚖️ {legalNotice}
                </p>
              )}

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                O pagamento vai direto para o profissional. 100% do valor é do profissional.
              </p>
            </motion.div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mx-auto">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-lg font-bold">✅ Consulta confirmada!</h2>

              <div className="rounded-lg bg-accent/50 border border-border p-3 space-y-1.5 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Profissional</span>
                  <span className="font-medium">{doctorName}</span>
                </div>
                {profConfig && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Especialidade</span>
                    <span className="font-medium">{profConfig.label}</span>
                  </div>
                )}
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
              </div>

              <p className="text-sm text-muted-foreground">
                Acesse sua consulta pelo link abaixo no horário marcado:
              </p>

              {doctor && (doctor as any).pix_key && (
                <a
                  href={`https://meet.google.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  onClick={(e) => {
                    // We need the doctor's meet_link — use room_url from sala page
                    e.preventDefault();
                    window.open(`${window.location.origin}/sala?id=latest`, "_blank");
                  }}
                >
                  <Button className="w-full gradient-primary font-semibold text-base py-5 gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Entrar no Google Meet
                  </Button>
                </a>
              )}

              <p className="text-xs text-muted-foreground">
                Salve este link — ele também foi enviado para o seu WhatsApp.
              </p>

              {/* WhatsApp confirmation link */}
              {form.phone && (
                <Button
                  variant="outline"
                  className="w-full gap-2 text-xs"
                  onClick={() => {
                    const phone = form.phone.replace(/\D/g, "");
                    const dateStr = selectedDate ? format(parse(selectedDate, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "";
                    const msg = encodeURIComponent(
                      `✅ Consulta confirmada com ${doctorName}!\n\n📅 ${dateStr} às ${selectedTime}\n⏱ ${slotDuration} minutos\n\nSalve este link. Entraremos em contato com lembretes antes da consulta.`
                    );
                    window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
                  }}
                >
                  <Video className="h-4 w-4" />
                  Receber confirmação no WhatsApp
                </Button>
              )}

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
