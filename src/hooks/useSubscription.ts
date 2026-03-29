import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionData {
  status: string | null; // 'trialing' | 'active' | 'past_due' | 'canceled' | null
  plan: string | null; // 'essencial' | 'pro' | 'clinica' | null
  billing: string | null; // 'monthly' | 'annual' | null
  hadTrial: boolean;
  trialEndsAt: string | null;
  isActive: boolean;
  isPastDue: boolean;
  isCanceled: boolean;
  isLoading: boolean;
}

const defaultState: SubscriptionData = {
  status: null,
  plan: null,
  billing: null,
  hadTrial: false,
  trialEndsAt: null,
  isActive: false,
  isPastDue: false,
  isCanceled: true,
  isLoading: true,
};

export function useSubscription(): SubscriptionData {
  const { user } = useAuth();
  const [data, setData] = useState<SubscriptionData>(defaultState);
  const fetched = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setData({ ...defaultState, isLoading: false });
      return;
    }

    try {
      const { data: prof, error } = await supabase
        .from("professionals")
        .select("subscription_status, plan, billing, had_trial, trial_ends_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !prof) {
        setData({ ...defaultState, isLoading: false });
        return;
      }

      const status = (prof as any).subscription_status as string | null;
      const plan = (prof as any).plan as string | null;
      const billing = (prof as any).billing as string | null;
      const hadTrial = (prof as any).had_trial ?? false;
      const trialEndsAt = (prof as any).trial_ends_at as string | null;

      setData({
        status,
        plan,
        billing,
        hadTrial,
        trialEndsAt,
        isActive: status === "active" || status === "trialing",
        isPastDue: status === "past_due",
        isCanceled: status === "canceled" || status === null,
        isLoading: false,
      });
    } catch {
      setData({ ...defaultState, isLoading: false });
    }
  }, [user]);

  useEffect(() => {
    if (!fetched.current && user) {
      fetched.current = true;
      fetchStatus();
    }
    if (!user) {
      fetched.current = false;
      setData({ ...defaultState, isLoading: false });
    }
  }, [user, fetchStatus]);

  return data;
}
