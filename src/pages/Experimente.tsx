import { useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PageContainer from "@/components/PageContainer";
import PageSkeleton from "@/components/PageSkeleton";
import { DEMO_STORAGE } from "@/lib/demoStorage";

/**
 * Modo demonstração foi removido. Mantemos a rota /experimente para preservar
 * todos os CTAs existentes ("Testar agora", "Experimente sem cadastrar"...),
 * mas pulamos a tela de demo e mandamos direto para o destino certo:
 *   - Usuário logado  → /dashboard
 *   - Visitante       → /register (com ?redirect=/dashboard preservando query string)
 *
 * Também limpamos qualquer rastro do antigo localStorage da demo, para que a
 * primeira autenticação do usuário não dispare a migração de dados anônimos.
 */
const Experimente = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    try {
      Object.values(DEMO_STORAGE).forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }, []);

  const target = useMemo(() => {
    const search = location.search || "";
    if (user) return `/dashboard${search}`;
    // Preserva a rota original como redirect pós-cadastro.
    const params = new URLSearchParams(search);
    if (!params.has("redirect")) params.set("redirect", "/dashboard");
    return `/register?${params.toString()}`;
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
