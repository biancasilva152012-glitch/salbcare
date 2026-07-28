import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ProSubscription = {
  plan: string;
  status: string;
  current_period_end: string | null;
};

const ACTIVE = ["active", "trialing", "past_due"];

/** Lê a assinatura SalbCare Pro do usuário logado (fonte da verdade: banco, populado pelo webhook). */
export const useProSubscription = () => {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<ProSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("pro_subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();
    setSubscription((data as ProSubscription) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  return {
    subscription,
    isActive: !!subscription && ACTIVE.includes(subscription.status),
    loading: loading || authLoading,
    refresh,
  };
};
