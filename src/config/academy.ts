/**
 * Catálogo da SalbCare Academy (produtos educacionais).
 * Fonte única usada pelas páginas /academy e /academy/:slug.
 * A Academy é uma loja de produtos digitais próprios, não um marketplace.
 * A compra é feita sem criar conta: e-mail e pagamento no Stripe Checkout.
 */
export type AcademyFormat = "apostila" | "ebook" | "curso" | "template" | "checklist" | "bundle";

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
    price: "R$ 29,90",
    summary:
      "Um material de consulta rápida para conduzir o atendimento em inglês, do primeiro contato à orientação final.",
    description: [
      "Não é um curso tradicional de inglês. É um material de trabalho, feito para ficar aberto ao lado da agenda e ser usado durante o atendimento.",
      "Cada bloco traz a frase pronta em inglês, a tradução e a situação em que ela é usada, na ordem real da consulta: recepção, anamnese, exame, procedimento, orientações e retorno.",
    ],
    contents: [
      "Roteiro completo da consulta em inglês, etapa por etapa",
      "Perguntas de anamnese, alergias e medicação em uso",
      "Vocabulário de dor, sintomas e região do corpo",
      "Comandos curtos para conduzir o exame físico",
      "Frases de valor, forma de pagamento e recibo para seguro viagem",
      "Acesso às categorias pagas do Quick Card em português e inglês",
    ],
    audience: "Dentistas, fisioterapeutas e outros profissionais de saúde que atendem ou querem atender estrangeiros.",
  },
  {
    slug: "espanhol-para-atendimento-em-saude",
    title: "Espanhol para Atendimento em Saúde",
    format: "apostila",
    formatLabel: "Apostila prática em PDF",
    status: "available",
    statusLabel: "Disponível",
    price: "R$ 29,90",
    summary:
      "As mesmas situações de atendimento, agora em espanhol, para receber pacientes da América Latina e da Espanha.",
    description: [
      "Material de trabalho, não curso de idioma. A frase pronta em espanhol, a tradução em português e o momento certo de usar.",
      "Segue a ordem real da consulta, da recepção à orientação final e ao retorno.",
    ],
    contents: [
      "Roteiro completo da consulta em espanhol, etapa por etapa",
      "Perguntas de anamnese, alergias e medicação em uso",
      "Vocabulário de dor, sintomas e região do corpo",
      "Comandos curtos para conduzir o exame físico",
      "Frases de valor, forma de pagamento e recibo para seguro",
      "Acesso às categorias pagas do Quick Card em português e espanhol",
    ],
    audience: "Profissionais de saúde que atendem pacientes hispanofalantes, no consultório ou em viagem.",
  },
  {
    slug: "international-healthcare-kit",
    title: "International Healthcare Kit",
    format: "bundle",
    formatLabel: "Pacote com as duas apostilas",
    status: "available",
    statusLabel: "Melhor escolha",
    price: "R$ 49,90",
    summary:
      "As duas apostilas juntas e o Quick Card completo em português, inglês e espanhol, com o seletor de idioma liberado.",
    description: [
      "O pacote reúne Inglês e Espanhol para Atendimento em Saúde, com desconto em relação à compra separada.",
      "Libera todas as categorias do Quick Card nos três idiomas, com troca de idioma durante o atendimento.",
    ],
    contents: [
      "Apostila de Inglês para Atendimento em Saúde em PDF",
      "Apostila de Espanhol para Atendimento em Saúde em PDF",
      "Quick Card completo em português, inglês e espanhol",
      "Seletor de idioma ativo nas cinco categorias",
      "Vocabulário de apoio de cada categoria",
      "Acesso pelo link do e-mail, em qualquer aparelho",
    ],
    audience: "Quem atende turistas e pacientes internacionais e não quer escolher entre um idioma e outro.",
  },
  {
    slug: "pacote-completo",
    title: "Pacote Completo",
    format: "bundle",
    formatLabel: "Apostilas 2 a 6, conforme publicadas",
    status: "soon",
    statusLabel: "Em breve",
    summary:
      "Todas as próximas apostilas da Academy em um só acesso, liberadas conforme cada material é publicado.",
    description: [
      "Reúne as apostilas 2 a 6 da SalbCare Academy, com acesso liberado a cada novo material publicado.",
      "O preço aparece aqui assim que o pacote entra no ar.",
    ],
    contents: [
      "Acesso às apostilas 2 a 6, conforme publicadas",
      "Quick Card completo nos idiomas cobertos",
      "Atualizações incluídas, sem cobrança extra",
    ],
    audience: "Quem quer acompanhar toda a trilha da Academy sem comprar material por material.",
  },
];

export const getAcademyProduct = (slug?: string) => ACADEMY_PRODUCTS.find((p) => p.slug === slug);

/** Contato oficial para dúvidas dos materiais. */
export const ACADEMY_WHATSAPP = "5588996924700";

export const academyWhatsAppLink = (title: string) =>
  `https://wa.me/${ACADEMY_WHATSAPP}?text=${encodeURIComponent(
    `Olá! Quero o material da SalbCare Academy: ${title}.`,
  )}`;
