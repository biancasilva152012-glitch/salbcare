import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

export type UserType = "professional" | "patient" | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userType: UserType;
  userTypeLoading: boolean;
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
  userType: null,
  userTypeLoading: true,
  signOut: async () => {},
  subscription: defaultSub,
  refreshSubscription: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<UserType>(null);
  const [userTypeLoading, setUserTypeLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSub);
  const subCheckInFlight = useRef(false);
  const lastCheckTime = useRef(0);

  const fetchUserType = useCallback(async (userId: string) => {
    setUserTypeLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", userId)
        .single();
      setUserType((data?.user_type as UserType) || null);
    } catch {
      setUserType(null);
    } finally {
      setUserTypeLoading(false);
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    const now = Date.now();
    if (subCheckInFlight.current || now - lastCheckTime.current < 5000) return;
    subCheckInFlight.current = true;
    lastCheckTime.current = now;

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      let plan: PlanKey = getPlanByProductId(data.product_id);
      let trialDaysRemaining = 0;
      let paymentStatus = "none";
      let needsOnboarding = false;

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

          if (!data.subscribed && profile.plan && (profile.plan === "professional" || profile.plan === "clinic")) {
            plan = profile.plan as PlanKey;
          }

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
    } finally {
      subCheckInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    let initialCheckDone = false;

    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        fetchUserType(session.user.id);
        if (initialCheckDone) checkSubscription();
      } else {
        setUserType(null);
        setUserTypeLoading(false);
        setSubscription({ ...defaultSub, loading: false });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      initialCheckDone = true;
      if (session?.user) {
        fetchUserType(session.user.id);
        checkSubscription();
      } else {
        setUserTypeLoading(false);
        setSubscription((s) => ({ ...s, loading: false }));
      }
    });

    return () => sub.unsubscribe();
  }, [checkSubscription, fetchUserType]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(checkSubscription, 120_000);
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
      userType,
      userTypeLoading,
      signOut,
      subscription,
      refreshSubscription: checkSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
