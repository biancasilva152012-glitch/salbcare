import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Video, User, Send } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { maskPhone } from "@/utils/masks";

const PatientBooking = () => {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get("doctor");
  const doctorName = searchParams.get("name") || "Profissional";

  const [form, setForm] = useState({
    patient_name: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    appointment_type: "presencial",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.patient_name || !form.phone || !form.date || !form.time) {
      toast.error("Preencha nome, telefone, data e horário.");
      return;
    }
    if (!doctorId) {
      toast.error("Link inválido.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("appointments").insert({
        user_id: doctorId,
        patient_name: form.patient_name,
        date: form.date,
        time: form.time,
        appointment_type: form.appointment_type,
        notes: `[Agendamento pelo paciente] Tel: ${form.phone} | Email: ${form.email || "—"} | ${form.notes || "Sem observações"}`,
        status: "scheduled",
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Consulta solicitada com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao solicitar consulta");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-md w-full p-8 text-center space-y-4"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Consulta Solicitada! ✅</h1>
          <p className="text-sm text-muted-foreground">
            Sua solicitação foi enviada para <strong>{doctorName}</strong>. 
            Você receberá a confirmação em breve.
          </p>
          <p className="text-xs text-muted-foreground">Powered by SalbCare</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-md w-full p-6 space-y-5"
      >
        <div className="text-center space-y-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
            <User className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold">Agendar Consulta</h1>
          <p className="text-sm text-muted-foreground">
            com <strong>{doctorName}</strong>
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Seu nome completo</Label>
            <Input placeholder="Nome completo" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} className="bg-accent border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone (WhatsApp)</Label>
            <Input placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} className="bg-accent border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail (opcional)</Label>
            <Input type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-accent border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-accent border-border", !form.date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.date ? format(parse(form.date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date ? parse(form.date, "yyyy-MM-dd", new Date()) : undefined}
                    onSelect={(d) => setForm({ ...form, date: d ? format(d, "yyyy-MM-dd") : "" })}
                    locale={ptBR}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Horário</Label>
              <Select value={form.time} onValueChange={(v) => setForm({ ...form, time: v })}>
                <SelectTrigger className="bg-accent border-border"><SelectValue placeholder="Horário" /></SelectTrigger>
                <SelectContent className="max-h-48">
                  {Array.from({ length: 28 }, (_, i) => {
                    const h = Math.floor(i / 2) + 7;
                    const m = i % 2 === 0 ? "00" : "30";
                    const val = `${String(h).padStart(2, "0")}:${m}`;
                    return <SelectItem key={val} value={val}>{val}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de consulta</Label>
            <Select value={form.appointment_type} onValueChange={(v) => setForm({ ...form, appointment_type: v })}>
              <SelectTrigger className="bg-accent border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="telehealth">Teleconsulta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Observações (opcional)</Label>
            <Textarea placeholder="Descreva seus sintomas ou motivo da consulta..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-accent border-border" />
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full gradient-primary font-semibold gap-2">
            <Send className="h-4 w-4" />
            {loading ? "Enviando..." : "Solicitar Consulta"}
          </Button>
        </div>

        <p className="text-[10px] text-center text-muted-foreground">Powered by SalbCare</p>
      </motion.div>
    </div>
  );
};

export default PatientBooking;
