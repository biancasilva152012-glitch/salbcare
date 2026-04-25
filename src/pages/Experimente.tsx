import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PageContainer from "@/components/PageContainer";
import PageSkeleton from "@/components/PageSkeleton";

/**
 * Modo demonstração foi removido. Mantemos a rota /experimente para preservar
 * todos os CTAs existentes ("Testar agora", "Experimente sem cadastrar"...),
 * mas pulamos a tela de demo e mandamos direto para o destino certo:
 *   - Usuário logado  → /dashboard
 *   - Visitante       → /register
 */
const Experimente = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Limpa qualquer rastro do antigo modo demo no localStorage para não
    // disparar a migração de dados anônimos no próximo login.
    try {
      const keys = [
        "demo:patients",
        "demo:appointments",
        "demo:usage",
        "demo:active-tab",
        "demo:patients:search",
        "demo:patients:filter",
        "demo:appointments:search",
        "demo:appointments:filter",
      ];
      keys.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <PageSkeleton variant="list" />
      </PageContainer>
    );
  }

  return <Navigate to={user ? "/dashboard" : "/register"} replace />;
};

export default Experimente;
