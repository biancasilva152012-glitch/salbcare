import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getPlanByProductId, PlanKey, getTrialDaysRemaining } from "@/config/plans";

interface SubscriptionState {
  subscribed: boolean;
  plan: PlanKey;
  subscriptionEnd: string | null;
  loading: boolean;
  trialDaysRemaining: number;
  paymentStatus: string;
  needsOnboarding: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  subscription: SubscriptionState;
  refreshSubscription: () => Promise<void>;
}

const defaultSub: SubscriptionState = {
  subscribed: false,
  plan: "basic",
  subscriptionEnd: null,
  loading: true,
  trialDaysRemaining: 0,
  paymentStatus: "none",
  needsOnboarding: false,
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  subscription: defaultSub,
  refreshSubscription: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSub);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      let plan: PlanKey = getPlanByProductId(data.product_id);
      let trialDaysRemaining = 0;
      let paymentStatus = "none";
      let needsOnboarding = false;

      // Fetch profile data for trial/plan info
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan, trial_start_date, payment_status")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          paymentStatus = (profile as any).payment_status || "none";
          const trialStart = (profile as any).trial_start_date;
          trialDaysRemaining = getTrialDaysRemaining(trialStart);

          // If no active Stripe sub, use profile plan
          if (!data.subscribed && profile.plan && (profile.plan === "professional" || profile.plan === "clinic")) {
            plan = profile.plan as PlanKey;
          }

          // Needs onboarding if no trial started and no payment
          if (!trialStart && paymentStatus === "none" && profile.plan === "basic") {
            needsOnboarding = true;
          }
        }
      }

      setSubscription({
        subscribed: data.subscribed || paymentStatus === "active" || trialDaysRemaining > 0,
        plan,
        subscriptionEnd: data.subscription_end || null,
        loading: false,
        trialDaysRemaining,
        paymentStatus,
        needsOnboarding,
      });
    } catch {
      setSubscription((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (session) {
        setTimeout(() => checkSubscription(), 0);
      } else {
        setSubscription({ ...defaultSub, loading: false });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) checkSubscription();
      else setSubscription((s) => ({ ...s, loading: false }));
    });

    return () => sub.unsubscribe();
  }, [checkSubscription]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      signOut,
      subscription,
      refreshSubscription: checkSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
