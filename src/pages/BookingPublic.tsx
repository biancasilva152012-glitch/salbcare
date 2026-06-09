import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageSkeleton from "@/components/PageSkeleton";
import { MessageCircle } from "lucide-react";

const professionalLabels: Record<string, string> = {
  medico: "Médico(a)",
  psicologo: "Psicólogo(a)",
  nutricionista: "Nutricionista",
  fisioterapeuta: "Fisioterapeuta",
  fonoaudiologo: "Fonoaudiólogo(a)",
  dentista: "Cirurgião(ã)-Dentista",
  outro: "Profissional de Saúde",
};

const DR_TYPES = new Set(["medico", "dentista"]);
const isFeminineName = (name: string) => {
  const first = name.split(" ")[0]?.toLowerCase() || "";
  return first.endsWith("a") || first.endsWith("e");
};
const displayName = (name: string, type: string) => {
  if (!DR_TYPES.has(type)) return name;
  const lower = name.toLowerCase();
  if (lower.startsWith("dr.") || lower.startsWith("dra.")) return name;
  return `${isFeminineName(name) ? "Dra." : "Dr."} ${name}`;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const BookingPublic = () => {
  const { token } = useParams<{ token: string }>();
  const [patientName, setPatientName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["booking-profile", token],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_public_profile_by_slug", { _slug: token! });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!token,
  });

  const specialtyLabel = profile ? (professionalLabels[profile.professional_type] || profile.professional_type) : "";

  const slots = useMemo(() => {
    const out: string[] = [];
    for (let h = 8; h <= 19; h++) {
      out.push(`${String(h).padStart(2, "0")}:00`);
      out.push(`${String(h).padStart(2, "0")}:30`);
    }
    return out;
  }, []);

  const handleConfirm = () => {
    setError(null);
    if (!patientName.trim()) { setError("Informe seu nome."); return; }
    if (!date) { setError("Escolha uma data."); return; }
    if (!time) { setError("Escolha um horário."); return; }
    if (date < todayIso()) { setError("Data inválida. Escolha hoje ou uma data futura."); return; }
    if (!profile?.phone) { setError("Este profissional não disponibilizou contato. Tente novamente mais tarde."); return; }

    const phone = profile.phone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const [y, m, d] = date.split("-");
    const dateLabel = `${d}/${m}/${y}`;
    const msg = `Olá ${displayName(profile.name, profile.professional_type)}! Quero agendar uma consulta.\n\nNome: ${patientName.trim()}\nData: ${dateLabel}\nHorário: ${time}\n\nPosso confirmar?`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background p-6"><PageSkeleton variant="list" /></div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Link de agendamento inválido</h1>
          <p className="text-muted-foreground">Peça um novo link ao profissional.</p>
          <Button asChild><Link to="/">Voltar ao início</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`Agendar com ${profile.name} | SalbCare`}
        description={`Agende sua consulta com ${profile.name}.`}
        canonical={`/agendar/${token}`}
        noindex
      />
      <div className="min-h-screen bg-background font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="mx-auto max-w-md px-4 py-12">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Agendamento</p>
            <h1 className="text-2xl font-bold">{displayName(profile.name, profile.professional_type)}</h1>
            <p className="text-sm text-muted-foreground">{specialtyLabel}</p>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <Label htmlFor="patient-name">Seu nome</Label>
              <Input id="patient-name" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Como podemos te chamar?" />
            </div>
            <div>
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="time">Horário</Label>
              <select
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Escolha um horário</option>
                {slots.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">{error}</p>
            )}

            <Button size="lg" className="w-full py-6 rounded-xl font-bold text-base gap-2" onClick={handleConfirm}>
              <MessageCircle className="h-5 w-5" /> Confirmar agendamento
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Ao confirmar, abrimos o WhatsApp do profissional para você finalizar o agendamento. A SalbCare não cobra comissão.
            </p>
          </div>

          <div className="mt-12 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Powered by SalbCare
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingPublic;
