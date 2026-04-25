import { supabase } from "@/integrations/supabase/client";

/**
 * Módulos premium rastreáveis. Mantenha em sincronia com o regex de validação
 * do trigger `validate_premium_block_attempt` (apenas A-Za-z0-9_-).
 */
export type PremiumBlockModule =
  | "prescriptions"
  | "certificates"
  | "telehealth"
  | "public_directory"
  | "patients_limit"
  | "mentorship_limit"
  | "appointments_limit"
  | "financial_limit";

export type PremiumBlockReason =
  | "plan_required"
  | "limit_reached"
  | "trial_expired";

/**
 * Registra (best-effort, não-bloqueante) uma tentativa de uso de recurso
 * premium feita por um usuário no plano gratuito. Falhas de rede são
 * silenciadas — esta telemetria não pode atrapalhar o fluxo do paywall.
 *
 * Importante: NUNCA passe dados sensíveis em `metadata`. RLS impede leitura
 * cruzada entre usuários, mas mantemos só nomes de keys e contadores.
 */
export async function logPremiumBlockAttempt(
  module: PremiumBlockModule,
  reason: PremiumBlockReason = "plan_required",
  metadata: Record<string, string | number | boolean> = {},
): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return; // anônimo: ignorado

    await supabase.from("premium_block_attempts").insert({
      user_id: userId,
      module,
      reason,
      metadata,
    });
  } catch {
    // Best-effort: silencia para não impactar UX do paywall.
  }
}
