import { useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PageContainer from "@/components/PageContainer";
import PageSkeleton from "@/components/PageSkeleton";
import { clearDemoStorage } from "@/lib/demoStorage";
import { buildExperimenteRedirect, getPreservedKeysFromSearch } from "@/lib/experimenteRedirect";

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

  useEffect(() => {
    const removed = clearDemoStorage();
    // Telemetria leve: nenhum valor de query é logado, apenas o NOME das
    // chaves preservadas que estavam presentes (utm_* / ref). Isso permite
    // entender atribuição/tráfego sem expor PII (e-mail, ids, tokens).
    const preservedKeys = getPreservedKeysFromSearch(location.search);
    // eslint-disable-next-line no-console
    console.info("[experimente] redirect", {
      flow: user ? "authed" : "visitor",
      cleanedKeys: removed.length,
      preservedKeys,
    });
  }, [user, location.search]);


  const target = useMemo(
    () =>
      buildExperimenteRedirect({
        authenticated: !!user,
        search: location.search,
        basePath: import.meta.env.BASE_URL,
      }),
    [user, location.search],
  );

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

