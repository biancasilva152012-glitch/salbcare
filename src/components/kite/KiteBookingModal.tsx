import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

export type KiteProcedure = {
  id: string;
  label: string;
  type: "presencial" | "online";
  amountCharged: number;
  totalPrice: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure: KiteProcedure | null;
  lang?: "en" | "es";
};

const COPY = {
  en: {
    step: (n: number, total: number) => `Step ${n} of ${total}`,
    step1Title: "Pick a date & time",
    step2Title: "Your contact & deposit",
    onlineBadge: "Full payment now. Meet link sent after confirmation.",
    partial: (paid: number, rest: number) => `R$ ${paid} now + R$ ${rest} at the clinic`,
    date: "Preferred date",
    timeLabel: "Preferred time",
    times: { morning: "Morning", afternoon: "Afternoon", any: "Any" } as Record<string, string>,
    name: "Full name",
    email: "Email",
    next: "Next →",
    back: "← Back",
    cta: (n: number, online: boolean) => online ? `Pay R$ ${n} →` : `Pay R$ ${n} deposit →`,
    redirecting: "Redirecting to secure payment…",
    secure: "Secure payment via Stripe. International cards accepted.",
    missingDate: "Please pick a date",
    missingContact: "Please fill in your name and email",
    err: "Could not start checkout",
    waHelp: "Need help? Chat with us on WhatsApp",
    waMsg: (label: string) => `Hi! I'd like to book a ${label} appointment with SalbCare in Guajiru.`,
  },
  es: {
    step: (n: number, total: number) => `Paso ${n} de ${total}`,
    step1Title: "Elige fecha y horario",
    step2Title: "Tus datos y depósito",
    onlineBadge: "Pago completo ahora. Enlace de Meet enviado tras confirmación.",
    partial: (paid: number, rest: number) => `R$ ${paid} ahora + R$ ${rest} en la clínica`,
    date: "Fecha preferida",
    timeLabel: "Horario preferido",
    times: { morning: "Mañana", afternoon: "Tarde", any: "Cualquiera" } as Record<string, string>,
    name: "Nombre completo",
    email: "Correo electrónico",
    next: "Siguiente →",
    back: "← Atrás",
    cta: (n: number, online: boolean) => online ? `Pagar R$ ${n} →` : `Pagar R$ ${n} de depósito →`,
    redirecting: "Redirigiendo al pago seguro…",
    secure: "Pago seguro vía Stripe. Tarjetas internacionales aceptadas.",
    missingDate: "Por favor elige una fecha",
    missingContact: "Por favor completa tu nombre y correo",
    err: "No se pudo iniciar el checkout",
    waHelp: "¿Necesitas ayuda? Chatea con nosotros en WhatsApp",
    waMsg: (label: string) => `¡Hola! Quiero reservar una cita de ${label} con SalbCare en Guajiru.`,
  },
};

export default function KiteBookingModal({ open, onOpenChange, procedure, lang = "en" }: Props) {
  const c = COPY[lang];
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [timePref, setTimePref] = useState<"morning" | "afternoon" | "any">("any");
  const [loading, setLoading] = useState(false);

  if (!procedure) return null;

  const isOnline = procedure.type === "online";
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(c.waMsg(procedure.label))}`;

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setStep(1);
      setLoading(false);
    }
    onOpenChange(nextOpen);
  }

  function goNext() {
    if (!date) {
      toast.error(c.missingDate);
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) {
      toast.error(c.missingContact);
      return;
    }
    setLoading(true);
    try {
      const pousada_ref = typeof window !== "undefined" ? localStorage.getItem("pousada_ref") || "" : "";
      const { data, error } = await supabase.functions.invoke("create-kite-checkout", {
        body: {
          procedureId: procedure!.id,
          patient_name: name,
          email,
          preferred_date: date,
          time_preference: timePref,
          notes: "",
          pousada_ref,
          lang,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("Checkout URL not returned");
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err?.message || c.err);
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#00B4A0]">
            {c.step(step, 2)}
          </p>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl text-[#0D1B2A]">
            {step === 1 ? c.step1Title : c.step2Title}
          </DialogTitle>
          <DialogDescription className="text-[#5a564f]">
            <span className="block font-semibold text-[#0D1B2A]">{procedure.label}</span>
            {isOnline ? (
              <span className="inline-block mt-2 px-2 py-1 rounded bg-[#2c6e49]/10 text-[#2c6e49] text-xs font-semibold">
                {c.onlineBadge}
              </span>
            ) : (
              <span className="inline-block mt-2 px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-semibold">
                {c.partial(procedure.amountCharged, procedure.totalPrice - procedure.amountCharged)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="kite-date">{c.date}</Label>
              <Input id="kite-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <Label>{c.timeLabel}</Label>
              <div className="flex gap-2 mt-1">
                {(["morning", "afternoon", "any"] as const).map((tk) => (
                  <button
                    key={tk}
                    type="button"
                    onClick={() => setTimePref(tk)}
                    className={`flex-1 px-3 py-2 rounded-md border text-sm transition ${
                      timePref === tk
                        ? "border-[#00B4A0] bg-[#00B4A0]/10 text-[#008C7C] font-semibold"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {c.times[tk]}
                  </button>
                ))}
              </div>
            </div>
            <Button
              type="button"
              onClick={goNext}
              className="w-full bg-[#00B4A0] hover:bg-[#008C7C] text-white font-semibold h-12 text-base"
            >
              {c.next}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="kite-name">{c.name}</Label>
              <Input id="kite-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div>
              <Label htmlFor="kite-email">{c.email}</Label>
              <Input id="kite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00B4A0] hover:bg-[#008C7C] text-white font-semibold h-12 text-base"
            >
              {loading ? c.redirecting : c.cta(procedure.amountCharged, isOnline)}
            </Button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-600 hover:text-gray-900 py-1"
            >
              {c.back}
            </button>
            <p className="text-xs text-center text-gray-500">{c.secure}</p>
          </form>
        )}

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-2 text-sm font-medium rounded-md py-2 px-3 border border-[#25D366]/30 text-[#128C7E] hover:bg-[#25D366]/5 transition"
        >
          <svg viewBox="0 0 32 32" className="h-4 w-4 fill-[#25D366]" aria-hidden="true">
            <path d="M16.004 2.667A13.26 13.26 0 0 0 2.667 15.89a13.16 13.16 0 0 0 1.784 6.628L2.667 29.333l7.048-1.848A13.23 13.23 0 0 0 16.004 29.2 13.27 13.27 0 0 0 29.333 15.89 13.27 13.27 0 0 0 16.004 2.667Zm6.06 16.26c-.332-.167-1.965-.97-2.27-1.082-.306-.11-.528-.166-.75.167s-.862 1.08-1.056 1.302c-.195.222-.389.249-.722.083a9.1 9.1 0 0 1-2.682-1.655 10.07 10.07 0 0 1-1.855-2.312c-.194-.333-.02-.513.147-.678.15-.15.332-.389.5-.583.166-.195.222-.333.333-.555.111-.222.056-.416-.028-.583-.083-.166-.75-1.81-1.028-2.477-.271-.65-.546-.562-.75-.573l-.64-.011a1.226 1.226 0 0 0-.889.417c-.306.333-1.166 1.138-1.166 2.774s1.194 3.218 1.36 3.44c.167.222 2.35 3.59 5.696 5.034.796.344 1.417.55 1.902.703.799.254 1.526.218 2.101.132.641-.096 1.965-.803 2.243-1.578.278-.776.278-1.44.194-1.579-.083-.138-.305-.222-.638-.388Z" />
          </svg>
          {c.waHelp}
        </a>
      </DialogContent>
    </Dialog>
  );
}
