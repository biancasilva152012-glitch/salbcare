import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hasLocalAcademyAccess, localAcademyLangs } from "@/lib/academyAccess";
import type { QuickCardLang } from "@/config/quickCard";

const asLangs = (list: unknown): QuickCardLang[] => {
  const ok = ["pt", "en", "es"] as QuickCardLang[];
  const arr = Array.isArray(list) ? (list as string[]) : [];
  return ok.filter((l) => arr.includes(l));
};

/**
 * Acesso ao conteúdo completo da Academy (apostilas e Quick Card completo).
 * Três fontes, em ordem: token da compra salvo neste aparelho (sem conta),
 * assinatura do SalbCare Pro ou compra avulsa ligada ao e-mail da conta.
 * `langs` diz quais idiomas a compra liberou.
 */
export const useAcademyAccess = () => {
  const { user, loading: authLoading } = useAuth();
  const [access, setAccess] = useState(false);
  const [langs, setLangs] = useState<QuickCardLang[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (hasLocalAcademyAccess()) {
      const local = asLangs(localAcademyLangs());
      setAccess(true);
      setSource("token");
      setLangs(local.length ? local : ["pt"]);
      setLoading(false);
      return;
    }
    if (!user) {
      setAccess(false);
      setSource(null);
      setLangs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("academy-access");
      setAccess(!!data?.access);
      setSource(data?.source ?? null);
      setLangs(asLangs(data?.langs));
    } catch {
      setAccess(false);
      setSource(null);
      setLangs([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  return { access, langs, source, loading: loading || authLoading, refresh, isLoggedIn: !!user };
};
