// Shared SEO manifest. One source of truth for prerender + validation + sitemap.
// Keep these in sync with the Helmet/SEOHead values in the corresponding page components.

export const SITE = "https://salbcare.com";
export const DEFAULT_OG_IMAGE = `${SITE}/og-image.png`;

/**
 * Each route:
 *   path        — URL path served by react-router
 *   title       — <title> + og:title + twitter:title
 *   description — meta description + og:description + twitter:description
 *   canonical   — absolute URL written into <link rel="canonical">
 *   ogUrl       — absolute URL written into <meta property="og:url">
 *   ogImage     — absolute URL (defaults to DEFAULT_OG_IMAGE)
 *   locale      — og:locale (defaults to "pt_BR")
 *   htmlLang    — <html lang="..."> (defaults to "pt-BR")
 *   changefreq  — sitemap hint
 *   priority    — sitemap hint (0.0–1.0)
 */
export const ROUTES = [
  {
    path: "/",
    title: "SalbCare | Healthcare Without Borders",
    description:
      "SalbCare connects international travelers on Brazil's kite coast with trusted local health and wellness care. Book in minutes, care without borders.",
    canonical: `${SITE}/`,
    ogUrl: `${SITE}/`,
    locale: "en_US",
    htmlLang: "en",
    changefreq: "weekly",
    priority: "1.0",
  },
  {
    path: "/kite",
    title: "SalbCare Kite | Health and Wellness on Brazil's Kite Coast",
    description:
      "Visiting Ilha do Guajiru or the Ceara kite coast? Book trusted care with SalbCare Kite and reserve your session with a R$50 deposit.",
    canonical: `${SITE}/kite`,
    ogUrl: `${SITE}/kite`,
    locale: "en_US",
    htmlLang: "en",
    changefreq: "weekly",
    priority: "0.9",
  },
  {
    path: "/about",
    title: "Sobre a SalbCare | Saúde sem fronteiras",
    description:
      "Conheça a SalbCare: a plataforma que conecta profissionais de saúde brasileiros a pacientes locais e internacionais. Nossa missão, valores e equipe.",
    canonical: `${SITE}/about`,
    ogUrl: `${SITE}/about`,
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    path: "/contact",
    title: "Contato | SalbCare",
    description:
      "Fale com a equipe SalbCare por e-mail ou WhatsApp. Suporte para profissionais de saúde, pacientes e parceiros em todo o Brasil.",
    canonical: `${SITE}/contact`,
    ogUrl: `${SITE}/contact`,
    changefreq: "monthly",
    priority: "0.6",
  },
  {
    path: "/precos",
    title: "Planos e Preços | SalbCare",
    description:
      "Compare os planos Grátis e Essencial da SalbCare. Gerencie sua prática de saúde a partir de R$0/mês. Sem comissão sobre consultas.",
    canonical: `${SITE}/precos`,
    ogUrl: `${SITE}/precos`,
    changefreq: "weekly",
    priority: "0.9",
  },
  {
    path: "/pro",
    title: "SalbCare Pro | Plataforma para Profissionais de Saúde",
    description:
      "Agenda, prontuário, financeiro, teleconsulta e link de agendamento por WhatsApp em um só lugar. A plataforma completa para o profissional de saúde autônomo.",
    canonical: `${SITE}/pro`,
    ogUrl: `${SITE}/pro`,
    changefreq: "weekly",
    priority: "0.8",
  },
  {
    path: "/diagnostico",
    title: "Diagnóstico Financeiro Gratuito para Profissionais de Saúde | SalbCare",
    description:
      "Descubra em 2 minutos se você está pagando imposto correto. Gratuito, sem cadastro. Para médicos, psicólogos, nutricionistas e mais.",
    canonical: `${SITE}/diagnostico`,
    ogUrl: `${SITE}/diagnostico`,
    changefreq: "weekly",
    priority: "0.8",
  },
  {
    path: "/parcerias",
    title: "Parcerias para Farmácias e Laboratórios | SalbCare",
    description:
      "Conecte sua farmácia ou laboratório ao ecossistema SalbCare. Receba receitas digitais e pedidos de exame de médicos verificados. 60 dias grátis.",
    canonical: `${SITE}/parcerias`,
    ogUrl: `${SITE}/parcerias`,
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    path: "/journal",
    title: "Blog SalbCare | Conteúdo para Profissionais de Saúde",
    description:
      "Artigos sobre gestão de clínica, agenda médica, prontuário digital, teleconsulta, finanças e marketing para profissionais de saúde no Brasil.",
    canonical: `${SITE}/journal`,
    ogUrl: `${SITE}/journal`,
    changefreq: "daily",
    priority: "0.8",
  },
  {
    path: "/terms",
    title: "Termos de Uso | SalbCare",
    description:
      "Termos de uso da plataforma SalbCare para profissionais de saúde e pacientes. Direitos, deveres e regras de utilização do serviço.",
    canonical: `${SITE}/terms`,
    ogUrl: `${SITE}/terms`,
    changefreq: "yearly",
    priority: "0.3",
  },
  {
    path: "/privacy",
    title: "Política de Privacidade | SalbCare",
    description:
      "Política de privacidade da plataforma SalbCare. Saiba como protegemos seus dados pessoais e informações de saúde, em conformidade com a LGPD.",
    canonical: `${SITE}/privacy`,
    ogUrl: `${SITE}/privacy`,
    changefreq: "yearly",
    priority: "0.3",
  },
].map((r) => ({
  ogImage: DEFAULT_OG_IMAGE,
  locale: "pt_BR",
  htmlLang: "pt-BR",
  ...r,
}));
