// Shared SEO manifest. One source of truth for prerender + validation + sitemap.
// Keep these in sync with the Helmet/SEOHead values in the corresponding page components.

export const SITE = "https://salbcare.com";

export const ROUTES = [
  {
    path: "/",
    title: "SalbCare | Healthcare Without Borders",
    description:
      "SalbCare connects international travelers on Brazil's kite coast with trusted local health and wellness care. Book in minutes, care without borders.",
    canonical: `${SITE}/`,
    ogUrl: `${SITE}/`,
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
    changefreq: "weekly",
    priority: "0.9",
  },
];
