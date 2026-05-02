import { Helmet } from "react-helmet-async";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  /** Section title shown above the FAQ list. */
  title?: string;
  items: FAQItem[];
  /** Whether to also emit the FAQPage JSON-LD. Defaults to true. */
  emitSchema?: boolean;
}

/**
 * Reusable FAQ block with semantic HTML (<details>) and Schema.org FAQPage
 * structured data. Drop into any blog post or pillar page to boost SEO with
 * rich-result eligibility on Google.
 */
const FAQSection = ({ title = "Perguntas frequentes", items, emitSchema = true }: FAQSectionProps) => {
  if (!items.length) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.answer,
      },
    })),
  };

  return (
    <section aria-label={title} className="not-prose space-y-3">
      {emitSchema && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(schema)}</script>
        </Helmet>
      )}
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-2">
        {items.map((it, i) => (
          <details
            key={i}
            className="group rounded-lg border border-border/40 bg-card/60 p-4 open:border-primary/30"
          >
            <summary className="cursor-pointer list-none font-medium text-foreground flex items-start justify-between gap-3">
              <span>{it.question}</span>
              <span className="text-primary text-xl leading-none transition-transform group-open:rotate-45 select-none">+</span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{it.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
};

export default FAQSection;
