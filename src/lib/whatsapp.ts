// Helper central de WhatsApp — número, mensagem padrão e link wa.me.
// Mantém um único texto inicial em TODOS os CTAs (FAB, hero, rodapé, seções, formulário).

export const WHATSAPP_NUMBER = "5588996924700";
export const WHATSAPP_DISPLAY = "+55 88 99692-4700";

// Mensagem padrão exigida pela equipe (mesma em todos os CTAs).
export const DEFAULT_WHATSAPP_MESSAGE =
  "Olá Bianca! Vim pela SalbCare e gostaria de agendar uma demonstração da plataforma";

export const buildWhatsAppUrl = (message: string = DEFAULT_WHATSAPP_MESSAGE) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

// Fallback universal (caso wa.me não abra): usa o esquema whatsapp:// nativo.
export const buildWhatsAppAppUrl = (message: string = DEFAULT_WHATSAPP_MESSAGE) =>
  `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;

// ───────────────────────────────────────────────────────────────────────────
// Template ÚNICO para mensagem personalizada do lead (formulário de demo).
// Usar SEMPRE este builder para evitar variações de texto e truncamento.
// Limite total ~600 caracteres (wa.me suporta mais, mas alguns clientes
// truncam acima disso e a URL final fica enorme após encode).
// ───────────────────────────────────────────────────────────────────────────
export const LEAD_MESSAGE_MAX_CHARS = 600;
const FIELD_MAX = 140; // por campo, antes da montagem final

const truncate = (s: string, max = FIELD_MAX) => {
  const clean = (s || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

export interface LeadWhatsAppPayload {
  nome: string;
  email: string;
  whatsapp: string;
  dor: string;
}

export const buildLeadWhatsAppMessage = (lead: LeadWhatsAppPayload): string => {
  const nome = truncate(lead.nome, 80);
  const email = truncate(lead.email, 120);
  const whatsapp = truncate(lead.whatsapp, 24);
  const dor = truncate(lead.dor, 260);

  let msg =
    `${DEFAULT_WHATSAPP_MESSAGE}.\n\n` +
    `Nome: ${nome}\n` +
    `E-mail: ${email}\n` +
    `WhatsApp: ${whatsapp}\n` +
    `Principal dor: ${dor}`;

  if (msg.length > LEAD_MESSAGE_MAX_CHARS) {
    msg = `${msg.slice(0, LEAD_MESSAGE_MAX_CHARS - 1)}…`;
  }
  return msg;
};
