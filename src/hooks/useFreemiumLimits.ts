import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { isAdminEmail } from "@/config/admin";

export const FREE_LIMITS = {
  financialTransactions: 10,
  patients: 10,
  mentorshipMessages: 5,
} as const;

export function useFreemiumLimits() {
  const { user, subscription } = useAuth();

  const isAdmin = isAdminEmail(user?.email);
  const isPaid = subscription.subscribed || subscription.paymentStatus === "active" || subscription.trialDaysRemaining > 0;
  const isFree = !isAdmin && !isPaid;

  const { data: counts, isLoading } = useQuery({
    queryKey: ["freemium-counts", user?.id],
    queryFn: async () => {
      if (!user) return { financial: 0, patients: 0, mentorship: 0 };

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

      const [finRes, patRes, mentRes] = await Promise.all([
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
          .from("mentorship_messages")
          .select("id", { count: "exact", head: true })
          .eq("professional_id", user.id)
          .eq("role", "user")
          .gte("created_at", `${monthStart}T00:00:00`),
      ]);

      return {
        financial: finRes.count ?? 0,
        patients: patRes.count ?? 0,
        mentorship: mentRes.count ?? 0,
      };
    },
    enabled: !!user && isFree,
    refetchOnWindowFocus: false,
  });

  const financialCount = counts?.financial ?? 0;
  const patientsCount = counts?.patients ?? 0;
  const mentorshipCount = counts?.mentorship ?? 0;

  return {
    isFree,
    isLoading,
    canAddFinancial: !isFree || financialCount < FREE_LIMITS.financialTransactions,
    canAddPatient: !isFree || patientsCount < FREE_LIMITS.patients,
    canSendMentorship: !isFree || mentorshipCount < FREE_LIMITS.mentorshipMessages,
    financialCount,
    financialLimit: FREE_LIMITS.financialTransactions,
    patientsCount,
    patientsLimit: FREE_LIMITS.patients,
    mentorshipCount,
    mentorshipLimit: FREE_LIMITS.mentorshipMessages,
  };
}
