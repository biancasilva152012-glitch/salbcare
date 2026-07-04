import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook único para checar se o usuário tem direito a recursos exclusivos do
 * plano pago (Essencial). Usado por:
 *  - Emissão de prescrições (Receita Comum, Controle Especial, Notificação Azul/Amarela)
 *  - Emissão de atestados / certificados digitais
 *  - Criação de teleconsultas
 *  - Aparecer no diretório público (`get_public_professionals` aplica equivalente no DB)
 *
 * Importante: a checagem aqui é apenas de UX. O bloqueio real é mantido por
 * RLS no backend para impedir bypass via console ou requisições diretas.
 */
export function usePremiumFeature() {
  const { subscription, isAdmin } = useAuth();


  const isPaid =
    subscription.subscribed ||
    subscription.paymentStatus === "active" ||
    subscription.paymentStatus === "trialing" ||
    subscription.paymentStatus === "paid" ||
    subscription.trialDaysRemaining > 0;

  const hasPremium = isAdmin || isPaid;

  return {
    hasPremium,
    isPaid,
    isAdmin,
    // Bloqueio explicitado por feature para deixar a chamada mais legível
    canIssuePrescription: hasPremium,
    canIssueCertificate: hasPremium,
    canCreateTeleconsultation: hasPremium,
    canAppearInPublicDirectory: hasPremium,
  };
}
