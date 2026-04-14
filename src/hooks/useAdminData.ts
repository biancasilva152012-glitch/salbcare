import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  plan: string;
  payment_status: string;
  trial_start_date: string | null;
  professional_type: string;
  user_type: string;
  created_at: string;
  bio: string | null;
  council_number: string | null;
  council_state: string | null;
  availability_online: boolean;
  stripe: {
    customer_id: string;
    subscription: {
      id: string;
      status: string;
      current_period_end: number;
      cancel_at_period_end: boolean;
      plan_amount: number;
      plan_currency: string;
    } | null;
  } | null;
}

async function adminAction(action: string, params: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ action, ...params }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro na requisição");
  }
  return res.json();
}

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const data = await adminAction("list_users");
      return data.users || [];
    },
    staleTime: 30_000,
  });
}

export interface AdminFinancialData {
  mrr: number;
  active_subs: number;
  churn_rate: number;
  total_canceled: number;
  recent_charges: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    created: number;
    customer_email: string | null;
    description: string | null;
    refunded: boolean;
    paid: boolean;
  }[];
  monthly_revenue: { month: string; revenue: number }[];
}

export function useAdminMRR() {
  return useQuery<AdminFinancialData>({
    queryKey: ["admin-mrr"],
    queryFn: () => adminAction("get_mrr"),
    staleTime: 60_000,
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (user_id: string) => adminAction("suspend_user", { user_id }),
    onSuccess: () => {
      toast.success("Usuário suspenso");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (user_id: string) => adminAction("activate_user", { user_id }),
    onSuccess: () => {
      toast.success("Usuário ativado");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ user_id, plan }: { user_id: string; plan: string }) =>
      adminAction("change_plan", { user_id, plan }),
    onSuccess: () => {
      toast.success("Plano alterado");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
