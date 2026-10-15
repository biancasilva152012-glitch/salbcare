import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageContainer from "@/components/PageContainer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const fmt = (d: string) => new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("pt-BR");

const MeuPainel = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["meu-painel", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [p, a, c] = await Promise.all([
        supabase.from("patients").select("id, name, phone").eq("user_id", user!.id).order("name").limit(200),
        supabase.from("appointments").select("id, patient_name, date, time, status").eq("user_id", user!.id).gte("date", today).neq("status", "cancelled").neq("appointment_type", "blocked").order("date").order("time").limit(50),
        supabase.from("patient_consents").select("id, patient_name, procedure_name, signed_at").eq("user_id", user!.id).order("signed_at", { ascending: false }).limit(50),
      ]);
      return { patients: p.data || [], appts: a.data || [], consents: c.data || [] };
    },
  });

  const Section = ({ title, count, to, children }: any) => (
    <section className="space-y-2 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold">{title} <span className="font-mono text-sm text-muted-foreground">{count}</span></h2>
        <Link to={to} className="flex h-10 items-center text-xs text-primary underline">Abrir</Link>
      </div>
      {children}
    </section>
  );

  return (
    <PageContainer className="admin-theme" backTo="/dashboard">
      <p className="admin-eyebrow">Meu painel</p>
      <h1 className="font-heading mb-4 text-2xl font-semibold">Minhas clientes e consultas</h1>
      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-4">
          <Section title="Próximas consultas" count={data.appts.length} to="/dashboard/agendamentos">
            {data.appts.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma consulta futura.</p> : (
              <ul className="space-y-1 text-sm">{data.appts.slice(0, 10).map((x) => (
                <li key={x.id} className="flex justify-between gap-2"><span className="truncate">{x.patient_name}</span><span className="shrink-0 font-mono text-xs">{fmt(x.date)} {String(x.time).slice(0, 5)}</span></li>
              ))}</ul>
            )}
          </Section>
          <Section title="Clientes" count={data.patients.length} to="/dashboard/pacientes">
            {data.patients.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma cliente cadastrada.</p> : (
              <ul className="space-y-1 text-sm">{data.patients.slice(0, 10).map((x) => <li key={x.id} className="truncate">{x.name}</li>)}</ul>
            )}
          </Section>
          <Section title="Termos assinados" count={data.consents.length} to="/dashboard/pacientes">
            {data.consents.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum termo assinado.</p> : (
              <ul className="space-y-1 text-sm">{data.consents.slice(0, 10).map((x) => (
                <li key={x.id} className="flex justify-between gap-2"><span className="truncate">{x.patient_name}: {x.procedure_name}</span><span className="shrink-0 font-mono text-xs">{fmt(x.signed_at)}</span></li>
              ))}</ul>
            )}
          </Section>
        </div>
      )}
    </PageContainer>
  );
};

export default MeuPainel;
