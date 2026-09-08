/**
 * Catálogo da SalbCare Academy (produtos educacionais).
 * Fonte única usada pelas páginas /academy e /academy/:slug.
 * A Academy é uma loja de produtos digitais próprios, não um marketplace.
 */
export type AcademyFormat = "apostila" | "ebook" | "curso" | "template" | "checklist";

export interface AcademyProduct {
  slug: string;
  title: string;
  format: AcademyFormat;
  formatLabel: string;
  status: "available" | "soon";
  statusLabel: string;
  price?: string;
  summary: string;
  description: string[];
  contents: string[];
  audience: string;
}

export const ACADEMY_PRODUCTS: AcademyProduct[] = [
  {
    slug: "ingles-para-atendimento-em-saude",
    title: "Inglês para Atendimento em Saúde",
    format: "apostila",
    formatLabel: "Apostila prática em PDF",
    status: "available",
    statusLabel: "Disponível",
    summary:
      "Um material de consulta rápida para conduzir o atendimento em inglês, do primeiro contato à orientação final.",
    description: [
      "Não é um curso tradicional de inglês. É um material de trabalho, feito para ficar aberto ao lado da agenda e ser usado durante o atendimento.",
      "Cada bloco traz a frase pronta em inglês, a tradução e a situação em que ela é usada, na ordem real da consulta: recepção, anamnese, exame, procedimento, orientações e retorno.",
    ],
    contents: [
      "Roteiro completo da consulta em inglês, etapa por etapa",
      "Perguntas de anamnese e histórico com respostas mais comuns do paciente",
      "Vocabulário de sintomas, dor, região do corpo e medicação",
      "Frases para explicar procedimento, valor e forma de pagamento",
      "Mensagens prontas de confirmação, remarcação e orientação pós-atendimento",
      "Glossário de termos clínicos em português, inglês e espanhol",
    ],
    audience: "Dentistas, fisioterapeutas e outros profissionais de saúde que atendem ou querem atender estrangeiros.",
  },
  {
    slug: "templates-de-consultorio",
    title: "Templates de Consultório",
    format: "template",
    formatLabel: "Pacote de modelos editáveis",
    status: "soon",
    statusLabel: "Em preparação",
    summary: "Modelos de anamnese, orientações e mensagens ao paciente prontos para adaptar ao seu consultório.",
    description: [
      "Um pacote de documentos e mensagens que todo consultório precisa e quase ninguém tem pronto.",
    ],
    contents: [
      "Fichas de anamnese por especialidade",
      "Termos de orientação e consentimento",
      "Mensagens de confirmação e cobrança",
    ],
    audience: "Profissionais autônomos que cuidam sozinhos da rotina administrativa.",
  },
  {
    slug: "checklists-de-gestao",
    title: "Checklists de Gestão",
    format: "checklist",
    formatLabel: "Checklists em PDF",
    status: "soon",
    statusLabel: "Em preparação",
    summary: "Rotinas curtas de agenda, cobrança e fechamento financeiro para manter o consultório em ordem.",
    description: ["Rotinas simples, do dia, da semana e do fechamento do mês, em uma página cada."],
    contents: ["Rotina diária de agenda", "Rotina semanal de cobrança", "Fechamento financeiro do mês"],
    audience: "Quem quer organizar a gestão sem contratar equipe administrativa.",
  },
];

export const getAcademyProduct = (slug?: string) =>
  ACADEMY_PRODUCTS.find((p) => p.slug === slug);

/** Contato oficial para compra e dúvidas dos materiais. */
export const ACADEMY_WHATSAPP = "5588996924700";

export const academyWhatsAppLink = (title: string) =>
  `https://wa.me/${ACADEMY_WHATSAPP}?text=${encodeURIComponent(
    `Olá! Quero o material da SalbCare Academy: ${title}.`,
  )}`;
