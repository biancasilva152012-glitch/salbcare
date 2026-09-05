import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProAccount {
  user_id: string;
  email: string;
  name: string;
  profession: string;
  city: string;
  is_published: boolean;
  plan: string;
  status: string;
  current_period_end: string | null;
  manual: boolean;
  created_at: string;
}

async function call(action: string, params: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-pro-provision`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ action, ...params }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Falha na requisição");
  return json;
}

const PROFESSIONS = ["dentista", "fisioterapeuta"];
const PLAN_LABEL: Record<string, string> = { monthly: "Mensal", annual: "Anual" };
const STATUS_LABEL: Record<string, string> = {
  trialing: "Teste",
  active: "Ativa",
  past_due: "Pagamento atrasado",
  canceled: "Cancelada",
};

const input =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-500/60 focus:outline-none";
const label = "block text-[11px] uppercase tracking-wider text-white/40 mb-1.5";

const AdminProAccounts = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    profession: "dentista",
    city: "",
    whatsapp: "",
    plan: "monthly",
    status: "active",
  });

  const { data: professionals = [], isLoading } = useQuery<ProAccount[]>({
    queryKey: ["admin-pro-accounts"],
    queryFn: async () => (await call("list")).professionals ?? [],
    staleTime: 20_000,
  });

  const create = useMutation({
    mutationFn: () => call("create_professional", form),
    onSuccess: (data: { temporary_password?: boolean }) => {
      toast.success(
        data.temporary_password
          ? "Profissional criado. Defina a senha na lista abaixo."
          : "Profissional criado com plano e assinatura."
      );
      setForm({ ...form, name: "", email: "", password: "", city: "", whatsapp: "" });
      qc.invalidateQueries({ queryKey: ["admin-pro-accounts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (v: { user_id: string; plan: string; status: string }) =>
      call("set_subscription", v),
    onSuccess: () => {
      toast.success("Assinatura atualizada");
      qc.invalidateQueries({ queryKey: ["admin-pro-accounts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setPassword = useMutation({
    mutationFn: (v: { user_id: string; password: string }) => call("set_password", v),
    onSuccess: () => toast.success("Senha definida"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-white">Profissionais, planos e assinaturas</h1>
        <p className="mt-1 text-sm text-white/40">
          Cadastro direto no banco real. A conta criada aqui entra no painel do profissional com
          e-mail e senha.
        </p>
      </header>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Novo profissional</h2>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div>
            <label className={label}>Nome</label>
            <input
              className={input}
              value={form.name}
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>E-mail de acesso</label>
            <input
              type="email"
              className={input}
              value={form.email}
              required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Senha inicial (mínimo 8)</label>
            <input
              type="text"
              className={input}
              value={form.password}
              minLength={8}
              placeholder="Deixe vazio para definir depois"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Profissão</label>
            <select
              className={input}
              value={form.profession}
              onChange={(e) => setForm({ ...form, profession: e.target.value })}
            >
              {PROFESSIONS.map((p) => (
                <option key={p} value={p} className="bg-[hsl(220,20%,10%)]">
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Cidade</label>
            <input
              className={input}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>WhatsApp</label>
            <input
              className={input}
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Plano</label>
            <select
              className={input}
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
            >
              <option value="monthly" className="bg-[hsl(220,20%,10%)]">Mensal</option>
              <option value="annual" className="bg-[hsl(220,20%,10%)]">Anual</option>
            </select>
          </div>
          <div>
            <label className={label}>Situação da assinatura</label>
            <select
              className={input}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {Object.entries(STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v} className="bg-[hsl(220,20%,10%)]">
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Cadastrar profissional
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">
          Assinaturas ativas no banco ({professionals.length})
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-white/40" />
          </div>
        ) : professionals.length === 0 ? (
          <p className="py-6 text-sm text-white/40">Nenhum profissional cadastrado ainda.</p>
        ) : (
          <div className="space-y-3">
            {professionals.map((p) => (
              <ProRow
                key={p.user_id}
                pro={p}
                onUpdate={(plan, status) => update.mutate({ user_id: p.user_id, plan, status })}
                onPassword={(password) => setPassword.mutate({ user_id: p.user_id, password })}
                busy={update.isPending || setPassword.isPending}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const ProRow = ({
  pro,
  onUpdate,
  onPassword,
  busy,
}: {
  pro: ProAccount;
  onUpdate: (plan: string, status: string) => void;
  onPassword: (password: string) => void;
  busy: boolean;
}) => {
  const [plan, setPlan] = useState(pro.plan);
  const [status, setStatus] = useState(pro.status);
  const [pwd, setPwd] = useState("");

  return (
    <div className="rounded-xl border border-white/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{pro.name || "Sem nome"}</p>
          <p className="text-xs text-white/40">
            {pro.email} · {pro.profession || "profissão não informada"}
            {pro.city ? ` · ${pro.city}` : ""}
          </p>
          <p className="mt-1 text-[11px] text-white/30">
            {PLAN_LABEL[pro.plan] || pro.plan} · {STATUS_LABEL[pro.status] || pro.status}
            {pro.current_period_end
              ? ` · vence ${new Date(pro.current_period_end).toLocaleDateString("pt-BR")}`
              : ""}
            {pro.manual ? " · lançada pelo admin" : " · via pagamento"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className={`${input} w-auto`}
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            <option value="monthly" className="bg-[hsl(220,20%,10%)]">Mensal</option>
            <option value="annual" className="bg-[hsl(220,20%,10%)]">Anual</option>
          </select>
          <select
            className={`${input} w-auto`}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v} className="bg-[hsl(220,20%,10%)]">
                {l}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => onUpdate(plan, status)}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5 disabled:opacity-60"
          >
            Salvar
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
        <input
          type="text"
          className={`${input} w-auto`}
          placeholder="Nova senha (mínimo 8)"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <button
          type="button"
          disabled={busy || pwd.length < 8}
          onClick={() => {
            onPassword(pwd);
            setPwd("");
          }}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5 disabled:opacity-40"
        >
          Definir senha
        </button>
      </div>
    </div>
  );
};

export default AdminProAccounts;
