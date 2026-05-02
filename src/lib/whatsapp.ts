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
