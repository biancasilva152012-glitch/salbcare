import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  /** Single JSON-LD object OR array of multiple schemas (e.g. BlogPosting + FAQPage). */
  jsonLd?: Record<string, any> | Record<string, any>[];
  /** SEO keywords (5-8 recommended). Comma-separated string OR array. */
  keywords?: string | string[];
  noindex?: boolean;
  /** ISO date for article published. Renders article:published_time meta. */
  publishedTime?: string;
  /** ISO date for article updated. Renders article:modified_time meta. */
  modifiedTime?: string;
}

const SITE_URL = "https://salbcare.com.br";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const SEOHead = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  jsonLd,
  keywords,
  noindex = false,
  publishedTime,
  modifiedTime,
}: SEOHeadProps) => {
  const fullTitle = title.includes("SalbCare") ? title : `${title} | SalbCare`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;
  const image = ogImage || DEFAULT_OG_IMAGE;
  const keywordsContent = Array.isArray(keywords) ? keywords.join(", ") : keywords;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywordsContent && <meta name="keywords" content={keywordsContent} />}
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content="SalbCare" />
      <meta property="og:locale" content="pt_BR" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD (one <script> per schema) */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
