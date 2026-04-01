import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/config/admin";

export interface SubscriptionData {
  status: string | null; // 'trialing' | 'active' | 'past_due' | 'canceled' | null
  plan: string | null;
  billing: string | null;
  hadTrial: boolean;
  trialEndsAt: string | null;
  isActive: boolean;
  isPastDue: boolean;
  isCanceled: boolean;
  isLoading: boolean;
  isAdmin: boolean;
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
  isAdmin: false,
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

    // Admin bypass — full access always
    if (isAdminEmail(user.email)) {
      setData({
        status: "active",
        plan: "clinic",
        billing: "monthly",
        hadTrial: false,
        trialEndsAt: null,
        isActive: true,
        isPastDue: false,
        isCanceled: false,
        isLoading: false,
        isAdmin: true,
      });
      return;
    }

    try {
      const { data: prof, error } = await supabase
        .from("professionals")
        .select("subscription_status, plan, billing, had_trial, trial_ends_at, created_at")
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
      const createdAt = (prof as any).created_at as string | null;

      // Grace period: if status is null and account was created less than 1 hour ago,
      // don't treat as canceled — the user is still choosing a plan
      const isNewAccount = createdAt
        ? Date.now() - new Date(createdAt).getTime() < 60 * 60 * 1000
        : false;

      // Pre-Stripe users: if status is null AND never had a trial AND no plan set,
      // they registered before subscriptions existed — grant access
      const isPreStripeUser = status === null && !hadTrial && !plan;

      const isActive = status === "active" || status === "trialing" || isPreStripeUser;
      const isPastDue = status === "past_due";
      const isCanceled = status === "canceled" || (status === null && !isNewAccount && !isPreStripeUser);

      setData({
        status,
        plan,
        billing,
        hadTrial,
        trialEndsAt,
        isActive,
        isPastDue,
        isCanceled,
        isLoading: false,
        isAdmin: false,
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
