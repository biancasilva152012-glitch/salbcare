import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

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
    msgIntro: "Hi! I'd like to book an appointment through SalbCare Kite.",
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
    msgIntro: "¡Hola! Quisiera reservar una cita a través de SalbCare Kite.",
  },
} as const;

type ServiceKey = "dental" | "physio" | "telehealth";

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

  function reset() {
    setService(""); setDate(""); setTime(""); setName(""); setEmail("");
    setErrors({}); setSubmitting(false);
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
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

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("kite-whatsapp-booking", {
        body: { service, date, time, name: name.trim(), email: email.trim() },
      });
      if (error) {
        setSubmitting(false);
        setErrors({ form: c.errors.saveFailed });
        return;
      }
    } catch {
      setSubmitting(false);
      setErrors({ form: c.errors.saveFailed });
      return;
    }

    const serviceLabel = c.services[service as ServiceKey];
    const lines = [
      c.msgIntro,
      `Service: ${serviceLabel}`,
      `Date: ${date}`,
      `Time: ${time}`,
    ];
    if (name.trim()) lines.push(`Name: ${name.trim()}`);
    if (email.trim()) lines.push(`Email: ${email.trim()}`);
    const text = lines.map(encodeURIComponent).join("%0A");
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
    reset();
    onOpenChange(false);
  }

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
            className="w-full bg-[#00B4A0] hover:bg-[#008C7C] text-white font-semibold h-12 text-base"
          >
            {submitting ? c.sending : c.cta}
          </Button>
          <p className="text-xs text-center text-gray-500">{c.note}</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
