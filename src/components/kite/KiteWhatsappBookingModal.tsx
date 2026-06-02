import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

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
    services: {
      dental: "Dental",
      physio: "Physio & Recovery",
      telehealth: "Telehealth",
    },
    date: "Preferred date",
    time: "Preferred time",
    name: "Your name (optional)",
    namePh: "How should we call you?",
    cta: "Confirm on WhatsApp →",
    note: "We'll confirm availability manually on WhatsApp.",
    missing: "Please choose a service, date and time.",
    msgIntro: "Hi! I'd like to book an appointment through SalbCare Kite.",
  },
  es: {
    title: "Reservar una cita",
    desc: "Elige servicio, fecha y horario — seguimos por WhatsApp para confirmar.",
    service: "Servicio",
    services: {
      dental: "Dental",
      physio: "Fisio y recuperación",
      telehealth: "Telesalud",
    },
    date: "Fecha preferida",
    time: "Horario preferido",
    name: "Tu nombre (opcional)",
    namePh: "¿Cómo te llamamos?",
    cta: "Confirmar por WhatsApp →",
    note: "Confirmaremos disponibilidad manualmente por WhatsApp.",
    missing: "Por favor elige servicio, fecha y horario.",
    msgIntro: "¡Hola! Quisiera reservar una cita a través de SalbCare Kite.",
  },
} as const;

type ServiceKey = "dental" | "physio" | "telehealth";

export default function KiteWhatsappBookingModal({ open, onOpenChange, lang = "en" }: Props) {
  const c = COPY[lang];
  const [service, setService] = useState<ServiceKey | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!service || !date || !time) {
      setError(c.missing);
      return;
    }
    setError(null);
    const serviceLabel = c.services[service];
    const lines = [
      c.msgIntro,
      `Service: ${serviceLabel}`,
      `Date: ${date}`,
      `Time: ${time}`,
    ];
    if (name.trim()) lines.push(`Name: ${name.trim()}`);
    const text = lines.map(encodeURIComponent).join("%0A");
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <Label>{c.service}</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(["dental", "physio", "telehealth"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setService(s)}
                  className={`px-2 py-2 rounded-md border text-xs sm:text-sm font-semibold transition ${
                    service === s
                      ? "border-[#00B4A0] bg-[#00B4A0]/10 text-[#008C7C]"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {c.services[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="kw-date">{c.date}</Label>
            <Input
              id="kw-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>

          <div>
            <Label htmlFor="kw-time">{c.time}</Label>
            <Input
              id="kw-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="kw-name">{c.name}</Label>
            <Input
              id="kw-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={c.namePh}
              maxLength={80}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-[#00B4A0] hover:bg-[#008C7C] text-white font-semibold h-12 text-base"
          >
            {c.cta}
          </Button>
          <p className="text-xs text-center text-gray-500">{c.note}</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
