import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

type AcademyRow = {
  id: string;
  slug: string;
  title: string;
  format_label: string;
  status: string;
  status_label: string;
  price_cents: number | null;
  stripe_price_id: string | null;
  summary: string;
  description: string[];
  contents: string[];
  audience: string;
  published: boolean;
  sort_order: number;
};

type PlanRow = {
  id: string;
  plan_key: string;
  name: string;
  billing_interval: string;
  price_cents: number;
  stripe_price_id: string | null;
  features: string[];
  highlight: boolean;
  published: boolean;
  sort_order: number;
};

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none";
const labelCls = "mb-1 block text-[11px] uppercase tracking-wider text-white/40";
const cardCls = "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5";
const btnCls =
  "inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white hover:bg-white/[0.08] disabled:opacity-50";

const lines = (v: string[]) => (v || []).join("\n");
const toLines = (v: string) =>
  v.split("\n").map((s) => s.trim()).filter(Boolean);

const brl = (cents: number | null | undefined) =>
  cents == null ? "" : (cents / 100).toFixed(2).replace(".", ",");
const fromBrl = (v: string) => {
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

const emptyProduct = (order: number): AcademyRow => ({
  id: "",
  slug: "",
  title: "",
  format_label: "Apostila prática em PDF",
  status: "soon",
  status_label: "Em preparação",
  price_cents: null,
  stripe_price_id: null,
  summary: "",
  description: [],
  contents: [],
  audience: "",
  published: false,
  sort_order: order,
});

const emptyPlan = (order: number): PlanRow => ({
  id: "",
  plan_key: "",
  name: "",
  billing_interval: "month",
  price_cents: 0,
  stripe_price_id: null,
  features: [],
  highlight: false,
  published: false,
  sort_order: order,
});

const AdminAcademyCatalog = () => {
  const [products, setProducts] = useState<AcademyRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [p, q] = await Promise.all([
      supabase.from("academy_products").select("*").order("sort_order"),
      supabase.from("pro_plans").select("*").order("sort_order"),
    ]);
    if (p.error) toast.error("Nao foi possivel carregar os materiais.");
    if (q.error) toast.error("Nao foi possivel carregar os planos.");
    setProducts((p.data as AcademyRow[]) || []);
    setPlans((q.data as PlanRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const saveProduct = async (row: AcademyRow) => {
    if (!row.slug.trim() || !row.title.trim()) {
      toast.error("Preencha o endereco e o titulo do material.");
      return;
    }
    setSavingId(row.id || row.slug);
    const payload = { ...row } as Record<string, unknown>;
    delete payload.id;
    const { error } = row.id
      ? await supabase.from("academy_products").update(payload).eq("id", row.id)
      : await supabase.from("academy_products").insert(payload);
    setSavingId(null);
    if (error) {
      toast.error("Nao foi possivel salvar o material.");
      return;
    }
    toast.success(row.published ? "Material salvo e publicado." : "Material salvo como rascunho.");
    void load();
  };

  const savePlan = async (row: PlanRow) => {
    if (!row.plan_key.trim() || !row.name.trim()) {
      toast.error("Preencha a chave e o nome do plano.");
      return;
    }
    setSavingId(row.id || row.plan_key);
    const payload = { ...row } as Record<string, unknown>;
    delete payload.id;
    const { error } = row.id
      ? await supabase.from("pro_plans").update(payload).eq("id", row.id)
      : await supabase.from("pro_plans").insert(payload);
    setSavingId(null);
    if (error) {
      toast.error("Nao foi possivel salvar o plano.");
      return;
    }
    toast.success(row.published ? "Plano salvo e publicado." : "Plano salvo como rascunho.");
    void load();
  };

  const removeRow = async (table: "academy_products" | "pro_plans", id: string) => {
    if (!id) return;
    if (!window.confirm("Excluir este item? Essa acao nao pode ser desfeita.")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error("Nao foi possivel excluir.");
      return;
    }
    toast.success("Item excluido.");
    void load();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando catalogo...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-xl font-semibold text-white">Academy e planos</h1>
        <p className="mt-1 text-sm text-white/40">
          O que estiver marcado como publicado aparece no site. O que ficar como rascunho fica visivel
          somente aqui.
        </p>
      </header>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Materiais da Academy</h2>
          <button
            type="button"
            className={btnCls}
            onClick={() => setProducts((prev) => [...prev, emptyProduct(prev.length + 1)])}
          >
            <Plus className="h-4 w-4" /> Novo material
          </button>
        </div>

        {products.map((row, i) => (
          <div key={row.id || `new-${i}`} className={cardCls}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Titulo</label>
                <input
                  className={inputCls}
                  value={row.title}
                  onChange={(e) =>
                    setProducts((p) => p.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Endereco no site</label>
                <input
                  className={inputCls}
                  value={row.slug}
                  placeholder="ingles-para-atendimento-em-saude"
                  onChange={(e) =>
                    setProducts((p) => p.map((r, j) => (j === i ? { ...r, slug: e.target.value } : r)))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Formato</label>
                <input
                  className={inputCls}
                  value={row.format_label}
                  onChange={(e) =>
                    setProducts((p) => p.map((r, j) => (j === i ? { ...r, format_label: e.target.value } : r)))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Situacao</label>
                <select
                  className={inputCls}
                  value={row.status}
                  onChange={(e) =>
                    setProducts((p) =>
                      p.map((r, j) =>
                        j === i
                          ? {
                              ...r,
                              status: e.target.value,
                              status_label: e.target.value === "available" ? "Disponivel" : "Em preparacao",
                            }
                          : r,
                      ),
                    )
                  }
                >
                  <option value="available">A venda</option>
                  <option value="soon">Em preparacao</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Preco em reais</label>
                <input
                  className={inputCls}
                  value={brl(row.price_cents)}
                  placeholder="29,90"
                  onChange={(e) =>
                    setProducts((p) =>
                      p.map((r, j) => (j === i ? { ...r, price_cents: fromBrl(e.target.value) } : r)),
                    )
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Codigo de preco do Stripe</label>
                <input
                  className={inputCls}
                  value={row.stripe_price_id || ""}
                  placeholder="price_..."
                  onChange={(e) =>
                    setProducts((p) =>
                      p.map((r, j) => (j === i ? { ...r, stripe_price_id: e.target.value || null } : r)),
                    )
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Resumo</label>
                <textarea
                  className={inputCls}
                  rows={2}
                  value={row.summary}
                  onChange={(e) =>
                    setProducts((p) => p.map((r, j) => (j === i ? { ...r, summary: e.target.value } : r)))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Descricao (uma por linha)</label>
                <textarea
                  className={inputCls}
                  rows={4}
                  value={lines(row.description)}
                  onChange={(e) =>
                    setProducts((p) =>
                      p.map((r, j) => (j === i ? { ...r, description: toLines(e.target.value) } : r)),
                    )
                  }
                />
              </div>
              <div>
                <label className={labelCls}>O que tem dentro (uma por linha)</label>
                <textarea
                  className={inputCls}
                  rows={4}
                  value={lines(row.contents)}
                  onChange={(e) =>
                    setProducts((p) =>
                      p.map((r, j) => (j === i ? { ...r, contents: toLines(e.target.value) } : r)),
                    )
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Para quem e</label>
                <input
                  className={inputCls}
                  value={row.audience}
                  onChange={(e) =>
                    setProducts((p) => p.map((r, j) => (j === i ? { ...r, audience: e.target.value } : r)))
                  }
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={row.published}
                  onChange={(e) =>
                    setProducts((p) => p.map((r, j) => (j === i ? { ...r, published: e.target.checked } : r)))
                  }
                />
                Publicado no site
              </label>
              <button
                type="button"
                className={btnCls}
                disabled={savingId === (row.id || row.slug)}
                onClick={() => void saveProduct(row)}
              >
                {savingId === (row.id || row.slug) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {row.published ? "Salvar e publicar" : "Salvar rascunho"}
              </button>
              {row.id && (
                <button
                  type="button"
                  className={btnCls}
                  onClick={() => void removeRow("academy_products", row.id)}
                >
                  <Trash2 className="h-4 w-4" /> Excluir
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Planos do SalbCare Pro</h2>
          <button
            type="button"
            className={btnCls}
            onClick={() => setPlans((prev) => [...prev, emptyPlan(prev.length + 1)])}
          >
            <Plus className="h-4 w-4" /> Novo plano
          </button>
        </div>

        {plans.map((row, i) => (
          <div key={row.id || `new-plan-${i}`} className={cardCls}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Nome</label>
                <input
                  className={inputCls}
                  value={row.name}
                  onChange={(e) => setPlans((p) => p.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
                />
              </div>
              <div>
                <label className={labelCls}>Chave interna</label>
                <input
                  className={inputCls}
                  value={row.plan_key}
                  placeholder="completo"
                  onChange={(e) =>
                    setPlans((p) => p.map((r, j) => (j === i ? { ...r, plan_key: e.target.value } : r)))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Cobranca</label>
                <select
                  className={inputCls}
                  value={row.billing_interval}
                  onChange={(e) =>
                    setPlans((p) => p.map((r, j) => (j === i ? { ...r, billing_interval: e.target.value } : r)))
                  }
                >
                  <option value="month">Por mes</option>
                  <option value="year">Por ano</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Preco em reais</label>
                <input
                  className={inputCls}
                  value={brl(row.price_cents)}
                  placeholder="89,00"
                  onChange={(e) =>
                    setPlans((p) =>
                      p.map((r, j) => (j === i ? { ...r, price_cents: fromBrl(e.target.value) ?? 0 } : r)),
                    )
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Codigo de preco do Stripe</label>
                <input
                  className={inputCls}
                  value={row.stripe_price_id || ""}
                  placeholder="price_..."
                  onChange={(e) =>
                    setPlans((p) =>
                      p.map((r, j) => (j === i ? { ...r, stripe_price_id: e.target.value || null } : r)),
                    )
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Itens inclusos (um por linha)</label>
                <textarea
                  className={inputCls}
                  rows={4}
                  value={lines(row.features)}
                  onChange={(e) =>
                    setPlans((p) => p.map((r, j) => (j === i ? { ...r, features: toLines(e.target.value) } : r)))
                  }
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={row.highlight}
                  onChange={(e) =>
                    setPlans((p) => p.map((r, j) => (j === i ? { ...r, highlight: e.target.checked } : r)))
                  }
                />
                Destacar como recomendado
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={row.published}
                  onChange={(e) =>
                    setPlans((p) => p.map((r, j) => (j === i ? { ...r, published: e.target.checked } : r)))
                  }
                />
                Publicado no site
              </label>
              <button
                type="button"
                className={btnCls}
                disabled={savingId === (row.id || row.plan_key)}
                onClick={() => void savePlan(row)}
              >
                {savingId === (row.id || row.plan_key) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {row.published ? "Salvar e publicar" : "Salvar rascunho"}
              </button>
              {row.id && (
                <button type="button" className={btnCls} onClick={() => void removeRow("pro_plans", row.id)}>
                  <Trash2 className="h-4 w-4" /> Excluir
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default AdminAcademyCatalog;
