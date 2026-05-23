import { supabase } from "@/integrations/supabase/client";

/**
 * LGPD/CFM trail: registra acesso (visualização) a dados sensíveis de pacientes.
 * Falhas são silenciosas para nunca quebrar a UI.
 */
export async function logPiiView(params: {
  resourceTable: string;
  resourceId?: string | null;
  patientId?: string | null;
  patientName?: string | null;
  reason?: string | null;
}) {
  try {
    await supabase.rpc("log_pii_view", {
      _resource_table: params.resourceTable,
      _resource_id: params.resourceId ?? null,
      _patient_id: params.patientId ?? null,
      _patient_name: params.patientName ?? null,
      _reason: params.reason ?? null,
    });
  } catch {
    // intencional: trilha de auditoria não pode bloquear UX
  }
}
