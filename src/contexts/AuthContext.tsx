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

      const [subResult, profileResult] = await Promise.all([
        invokeCheckSubscriptionWithRetry(3),
        supabase
          .from("profiles")
          .select("plan, trial_start_date, payment_status")
          .eq("user_id", userId)
          .single(),
      ]);

      // Pick the freshest source of truth for the Stripe-side data:
      //   1) successful retry response → use it and refresh the cache
      //   2) cached last-known-good response → use it (graceful degradation)
      //   3) hard fallback (everything off)
      let data: { subscribed: boolean; product_id: string | null; subscription_end: string | null };
      if (subResult.data) {
        data = subResult.data;
        writeSubscriptionCache(userId, data);
      } else {
        const cached = readSubscriptionCache(userId);
        if (cached) {
          console.warn("[check-subscription] using cached subscription after", subResult.attempts, "failed attempts");
          data = cached;
        } else {
          data = { subscribed: false, product_id: null, subscription_end: null };
        }
      }

      let plan: PlanKey = getPlanByProductId(data.product_id);
      let trialDaysRemaining = 0;
      let paymentStatus = "none";
      let needsOnboarding = false;

      const profile = profileResult.data;
      if (profile) {
        paymentStatus = (profile as any).payment_status || "none";
        const trialStart = (profile as any).trial_start_date;
        trialDaysRemaining = getTrialDaysRemaining(trialStart);

        if (!data.subscribed && profile.plan && profile.plan === "basic") {
          plan = profile.plan as PlanKey;
        }

        if (!trialStart && paymentStatus === "none" && profile.plan === "basic") {
          needsOnboarding = true;
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
      setLoading(false);
      initialCheckDone = true;
      if (initSession?.user) {
        fetchUserType(initSession.user.id);
        checkSubscription();
      } else {
        setUserTypeLoading(false);
        setSubscription((s) => ({ ...s, loading: false }));
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
