/**
 * Builds a Schema.org BlogPosting JSON-LD object for a blog post.
 * Centralised so all posts share the same publisher/author shape and
 * we can boost SEO uniformly (rich-result eligibility on Google).
 */
export interface BlogPostingSchemaInput {
  slug: string;
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  category?: string;
  keywords?: string[];
}

export const SITE_URL = "https://salbcare.com.br";

export function buildBlogPostingSchema(input: BlogPostingSchemaInput) {
  const url = `${SITE_URL}/blog/${input.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.headline,
    description: input.description,
    image: input.image.startsWith("http") ? input.image : `${SITE_URL}${input.image}`,
    author: { "@type": "Organization", name: "SalbCare", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "SalbCare",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png` },
    },
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    articleSection: input.category,
    keywords: input.keywords?.join(", "),
    inLanguage: "pt-BR",
  };
}

export function buildBreadcrumbSchema(articleTitle: string, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: articleTitle, item: `${SITE_URL}/blog/${slug}` },
    ],
  };
}
