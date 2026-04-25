import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";

interface GuestPaywallProps {
  /** Friendly feature name shown in the headline */
  feature: string;
  /** Optional sub-headline / pitch shown below the title */
  description?: string;
  /** Where to redirect after successful sign-up (deep link) */
  redirectAfterSignup?: string;
}

/**
 * Generic gate shown when a guest (no auth user) tries to open a feature
 * that needs a real account — Mentoria, Telessaúde, Financeiro, Contabilidade,
 * Jurídico, Profile/configurações.
 *
 * Stays consistent with PremiumFeatureModal copy: the *first* CTA always
 * sends the visitor to /register so we never lose the activation moment.
 */
const GuestPaywall = ({
  feature,
  description,
  redirectAfterSignup = "/dashboard",
}: GuestPaywallProps) => {
  const next = encodeURIComponent(redirectAfterSignup);
  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md text-center space-y-4 py-8"
        data-testid="guest-paywall"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold">
            Crie sua conta grátis para usar {feature}
          </h1>
          <p className="text-sm text-muted-foreground">
            {description ??
              "Esse módulo precisa de uma conta para salvar e proteger seus dados. O cadastro é gratuito e leva menos de 1 minuto."}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <Button asChild className="w-full gradient-primary font-semibold">
            <Link to={`/register?next=${next}`}>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar conta grátis
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to={`/login?next=${next}`}>
              Já tenho conta — entrar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="w-full text-muted-foreground">
            <Link to="/dashboard">Voltar ao dashboard</Link>
          </Button>
        </div>
      </motion.div>
    </PageContainer>
  );
};

export default GuestPaywall;
