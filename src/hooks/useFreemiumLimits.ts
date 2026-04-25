import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { isAdminEmail } from "@/config/admin";

/**
 * Free tier monthly/total ceilings. These mirror the demo limits in
 * `src/lib/demoStorage.ts` so an anonymous visitor and a freshly-signed-up
 * free user see the exact same quotas.
 *
 * IMPORTANT: only the *create* action is gated by these limits. Reading,
 * editing and navigating remain fully open even when a quota is reached —
 * see the contextual paywall integration in Patients/Agenda/Telehealth.
 */
export const FREE_LIMITS = {
  financialTransactions: 10,
  patients: 5,
  appointments: 5,
  // Telessaúde é totalmente bloqueada no plano gratuito (recurso premium).
  telehealthAttempts: 0,
  // 5 mensagens grátis na mentoria de IA antes de exigir o plano Essencial.
  mentorshipMessages: 5,
} as const;

export type FreemiumModule =
  | "patients"
  | "appointments"
  | "telehealth"
  | "financial"
  | "mentorship";

export type FreemiumModuleUsage = {
  used: number;
  limit: number;
  remaining: number;
  percent: number;
  blocked: boolean;
};

export function useFreemiumLimits() {
  const { user, subscription } = useAuth();

  const isAdmin = isAdminEmail(user?.email);
  const isPaid =
    subscription.subscribed ||
    subscription.paymentStatus === "active" ||
    subscription.trialDaysRemaining > 0;
  const isFree = !isAdmin && !isPaid;

  const { data: counts, isLoading } = useQuery({
    queryKey: ["freemium-counts", user?.id],
    queryFn: async () => {
      if (!user) {
        return { financial: 0, patients: 0, appointments: 0, telehealth: 0, mentorship: 0 };
      }

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const monthStartIso = `${monthStart}T00:00:00`;

      const [finRes, patRes, apptRes, teleRes, mentRes] = await Promise.all([
        supabase
          .from("financial_transactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("date", monthStart),
        supabase
          .from("patients")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("date", monthStart),
        supabase
          .from("teleconsultations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("date", monthStartIso),
        supabase
          .from("mentorship_messages")
          .select("id", { count: "exact", head: true })
          .eq("professional_id", user.id)
          .eq("role", "user")
          .gte("created_at", monthStartIso),
      ]);

      return {
        financial: finRes.count ?? 0,
        patients: patRes.count ?? 0,
        appointments: apptRes.count ?? 0,
        telehealth: teleRes.count ?? 0,
        mentorship: mentRes.count ?? 0,
      };
    },
    enabled: !!user && isFree,
    refetchOnWindowFocus: false,
  });

  const buildUsage = (used: number, limit: number): FreemiumModuleUsage => {
    const remaining = Math.max(0, limit - used);
    return {
      used,
      limit,
      remaining,
      percent: Math.min(100, limit === 0 ? 0 : (used / limit) * 100),
      blocked: isFree && remaining === 0,
    };
  };

  const financialCount = counts?.financial ?? 0;
  const patientsCount = counts?.patients ?? 0;
  const appointmentsCount = counts?.appointments ?? 0;
  const telehealthCount = counts?.telehealth ?? 0;
  const mentorshipCount = counts?.mentorship ?? 0;

  const usageByModule: Record<FreemiumModule, FreemiumModuleUsage> = {
    patients: buildUsage(patientsCount, FREE_LIMITS.patients),
    appointments: buildUsage(appointmentsCount, FREE_LIMITS.appointments),
    telehealth: buildUsage(telehealthCount, FREE_LIMITS.telehealthAttempts),
    financial: buildUsage(financialCount, FREE_LIMITS.financialTransactions),
    mentorship: buildUsage(mentorshipCount, FREE_LIMITS.mentorshipMessages),
  };

  return {
    isFree,
    isAdmin,
    isPaid,
    isLoading,
    // Boolean shortcuts (true when the action is allowed)
    canAddFinancial: !usageByModule.financial.blocked,
    canAddPatient: !usageByModule.patients.blocked,
    canAddAppointment: !usageByModule.appointments.blocked,
    canCreateTelehealth: !usageByModule.telehealth.blocked,
    canSendMentorship: !usageByModule.mentorship.blocked,
    // Raw counts for legacy consumers
    financialCount,
    financialLimit: FREE_LIMITS.financialTransactions,
    patientsCount,
    patientsLimit: FREE_LIMITS.patients,
    appointmentsCount,
    appointmentsLimit: FREE_LIMITS.appointments,
    telehealthCount,
    telehealthLimit: FREE_LIMITS.telehealthAttempts,
    mentorshipCount,
    mentorshipLimit: FREE_LIMITS.mentorshipMessages,
    // Unified API for the contextual paywall + meters
    usageByModule,
  };
}
