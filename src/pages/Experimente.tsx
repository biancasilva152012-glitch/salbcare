import { useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PageContainer from "@/components/PageContainer";
import PageSkeleton from "@/components/PageSkeleton";
import { clearDemoStorage } from "@/lib/demoStorage";

/**
 * Modo demonstração foi removido. Mantemos a rota /experimente para preservar
 * todos os CTAs existentes ("Testar agora", "Experimente sem cadastrar"...),
 * mas pulamos a tela de demo e mandamos direto para o destino certo:
 *   - Usuário logado  → /dashboard (ou rota profunda em ?next= se permitida)
 *   - Visitante       → /register?redirect=<rota permitida>
 *
 * A rotina de limpeza do localStorage da demo é centralizada em
 * `clearDemoStorage` (lib/demoStorage), de forma que somente as chaves
 * DEMO_STORAGE são removidas.
 */

// Allowlist de rotas internas permitidas como destino de redirect.
// Qualquer valor fora desta lista é descartado para evitar open-redirect.
const ALLOWED_REDIRECTS = [
  "/dashboard",
  "/dashboard/financeiro",
  "/dashboard/financial",
  "/dashboard/contabilidade",
  "/dashboard/agenda",
  "/dashboard/pacientes",
  "/dashboard/juridico",
  "/dashboard/teleconsulta",
  "/dashboard/telehealth",
  "/dashboard/mentoria",
  "/profile",
  "/subscription",
] as const;

// Query params que fazem sentido propagar (atribuição/marketing + next).
// Os demais são descartados silenciosamente.
const PRESERVED_QUERY_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "next",
]);

function isAllowedRedirect(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false; // bloqueia protocol-relative
  // match exato OU subrota imediata
  return (ALLOWED_REDIRECTS as readonly string[]).some(
    (allowed) => path === allowed || path.startsWith(`${allowed}/`),
  );
}

function buildPreservedSearch(rawSearch: string): string {
  const incoming = new URLSearchParams(rawSearch);
  const out = new URLSearchParams();
  for (const [k, v] of incoming.entries()) {
    if (PRESERVED_QUERY_PARAMS.has(k)) out.set(k, v);
  }
  return out.toString();
}

const Experimente = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const removed = clearDemoStorage();
    // Telemetria leve — apenas a contagem, sem dados sensíveis.
    // eslint-disable-next-line no-console
    console.info("[experimente] redirect", {
      authenticated: !!user,
      cleanedKeys: removed.length,
    });
  }, [user]);

  const target = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const requestedNext = params.get("next");
    const deepTarget = isAllowedRedirect(requestedNext) ? requestedNext! : "/dashboard";

    const preserved = buildPreservedSearch(location.search);
    const preservedSuffix = preserved ? `?${preserved}` : "";

    if (user) {
      return `${deepTarget}${preservedSuffix}`;
    }

    // Visitante → register, levando o destino final em ?redirect=
    const registerParams = new URLSearchParams(preserved);
    registerParams.set("redirect", deepTarget);
    return `/register?${registerParams.toString()}`;
  }, [user, location.search]);

  if (loading) {
    return (
      <PageContainer>
        <PageSkeleton variant="list" />
      </PageContainer>
    );
  }

  return <Navigate to={target} replace />;
};

export default Experimente;
