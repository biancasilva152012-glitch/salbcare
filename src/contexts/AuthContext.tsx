import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getPlanByProductId, PlanKey, getTrialDaysRemaining } from "@/config/plans";
import { isAdminEmail } from "@/config/admin";
import {
  invokeCheckSubscriptionWithRetry,
  readSubscriptionCache,
  writeSubscriptionCache,
} from "@/lib/subscriptionCache";

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

function deriveSubscriptionState(
  stripeData: { subscribed: boolean; product_id: string | null; subscription_end: string | null },
  profile?: { plan?: string | null; trial_start_date?: string | null; payment_status?: string | null } | null,
): SubscriptionState {
  let plan: PlanKey = getPlanByProductId(stripeData.product_id);
  let trialDaysRemaining = 0;
  let paymentStatus = "none";
  let needsOnboarding = false;

  if (profile) {
    paymentStatus = profile.payment_status || "none";
    trialDaysRemaining = getTrialDaysRemaining(profile.trial_start_date || null);

    if (!stripeData.subscribed && profile.plan && profile.plan === "basic") {
      plan = profile.plan as PlanKey;
    }

    if (!profile.trial_start_date && paymentStatus === "none" && profile.plan === "basic") {
      needsOnboarding = true;
    }
  }

  return {
    subscribed: stripeData.subscribed || paymentStatus === "active" || trialDaysRemaining > 0,
    plan,
    subscriptionEnd: stripeData.subscription_end || null,
    loading: false,
    trialDaysRemaining,
    paymentStatus,
    needsOnboarding,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<UserType>(null);
  const [userTypeLoading, setUserTypeLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSub);
  const subCheckInFlight = useRef(false);
  const lastCheckTime = useRef(0);
  const sessionRef = useRef<Session | null>(null);

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

    const currentSession = sessionRef.current;

    try {
      // Admin bypass — always return full access
      if (isAdminEmail(currentSession?.user?.email)) {
        setSubscription({
          subscribed: true,
          plan: "basic" as PlanKey,
          subscriptionEnd: null,
          loading: false,
          trialDaysRemaining: 0,
          paymentStatus: "active",
          needsOnboarding: false,
        });
        return;
      }

      const userId = currentSession?.user?.id;
      if (!userId) {
        setSubscription((s) => ({ ...s, loading: false }));
        return;
      }

      const cached = readSubscriptionCache(userId);
      const [subResult, profileResult] = await Promise.allSettled([
        invokeCheckSubscriptionWithRetry(3),
        supabase
          .from("profiles")
          .select("plan, trial_start_date, payment_status")
          .eq("user_id", userId)
          .single(),
      ]);

      const profile = profileResult.status === "fulfilled" ? profileResult.value.data : null;

      if (cached) {
        setSubscription(deriveSubscriptionState(cached, profile as any));
      } else if (profile) {
        setSubscription(
          deriveSubscriptionState(
            { subscribed: false, product_id: null, subscription_end: null },
            profile as any,
          ),
        );
      }

      // Pick the freshest source of truth for the Stripe-side data:
      //   1) successful retry response → use it and refresh the cache
      //   2) cached last-known-good response → use it (graceful degradation)
      //   3) hard fallback (everything off)
      let data: { subscribed: boolean; product_id: string | null; subscription_end: string | null };
      if (subResult.status === "fulfilled" && subResult.value.data) {
        data = subResult.value.data;
        writeSubscriptionCache(userId, data);
      } else {
        if (cached) {
          const attempts = subResult.status === "fulfilled" ? subResult.value.attempts : 0;
          console.warn("[check-subscription] using cached subscription after", attempts, "failed attempts");
          data = cached;
        } else {
          data = { subscribed: false, product_id: null, subscription_end: null };
        }
      }

      setSubscription(deriveSubscriptionState(data, profile as any));
    } catch {
      setSubscription((s) => ({ ...s, loading: false }));
    } finally {
      subCheckInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    let initialCheckDone = false;

    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      sessionRef.current = newSession;
      setSession(newSession);
      setLoading(false);
      if (newSession?.user) {
        fetchUserType(newSession.user.id).then(() => {
          if (_event === "SIGNED_IN") {
            supabase
              .from("profiles")
              .select("user_type, council_number")
              .eq("user_id", newSession.user.id)
              .single()
              .then(({ data: profile }) => {
                if ((profile as any)?.user_type === "professional" && !(profile as any)?.council_number) {
                  const currentPath = window.location.pathname;
                  const publicPaths = ["/", "/pronto-atendimento", "/login", "/register", "/complete-profile", "/como-funciona", "/terms", "/privacy", "/consulta-online", "/especialidades", "/patient-dashboard"];
                  const isPublicPath = publicPaths.some(p => currentPath === p || currentPath.startsWith("/pronto-atendimento") || currentPath.startsWith("/patient-dashboard") || currentPath.startsWith("/acompanhamento"));
                  if (!isPublicPath) {
                    navigate("/complete-profile");
                  }
                }
              });
          }
        });
        if (initialCheckDone) checkSubscription();
      } else {
        setUserType(null);
        setUserTypeLoading(false);
        setSubscription({ ...defaultSub, loading: false });
      }
    });

    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      sessionRef.current = initSession;
      setSession(initSession);
      initialCheckDone = true;
      if (initSession?.user) {
        fetchUserType(initSession.user.id).finally(() => setLoading(false));
        checkSubscription();
      } else {
        setUserTypeLoading(false);
        setSubscription((s) => ({ ...s, loading: false }));
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, []);

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
