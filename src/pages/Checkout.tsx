import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, PlanKey } from "@/config/plans";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trackCheckoutStart } from "@/hooks/useTracking";

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planKey = (searchParams.get("plan") || "basic") as PlanKey;
  const periodParam = searchParams.get("period");
  const plan = PLANS[planKey] || PLANS.basic;
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [annual, setAnnual] = useState(periodParam === "annual");

  const priceId = annual ? plan.annual_price_id : plan.price_id;
  const displayPrice = annual ? plan.annualPrice : plan.price;
  const periodLabel = annual ? "ano" : "mês";

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Faça login para continuar.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        trackCheckoutStart(plan.name, displayPrice);
        sessionStorage.setItem("salbcare_from_checkout", "true");
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (err) {
      console.error("[Checkout] Erro:", err);
      toast.error("Erro ao iniciar o pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6">
          <h1 className="text-xl font-bold">Assinar {plan.name}</h1>

          {/* Period toggle */}
          <div className="flex justify-center mt-4 mb-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted/50 p-1 border border-border/40">
              <button
                onClick={() => setAnnual(false)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${!annual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${annual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Anual (-22%)
              </button>
            </div>
          </div>

          <p className="text-2xl font-bold text-primary mt-1">
            R$ {displayPrice}
            <span className="text-sm text-muted-foreground font-normal">/{annual ? "mês" : "mês"}</span>
          </p>
          {annual && (
            <p className="text-xs text-primary font-semibold mt-1">
              R$ 828/ano • Economia de R$ 240
            </p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">O que está incluso:</h3>
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className={`flex items-start gap-2 text-xs ${f.includes("Mentoria") ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  {f.includes("Mentoria") ? (
                    <Sparkles className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                  ) : (
                    <span className="shrink-0 mt-0.5">•</span>
                  )}
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full gradient-primary font-semibold py-5 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecionando...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Pagar com Stripe
              </>
            )}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground">
            Pagamento seguro processado pelo Stripe. Você será redirecionado para a página de pagamento.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
