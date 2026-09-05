import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Login exclusivo da administração, separado do fluxo dos profissionais.
 * Só libera a entrada quando a conta tem o papel de administrador.
 */
const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Já autenticado como admin: segue direto para a área administrativa.
  useEffect(() => {
    if (loading || !user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      if (data) navigate("/admin", { replace: true });
    });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (signInError || !data.user) {
      setError("E-mail ou senha incorretos.");
      setBusy(false);
      return;
    }
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      await supabase.auth.signOut();
      setError("Esta conta não tem acesso administrativo.");
      setBusy(false);
      return;
    }
    navigate("/admin", { replace: true });
  };

  const input =
    "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500/60 focus:outline-none";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(220,20%,8%)] px-6">
      <Helmet>
        <title>Acesso administrativo. SalbCare</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <form onSubmit={submit} className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <span className="text-sm font-bold tracking-widest text-white">
            SALB<span className="text-blue-400">ADMIN</span>
          </span>
          <p className="mt-2 text-xs text-white/40">Área restrita à administração.</p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            className={input}
            placeholder="E-mail"
            value={email}
            required
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className={input}
            placeholder="Senha"
            value={password}
            required
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Entrar
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
