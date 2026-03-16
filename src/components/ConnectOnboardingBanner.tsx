import { AlertTriangle, CheckCircle } from "lucide-react";

interface Props {
  pixKey?: string | null;
  cardLink?: string | null;
}

const ConnectOnboardingBanner = ({ pixKey, cardLink }: Props) => {
  const hasPaymentData = !!pixKey || !!cardLink;

  if (hasPaymentData) return null;

  return (
    <div className="glass-card ring-1 ring-yellow-500/30 bg-yellow-500/5 p-4 space-y-2">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Dados de pagamento pendentes</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            Cadastre sua chave Pix ou link de pagamento no seu perfil para que os pacientes possam pagar diretamente a você.
          </p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        Você recebe 100% do valor de cada consulta. Vá em Perfil → Dados de pagamento.
      </p>
    </div>
  );
};

export default ConnectOnboardingBanner;
