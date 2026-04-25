import { useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PageContainer from "@/components/PageContainer";
import PageSkeleton from "@/components/PageSkeleton";
import { clearDemoStorage } from "@/lib/demoStorage";
import { buildExperimenteRedirect, getPreservedKeysFromSearch } from "@/lib/experimenteRedirect";
import { supabase } from "@/integrations/supabase/client";

/**
 * Modo demonstração foi removido. Mantemos a rota /experimente para preservar
 * todos os CTAs existentes ("Testar agora", "Experimente sem cadastrar"...),
 * mas pulamos a tela de demo e mandamos direto para o destino certo.
 *
 * A lógica de destino vive em `buildExperimenteRedirect` (puro/testável).
 * A limpeza do localStorage da demo vive em `clearDemoStorage`.
 */
const Experimente = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const target = useMemo(
    () =>
      buildExperimenteRedirect({
        authenticated: !!user,
        search: location.search,
        basePath: import.meta.env.BASE_URL,
      }),
    [user, location.search],
  );

  useEffect(() => {
    if (loading) return;
    const removed = clearDemoStorage();
    const preservedKeys = getPreservedKeysFromSearch(location.search);
    const flow = user ? "authed" : "visitor";
    // eslint-disable-next-line no-console
    console.info("[experimente] redirect", {
      flow,
      cleanedKeys: removed.length,
      preservedKeys,
    });
    // Telemetria leve no backend — fire-and-forget. Nunca bloqueia o redirect
    // e nunca envia VALORES da query (apenas nomes de chaves preservadas).
    supabase.functions
      .invoke("log-redirect-audit", {
        body: {
          flow,
          source: "experimente",
          preservedKeys,
          resolvedPath: target,
          outcome: "ok",
        },
      })
      .catch(() => {
        /* swallow — auditoria não pode quebrar UX */
      });
  }, [user, loading, location.search, target]);

  if (loading) {
    return (
      <PageContainer>
        <PageSkeleton variant="list" />
      </PageContainer>
    );
  }

  return <Navigate to={target} replace aria-hidden="true" />;
};

export default Experimente;

