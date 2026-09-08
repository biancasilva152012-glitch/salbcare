import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hasLocalAcademyAccess } from "@/lib/academyAccess";

/**
 * Acesso ao conteudo completo da Academy (apostila e Quick Card completo).
 * Tres fontes, em ordem: token da compra salvo neste aparelho (sem conta),
 * assinatura do SalbCare Pro ou compra avulsa ligada ao e-mail da conta.
 */
export const useAcademyAccess = () => {
  const { user, loading: authLoading } = useAuth();
  const [access, setAccess] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (hasLocalAcademyAccess()) {
      setAccess(true);
      setSource("token");
      setLoading(false);
      return;
    }
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
