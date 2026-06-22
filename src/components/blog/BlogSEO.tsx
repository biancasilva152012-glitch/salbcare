import { Helmet } from "react-helmet-async";
import type { BlogLang } from "@/lib/blog/types";

const SITE_URL = "https://salbcare.com";

interface JsonLd {
  [k: string]: any;
}

interface BlogSEOProps {
  title: string;
  description?: string;
  canonicalPath: string;
  lang: BlogLang;
  ogImage?: string | null;
  ogType?: "website" | "article";
  /** Slugged path (without /en|/pt|/es) used to build hreflang triplet. */
  hreflangPath?: string;
  jsonLd?: JsonLd | JsonLd[];
  noindex?: boolean;
}

export default function BlogSEO({
  title,
  description,
  canonicalPath,
  lang,
  ogImage,
  ogType = "website",
  hreflangPath,
  jsonLd,
  noindex,
}: BlogSEOProps) {
  const fullTitle = title.endsWith("SalbCare Journal") ? title : `${title} | SalbCare Journal`;
  const url = `${SITE_URL}${canonicalPath}`;
  const htmlLang = lang;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  const hreflangs = hreflangPath
    ? [
        { code: "en", path: hreflangPath },
        { code: "pt", path: `/pt${hreflangPath}` },
        { code: "es", path: `/es${hreflangPath}` },
        { code: "x-default", path: hreflangPath },
      ]
    : null;

  return (
    <Helmet>
      <html lang={htmlLang} />
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex, follow" />}
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="SalbCare Journal" />
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@salbcare" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {hreflangs?.map((h) => (
        <link
          key={h.code}
          rel="alternate"
          hrefLang={h.code}
          href={`${SITE_URL}${h.path}`}
        />
      ))}

      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
}

export { SITE_URL };
