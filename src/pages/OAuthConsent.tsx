import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type AuthOauth = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
};
const oauth = (supabase.auth as unknown as { oauth: AuthOauth }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Solicitação inválida (authorization_id ausente).");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("O servidor de autorização não retornou uma URL de redirecionamento.");
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-semibold mb-2">Não foi possível carregar</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
      </main>
    );
  }
  if (!details) {
    return <main className="mx-auto max-w-md p-6 text-sm text-muted-foreground">Carregando…</main>;
  }
  const clientName = details.client?.name ?? "um aplicativo";
  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Conectar {clientName} à sua conta SALBCARE</h1>
      <p className="text-sm text-muted-foreground">
        Isso permite que <strong>{clientName}</strong> acesse seus dados no SALBCARE (pacientes, agenda e
        resumo financeiro) atuando como você. Você pode revogar o acesso a qualquer momento.
      </p>
      <div className="flex gap-3">
        <Button disabled={busy} onClick={() => decide(true)}>Aprovar</Button>
        <Button variant="outline" disabled={busy} onClick={() => decide(false)}>Recusar</Button>
      </div>
    </main>
  );
}
