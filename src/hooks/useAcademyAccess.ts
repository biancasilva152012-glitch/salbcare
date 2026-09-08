import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Acesso ao conteudo completo da Academy (apostila e Quick Card completo).
 * Liberado para assinantes do SalbCare Pro ou para quem comprou a apostila.
 */
export const useAcademyAccess = () => {
  const { user, loading: authLoading } = useAuth();
  const [access, setAccess] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setAccess(false);
      setSource(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("academy-access");
      setAccess(!!data?.access);
      setSource(data?.source ?? null);
    } catch {
      setAccess(false);
      setSource(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  return { access, source, loading: loading || authLoading, refresh, isLoggedIn: !!user };
};
