import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CREAM, GOLD, MONO, NAVY, ProLabel, brl } from "@/components/pro/brand";

type Row = {
  id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

type Plan = { plan_key: string; name: string; price_cents: number; billing_interval: string };

const muted = "rgba(31,31,31,0.66)";
const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "sem data");

const STATUS_LABEL: Record<string, string> = {
  active: "ativa",
  trialing: "em teste",
  past_due: "pagamento atrasado",
  canceled: "cancelada",
  incomplete: "pagamento incompleto",
  unpaid: "não paga",
};

const daysUntil = (iso?: string | null) => {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
};

/**
 * Histórico de assinaturas, próximos vencimentos e alertas de renovação.
 * Fonte: tabelas pro_subscriptions e pro_plans do banco.
 */
const ProSubscriptionPanel = ({ onManage }: { onManage: () => void }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [subs, planList] = await Promise.all([
      supabase
        .from("pro_subscriptions")
        .select("id, plan, status, current_period_end, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("pro_plans").select("plan_key, name, price_cents, billing_interval").eq("published", true),
    ]);
    setRows((subs.data as Row[]) ?? []);
    setPlans((planList.data as Plan[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const planName = (key: string) =>
    plans.find((p) => p.plan_key === key)?.name ??
    (key === "anual" || key === "annual" ? "Anual Fundador" : key === "completo" ? "Completo" : "Essencial");

  const planPrice = (key: string) => {
    const p = plans.find((pp) => pp.plan_key === key);
    return p ? brl(p.price_cents / 100) : null;
  };

  const current = rows[0];
  const days = daysUntil(current?.current_period_end);

  const alerts: string[] = [];
  if (current) {
    if (current.status === "past_due" || current.status === "unpaid") {
      alerts.push("O último pagamento não foi confirmado. Atualize o cartão para não perder o acesso.");
    }
    if (current.status === "trialing" && days !== null && days <= 3) {
      alerts.push(`Seu teste termina em ${days} dia(s). Depois disso a cobrança começa automaticamente.`);
    }
    if (current.status === "active" && days !== null && days >= 0 && days <= 7) {
      alerts.push(`Renovação em ${days} dia(s), no dia ${fmt(current.current_period_end)}.`);
    }
    if (current.status === "canceled" && current.current_period_end) {
      alerts.push(`Assinatura cancelada. O acesso vale até ${fmt(current.current_period_end)}.`);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="pro-card" style={{ display: "grid", gap: 12 }}>
        <ProLabel>Minha assinatura</ProLabel>
        {loading && <p style={{ margin: 0, fontSize: 13, color: muted }}>Carregando os dados da assinatura.</p>}
        {!loading && !current && (
          <p style={{ margin: 0, fontSize: 13, color: muted }}>
            Nenhuma assinatura registrada nesta conta ainda.
          </p>
        )}
        {current && (
          <>
            <div style={{ fontSize: 15 }}>
              Plano {planName(current.plan)}
              {planPrice(current.plan) ? ` · ${planPrice(current.plan)}` : ""} · {STATUS_LABEL[current.status] ?? current.status}
            </div>
            <div style={{ fontSize: 13, color: muted }}>
              Próximo vencimento: {fmt(current.current_period_end)}
              {days !== null && days >= 0 ? ` (em ${days} dia(s))` : ""}
            </div>
            <div style={{ fontSize: 13, color: muted }}>Assinatura iniciada em {fmt(current.created_at)}</div>
          </>
        )}
        <button className="pro-cta" style={{ background: GOLD, color: NAVY }} onClick={onManage}>
          Gerenciar pagamento
        </button>
      </div>

      {alerts.length > 0 && (
        <div className="pro-card" style={{ display: "grid", gap: 8 }}>
          <ProLabel>Alertas de renovação</ProLabel>
          {alerts.map((a) => (
            <p key={a} style={{ margin: 0, fontSize: 13.5 }}>
              {a}
            </p>
          ))}
        </div>
      )}

      <div className="pro-card" style={{ display: "grid", gap: 10 }}>
        <ProLabel>Histórico</ProLabel>
        {rows.length === 0 && (
          <p style={{ margin: 0, fontSize: 13, color: muted }}>O histórico aparece aqui depois da primeira cobrança.</p>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            style={{
              borderTop: "1px solid rgba(31,31,31,0.12)",
              paddingTop: 10,
              display: "grid",
              gap: 4,
              color: CREAM,
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 12.5 }}>
              {fmt(r.created_at)} · {planName(r.plan)}
            </div>
            <div style={{ fontSize: 13, color: muted }}>
              {STATUS_LABEL[r.status] ?? r.status} · período até {fmt(r.current_period_end)} · atualizada em{" "}
              {fmt(r.updated_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProSubscriptionPanel;
