import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    onlineBadge: "Full payment now · Meet link sent after confirmation",
    partial: (paid: number, rest: number) => `R$ ${paid} now + pay R$ ${rest} at the clinic`,
    name: "Full name",
    email: "Email",
    date: "Preferred date",
    timeLabel: "Preferred time",
    times: { morning: "morning", afternoon: "afternoon", any: "any" } as Record<string, string>,
    notes: "Anything we should know? (optional)",
    notesPh: "Injury, preferred language, etc.",
    cta: (n: number, online: boolean) => online ? `Pay R$ ${n} →` : `Pay R$ ${n} booking fee →`,
    redirecting: "Redirecting…",
    secure: "Secure payment via Stripe · International cards accepted",
    missing: "Please fill in your name and email",
    err: "Could not start checkout",
  },
  es: {
    onlineBadge: "Pago completo ahora · Enlace de Meet enviado tras confirmación",
    partial: (paid: number, rest: number) => `R$ ${paid} ahora + paga R$ ${rest} en la clínica`,
    name: "Nombre completo",
    email: "Correo electrónico",
    date: "Fecha preferida",
    timeLabel: "Horario preferido",
    times: { morning: "mañana", afternoon: "tarde", any: "cualquiera" } as Record<string, string>,
    notes: "¿Algo que debamos saber? (opcional)",
    notesPh: "Lesión, idioma preferido, etc.",
    cta: (n: number, online: boolean) => online ? `Pagar R$ ${n} →` : `Pagar R$ ${n} de reserva →`,
    redirecting: "Redirigiendo…",
    secure: "Pago seguro vía Stripe · Tarjetas internacionales aceptadas",
    missing: "Por favor completa tu nombre y correo",
    err: "No se pudo iniciar el checkout",
  },
};

export default function KiteBookingModal({ open, onOpenChange, procedure, lang = "en" }: Props) {
  const c = COPY[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Please fill in your name and email");
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
          notes,
          pousada_ref,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("Checkout URL not returned");
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err?.message || "Could not start checkout");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl text-[#1a1612]">
            {procedure.label}
          </DialogTitle>
          <DialogDescription className="text-[#5a564f]">
            {isOnline ? (
              <span className="inline-block mt-2 px-2 py-1 rounded bg-[#2c6e49]/10 text-[#2c6e49] text-xs font-semibold">
                Full payment now · Meet link sent after confirmation
              </span>
            ) : (
              <span className="inline-block mt-2 px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-semibold">
                R$ {procedure.amountCharged} now + pay R$ {procedure.totalPrice - procedure.amountCharged} at the clinic
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="kite-name">Full name</Label>
            <Input id="kite-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="kite-email">Email</Label>
            <Input id="kite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="kite-date">Preferred date</Label>
            <Input id="kite-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Preferred time</Label>
            <div className="flex gap-2 mt-1">
              {(["morning", "afternoon", "any"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimePref(t)}
                  className={`flex-1 px-3 py-2 rounded-md border text-sm capitalize transition ${
                    timePref === t
                      ? "border-[#2c6e49] bg-[#2c6e49]/10 text-[#2c6e49] font-semibold"
                      : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="kite-notes">Anything we should know? (optional)</Label>
            <Textarea
              id="kite-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Injury, preferred language, etc."
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2c6e49] hover:bg-[#1a3a2a] text-white font-semibold h-12 text-base"
          >
            {loading ? "Redirecting…" : ctaLabel}
          </Button>
          <p className="text-xs text-center text-gray-500">
            Secure payment via Stripe · International cards accepted
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
