import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, MessageCircle, Clock, User, Mail, Calendar, Tag, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

type Booking = {
  id: string;
  type: string;
  procedure: string;
  patient_name: string;
  email: string;
  preferred_date: string | null;
  time_preference: string | null;
  status: string;
  amount_paid: number;
  remaining_balance: number;
  notes: string | null;
  created_at: string;
};

type Event = {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
};

function statusBadge(s: string) {
  const tone =
    s === "confirmado" || s === "paid"
      ? "bg-emerald-500/15 text-emerald-300"
      : s === "erro" || s === "cancelled"
      ? "bg-red-500/15 text-red-300"
      : s === "pending_whatsapp"
      ? "bg-blue-500/15 text-blue-300"
      : "bg-amber-500/15 text-amber-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${tone}`}>
      {s}
    </span>
  );
}

export default function AdminKiteBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [resending, setResending] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["admin-kite-booking", id],
    queryFn: async (): Promise<Booking | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("kite_bookings")
        .select("id,type,procedure,patient_name,email,preferred_date,time_preference,status,amount_paid,remaining_balance,notes,created_at")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Booking | null;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["admin-kite-booking-events", id],
    queryFn: async (): Promise<Event[]> => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("kite_booking_events")
        .select("id,event_type,from_status,to_status,note,created_at")
        .eq("booking_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Event[];
    },
  });

  const waUrl = useMemo(() => {
    if (!booking) return "";
    const lines = [
      "Olá! Estou retomando esta reserva no Kite.",
      `Paciente: ${booking.patient_name}`,
      booking.email ? `Email: ${booking.email}` : "",
      `Serviço: ${booking.procedure}`,
      booking.preferred_date ? `Data: ${booking.preferred_date}` : "",
      booking.time_preference ? `Horário: ${booking.time_preference}` : "",
      `Ref: ${booking.id.slice(0, 8)}`,
    ].filter(Boolean);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [booking]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/kite-bookings")}
          className="text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          </div>
        ) : !booking ? (
          <div className="rounded-xl border border-white/[0.06] bg-[hsl(220,20%,10%)] p-8 text-center text-white/40 text-sm">
            Reserva não encontrada.
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Patient & booking info */}
            <div className="lg:col-span-2 space-y-5">
              <div className="rounded-xl border border-white/[0.06] bg-[hsl(220,20%,10%)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-white/40">Reserva</p>
                    <h1 className="text-xl font-bold text-white mt-1">{booking.patient_name}</h1>
                    <p className="text-xs text-white/40 mt-1 font-mono">{booking.id}</p>
                  </div>
                  {statusBadge(booking.status)}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-5 text-sm">
                  <Info icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={booking.email || "—"} />
                  <Info icon={<Tag className="h-3.5 w-3.5" />} label="Serviço" value={`${booking.procedure} (${booking.type})`} />
                  <Info icon={<Calendar className="h-3.5 w-3.5" />} label="Data preferida" value={booking.preferred_date || "—"} />
                  <Info icon={<Clock className="h-3.5 w-3.5" />} label="Horário preferido" value={booking.time_preference || "—"} />
                  <Info icon={<User className="h-3.5 w-3.5" />} label="Criada em" value={new Date(booking.created_at).toLocaleString("pt-BR")} />
                  <Info icon={<Tag className="h-3.5 w-3.5" />} label="Saldo" value={`Pago R$ ${booking.amount_paid} / Restante R$ ${booking.remaining_balance}`} />
                </div>

                {booking.notes && (
                  <div className="mt-5">
                    <p className="text-[10px] uppercase tracking-wide text-white/40">Observações</p>
                    <p className="text-sm text-white/70 mt-1 whitespace-pre-wrap">{booking.notes}</p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
                  >
                    <MessageCircle className="h-4 w-4" /> Abrir WhatsApp do paciente
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={resending}
                    onClick={async () => {
                      if (!booking) return;
                      setResending(true);
                      try {
                        const { error } = await supabase.functions.invoke("kite-whatsapp-booking", {
                          body: { retry_booking_id: booking.id, attempt: 1 },
                        });
                        if (error) throw error;
                        await supabase.from("kite_booking_events").insert({
                          booking_id: booking.id,
                          event_type: "manual_resend",
                          note: `Admin acionou reenvio manual em ${new Date().toISOString()}`,
                        });
                        toast({ title: "Reenvio registrado", description: "Abrindo WhatsApp…" });
                        window.open(waUrl, "_blank", "noopener,noreferrer");
                        qc.invalidateQueries({ queryKey: ["admin-kite-booking-events", booking.id] });
                        qc.invalidateQueries({ queryKey: ["admin-kite-booking", booking.id] });
                      } catch (err: any) {
                        toast({ title: "Falha ao reenviar", description: err.message, variant: "destructive" });
                      } finally {
                        setResending(false);
                      }
                    }}
                    className="border-white/10 text-white/80 hover:bg-white/5 h-10"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1.5 ${resending ? "animate-spin" : ""}`} /> Reenviar WhatsApp
                  </Button>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-white/[0.06] bg-[hsl(220,20%,10%)] p-5">
              <h2 className="text-sm font-semibold text-white">Timeline</h2>
              <p className="text-[11px] text-white/40 mt-0.5">Criação, mudanças de status e tentativas.</p>

              <ol className="mt-4 relative border-l border-white/10 pl-4 space-y-4">
                {(events || []).length === 0 && (
                  <li className="text-xs text-white/40">Sem eventos ainda.</li>
                )}
                {(events || []).map((ev) => (
                  <li key={ev.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-400 ring-4 ring-[hsl(220,20%,10%)]" />
                    <div className="text-xs text-white/80 font-semibold capitalize">
                      {ev.event_type.replace(/_/g, " ")}
                    </div>
                    {ev.event_type === "status_change" && (
                      <div className="text-[11px] text-white/50 mt-0.5">
                        {ev.from_status || "—"} → <span className="text-white/80">{ev.to_status}</span>
                      </div>
                    )}
                    {ev.note && <div className="text-[11px] text-white/50 mt-0.5">{ev.note}</div>}
                    <div className="text-[10px] text-white/30 mt-1">
                      {new Date(ev.created_at).toLocaleString("pt-BR")}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-white/40 inline-flex items-center gap-1.5">
        {icon} {label}
      </p>
      <p className="text-sm text-white/80 mt-0.5 break-words">{value}</p>
    </div>
  );
}
