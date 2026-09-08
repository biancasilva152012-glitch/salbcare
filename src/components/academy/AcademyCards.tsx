import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MONO, TEAL } from "@/components/pro/brand";
import { useAcademyCatalog } from "@/hooks/useAcademyCatalog";
import { useAcademyPrices } from "@/hooks/useAcademyPrices";
import { toast } from "@/hooks/use-toast";

const CARD_STYLES = `
  .academy-buy {
    display: inline-flex; align-items: center; justify-content: center;
    min-height: 44px; padding: 12px 20px; margin-top: 16px; border-radius: 999px;
    border: 1px solid rgba(31,31,31,0.2); background: ${TEAL}; color: #0F1F3A;
    font-family: ${MONO}; font-size: 12px; letter-spacing: 0.06em; cursor: pointer;
  }
  .academy-buy[disabled] { opacity: 0.45; cursor: not-allowed; background: transparent; color: inherit; }
  .academy-badge { font-family: ${MONO}; font-size: 11px; letter-spacing: 0.08em; opacity: 0.75; }
`;

/** Cartões da Academy com preço e price_id vindos do Stripe. */
export const AcademyCardGrid = ({ className = "academy-grid" }: { className?: string }) => {
  const { products } = useAcademyCatalog();
  const { prices, isLoading } = useAcademyPrices();
  const [busy, setBusy] = useState<string | null>(null);

  const buy = async (slug: string) => {
    setBusy(slug);
    try {
      const { data, error } = await supabase.functions.invoke("academy-checkout", { body: { slug } });
      if (error || !data?.url) throw new Error("checkout");
      window.location.href = data.url as string;
    } catch {
      toast({ title: "Não foi possível abrir o pagamento", description: "Tente novamente em instantes." });
      setBusy(null);
    }
  };

  return (
    <>
      <style>{CARD_STYLES}</style>
      <div className={className}>
        {products.map((p) => {
          const remote = prices[p.slug];
          const soon = remote ? !remote.available : p.status === "soon";
          const price = remote?.price ?? (isLoading ? null : p.price ?? null);
          const badge = soon ? "Em breve" : p.slug === "international-healthcare-kit" ? "Mais completo" : p.statusLabel;

          return (
            <div key={p.slug} className="pro-card">
              <BookOpen size={20} strokeWidth={1.5} color={TEAL} aria-hidden />
              <p className="academy-badge" style={{ margin: "12px 0 0" }}>
                {badge} · {price ?? "Consulte o preço"}
              </p>
              <h3
                style={{ fontFamily: MONO, fontSize: 13, letterSpacing: "0.04em", margin: "10px 0 0", fontWeight: 500 }}
              >
                {p.title}
              </h3>
              <p className="pro-body" style={{ margin: "8px 0 0" }}>
                {p.summary}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <button
                  type="button"
                  className="academy-buy"
                  disabled={soon || busy === p.slug}
                  onClick={() => buy(p.slug)}
                >
                  {busy === p.slug ? "Abrindo pagamento" : soon ? "Em breve" : "Comprar agora"}
                </button>
                <Link to={`/academy/${p.slug}`} className="pro-mono" style={{ marginTop: 16 }}>
                  Ver detalhes
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default AcademyCardGrid;
