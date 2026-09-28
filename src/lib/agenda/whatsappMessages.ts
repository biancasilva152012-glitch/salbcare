import { format, parse } from "date-fns";

export type PatientMessageKind = "confirmacao" | "lembrete" | "remarcacao";
type Ctx = { patient: string; date: string; time: string; professional: string; online: boolean };

const firstName = (n: string) => (n || "").trim().split(" ")[0];

export function patientMessage(kind: PatientMessageKind, c: Ctx) {
  const d = format(parse(c.date, "yyyy-MM-dd", new Date()), "dd/MM");
  const t = c.time.slice(0, 5);
  const where = c.online ? "online" : "no consultório";
  const who = c.professional ? ` com ${c.professional}` : "";
  if (kind === "confirmacao")
    return `Olá, ${firstName(c.patient)}! 😊 Sua consulta${who} está marcada para ${d} às ${t}, ${where}. Pode confirmar sua presença respondendo SIM?`;
  if (kind === "lembrete")
    return `Olá, ${firstName(c.patient)}! ⏰ Passando para lembrar da sua consulta${who} em ${d} às ${t}, ${where}. Até lá!`;
  return `Olá, ${firstName(c.patient)}! Precisamos remarcar sua consulta de ${d} às ${t}. Qual dia e horário ficam melhores para você? 🙏`;
}

/** wa.me com o número do paciente (DDI 55 se vier só com DDD). Sem número, abre o WhatsApp para escolher o contato. */
export function buildPatientWhatsAppUrl(phone: string | null | undefined, text: string) {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits && digits.length <= 11) digits = `55${digits}`;
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
}
