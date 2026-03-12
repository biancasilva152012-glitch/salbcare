import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getPlanByProductId, PlanKey } from "@/config/plans";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  subscription: {
    subscribed: boolean;
    plan: PlanKey;
    subscriptionEnd: string | null;
    loading: boolean;
  };
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  subscription: { subscribed: false, plan: "basic", subscriptionEnd: null, loading: true },
  refreshSubscription: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState({
    subscribed: false,
    plan: "basic" as PlanKey,
    subscriptionEnd: null as string | null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscription({
        subscribed: data.subscribed || false,
        plan: getPlanByProductId(data.product_id),
        subscriptionEnd: data.subscription_end || null,
        loading: false,
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
        setSubscription({ subscribed: false, plan: "basic", subscriptionEnd: null, loading: false });
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

  // Auto-refresh subscription every 60s
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
