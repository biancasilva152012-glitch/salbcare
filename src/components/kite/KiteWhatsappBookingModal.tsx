import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

type Lang = "en" | "es";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang?: Lang;
};

const COPY = {
  en: {
    title: "Book an appointment",
    desc: "Pick a service, date and time — we'll continue on WhatsApp to confirm.",
    service: "Service",
    services: { dental: "Dental", physio: "Physio & Recovery", telehealth: "Telehealth" },
    date: "Preferred date",
    time: "Preferred time",
    name: "Your name (optional)",
    namePh: "How should we call you?",
    email: "Email (optional)",
    emailPh: "you@example.com",
    cta: "Confirm on WhatsApp →",
    sending: "Saving…",
    note: "We'll confirm availability manually on WhatsApp.",
    errors: {
      service: "Please choose a service.",
      date: "Please choose a valid date (today or later).",
      time: "Please choose a time.",
      name: "Name must be under 80 characters.",
      email: "Please enter a valid email.",
      saveFailed: "Could not save your request. Please try again.",
    },
    statusTitles: {
      pending_whatsapp: "Booking saved — pending WhatsApp confirmation",
      confirmado: "Booking confirmed",
      erro: "We couldn't save your booking",
    },
    statusHints: {
      pending_whatsapp: "We saved your request. Continue on WhatsApp to finalise the time.",
      confirmado: "Your booking is confirmed. You can still send a message on WhatsApp.",
      erro: "You can retry, or continue on WhatsApp anyway — we'll capture your request manually.",
    },
    openWa: "Open WhatsApp",
    close: "Close",
    retry: "Try again",
  },
  es: {
    title: "Reservar una cita",
    desc: "Elige servicio, fecha y horario — seguimos por WhatsApp para confirmar.",
    service: "Servicio",
    services: { dental: "Dental", physio: "Fisio y recuperación", telehealth: "Telesalud" },
    date: "Fecha preferida",
    time: "Horario preferido",
    name: "Tu nombre (opcional)",
    namePh: "¿Cómo te llamamos?",
    email: "Email (opcional)",
    emailPh: "tu@ejemplo.com",
    cta: "Confirmar por WhatsApp →",
    sending: "Guardando…",
    note: "Confirmaremos disponibilidad manualmente por WhatsApp.",
    errors: {
      service: "Por favor elige un servicio.",
      date: "Elige una fecha válida (hoy o posterior).",
      time: "Por favor elige un horario.",
      name: "El nombre debe tener menos de 80 caracteres.",
      email: "Ingresa un email válido.",
      saveFailed: "No pudimos guardar tu solicitud. Intenta de nuevo.",
    },
    statusTitles: {
      pending_whatsapp: "Reserva guardada — pendiente de confirmación por WhatsApp",
      confirmado: "Reserva confirmada",
      erro: "No pudimos guardar tu reserva",
    },
    statusHints: {
      pending_whatsapp: "Guardamos tu solicitud. Continúa por WhatsApp para definir el horario.",
      confirmado: "Tu reserva está confirmada. Puedes enviar un mensaje por WhatsApp.",
      erro: "Puedes reintentar o continuar por WhatsApp — la atenderemos manualmente.",
    },
    openWa: "Abrir WhatsApp",
    close: "Cerrar",
    retry: "Reintentar",
  },
} as const;

type ServiceKey = "dental" | "physio" | "telehealth";
type Status = "pending_whatsapp" | "confirmado" | "erro";

const todayISO = () => new Date().toISOString().slice(0, 10);

const schema = z.object({
  service: z.enum(["dental", "physio", "telehealth"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((d) => d >= todayISO()),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
});

export default function KiteWhatsappBookingModal({ open, onOpenChange, lang = "en" }: Props) {
  const c = COPY[lang];
  const [service, setService] = useState<ServiceKey | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"service" | "date" | "time" | "name" | "email" | "form", string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [waUrl, setWaUrl] = useState<string>("");
  // Hard lock: prevents duplicate submissions even across rapid React re-renders.
  const submittingRef = useRef(false);

  function reset() {
    setService(""); setDate(""); setTime(""); setName(""); setEmail("");
    setErrors({}); setSubmitting(false); setStatus(null); setWaUrl("");
    submittingRef.current = false;
  }

  function buildWaUrl(svcLabel: string) {
    const lines = [
      "Olá! Gostaria de marcar um horário na SalbCare.",
      `Serviço: ${svcLabel}`,
      `Data preferida: ${date}`,
      `Horário preferido: ${time}`,
    ];
    if (name.trim()) lines.push(`Nome: ${name.trim()}`);
    if (email.trim()) lines.push(`Email: ${email.trim()}`);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return; // hard lock against double-clicks
    const next: typeof errors = {};
    if (!service) next.service = c.errors.service;
    if (!date || date < todayISO()) next.date = c.errors.date;
    if (!time) next.time = c.errors.time;
    if (name.trim().length > 80) next.name = c.errors.name;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = c.errors.email;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const parsed = schema.safeParse({ service, date, time, name: name.trim() || undefined, email: email.trim() });
    if (!parsed.success) {
      setErrors({ form: c.errors.saveFailed });
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setErrors({});

    const serviceLabel = c.services[service as ServiceKey];
    const url = buildWaUrl(serviceLabel);
    setWaUrl(url);

    try {
      const { error } = await supabase.functions.invoke("kite-whatsapp-booking", {
        body: { service, date, time, name: name.trim(), email: email.trim() },
      });
      if (error) {
        setStatus("erro");
      } else {
        setStatus("pending_whatsapp");
      }
    } catch (err) {
      console.warn("[kite-whatsapp-booking] save failed", err);
      setStatus("erro");
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  const statusUI = status && (
    <div
      className={`rounded-lg border p-4 space-y-3 ${
        status === "erro"
          ? "border-red-200 bg-red-50"
          : status === "confirmado"
          ? "border-emerald-200 bg-emerald-50"
          : "border-[#00B4A0]/30 bg-[#00B4A0]/5"
      }`}
    >
      <div className="flex items-start gap-2">
        {status === "erro" ? (
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-[#008C7C] shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#0D1B2A]">{c.statusTitles[status]}</p>
          <p className="text-xs text-gray-600 mt-1">{c.statusHints[status]}</p>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-2 font-mono">
            status: {status}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center rounded-md bg-[#00B4A0] hover:bg-[#008C7C] text-white font-semibold h-11 text-sm transition"
        >
          {c.openWa}
        </a>
        <Button
          type="button"
          variant="outline"
          onClick={() => { reset(); onOpenChange(false); }}
          className="h-11"
        >
          {c.close}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-2xl text-[#0D1B2A]"
          >
            {c.title}
          </DialogTitle>
          <DialogDescription className="text-[#6B7280]">{c.desc}</DialogDescription>
        </DialogHeader>

        {status ? (
          statusUI
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4" noValidate>
            <div>
              <Label>{c.service}</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(["dental", "physio", "telehealth"] as const).map((sKey) => (
                  <button
                    key={sKey}
                    type="button"
                    onClick={() => { setService(sKey); setErrors((p) => ({ ...p, service: undefined })); }}
                    className={`px-2 py-2 rounded-md border text-xs sm:text-sm font-semibold transition ${
                      service === sKey
                        ? "border-[#00B4A0] bg-[#00B4A0]/10 text-[#008C7C]"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {c.services[sKey]}
                  </button>
                ))}
              </div>
              {errors.service && <p className="text-xs text-red-600 mt-1">{errors.service}</p>}
            </div>

            <div>
              <Label htmlFor="kw-date">{c.date}</Label>
              <Input
                id="kw-date"
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: undefined })); }}
                min={todayISO()}
                required
              />
              {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
            </div>

            <div>
              <Label htmlFor="kw-time">{c.time}</Label>
              <Input
                id="kw-time"
                type="time"
                value={time}
                onChange={(e) => { setTime(e.target.value); setErrors((p) => ({ ...p, time: undefined })); }}
                required
              />
              {errors.time && <p className="text-xs text-red-600 mt-1">{errors.time}</p>}
            </div>

            <div>
              <Label htmlFor="kw-name">{c.name}</Label>
              <Input
                id="kw-name"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                placeholder={c.namePh}
                maxLength={80}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="kw-email">{c.email}</Label>
              <Input
                id="kw-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                placeholder={c.emailPh}
                maxLength={200}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}

            <Button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="w-full bg-[#00B4A0] hover:bg-[#008C7C] text-white font-semibold h-12 text-base"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {c.sending}
                </span>
              ) : (
                c.cta
              )}
            </Button>
            <p className="text-xs text-center text-gray-500">{c.note}</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
