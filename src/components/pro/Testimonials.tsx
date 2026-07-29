import { CREAM, GOLD, ProLabel } from "@/components/pro/brand";

/** Enquanto false, a seção não é renderizada. Ligar só com depoimentos reais. */
export const SHOW_TESTIMONIALS = false;

const ITEMS = [
  {
    quote: "[PLACEHOLDER FICTICIO, SUBSTITUIR POR DEPOIMENTO REAL]",
    author: "[PLACEHOLDER FICTICIO, SUBSTITUIR POR DEPOIMENTO REAL]",
  },
  {
    quote: "[PLACEHOLDER FICTICIO, SUBSTITUIR POR DEPOIMENTO REAL]",
    author: "[PLACEHOLDER FICTICIO, SUBSTITUIR POR DEPOIMENTO REAL]",
  },
  {
    quote: "[PLACEHOLDER FICTICIO, SUBSTITUIR POR DEPOIMENTO REAL]",
    author: "[PLACEHOLDER FICTICIO, SUBSTITUIR POR DEPOIMENTO REAL]",
  },
];

const Testimonials = () => {
  if (!SHOW_TESTIMONIALS) return null;

  return (
    <section className="pro-wrap" style={{ paddingBottom: 64 }}>
      <ProLabel>Quem ja usa</ProLabel>
      <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
        {ITEMS.map((t, i) => (
          <blockquote key={i} className="pro-card" style={{ margin: 0, color: CREAM }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{t.quote}</p>
            <footer style={{ marginTop: 10, fontSize: 12, color: GOLD }}>{t.author}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
