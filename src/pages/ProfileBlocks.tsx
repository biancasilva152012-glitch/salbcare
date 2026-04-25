import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Crown, Lock } from "lucide-react";

const MODULE_LABEL: Record<string, string> = {
  prescriptions: "Receitas digitais",
  certificates: "Atestados digitais",
  telehealth: "Teleconsulta",
  public_directory: "Diretório público",
  patients_limit: "Limite de pacientes",
  mentorship_limit: "Limite de mentoria IA",
  appointments_limit: "Limite de agenda",
  financial_limit: "Limite financeiro",
};

type BlockEvent = {
  id: string;
  module: string;
  reason: string;
  created_at: string;
};

const ProfileBlocks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [events, setEvents] = useState<BlockEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    (async () => {
      let q = supabase
        .from("premium_block_attempts")
        .select("id, module, reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (from) q = q.gte("created_at", new Date(from).toISOString());
      if (to) q = q.lt("created_at", new Date(to).toISOString());
      const { data } = await q;
      if (active) {
        setEvents((data as BlockEvent[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user, from, to]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const e of events) acc[e.module] = (acc[e.module] ?? 0) + 1;
    return acc;
  }, [events]);

  const totalsList = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <PageContainer backTo="/profile">
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Atividades de bloqueio</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Mostra cada vez que você tentou acessar um recurso exclusivo do plano Essencial.
          Somente seus próprios eventos são exibidos.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-accent border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-accent border-border" />
          </div>
        </div>

        <div className="glass-card p-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
            Contagens por módulo
          </p>
          {totalsList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum bloqueio registrado no período.</p>
          ) : (
            <ul className="space-y-1.5">
              {totalsList.map(([mod, n]) => (
                <li key={mod} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    {MODULE_LABEL[mod] ?? mod}
                  </span>
                  <Badge variant="secondary">{n}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
            Histórico recente
          </p>
          {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!loading && events.length === 0 && (
            <p className="text-sm text-muted-foreground">Sem eventos no período.</p>
          )}
          {events.map((e) => (
            <div key={e.id} className="glass-card p-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{MODULE_LABEL[e.module] ?? e.module}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString("pt-BR")} • {e.reason}
                </p>
              </div>
              <Badge variant="outline">{e.reason}</Badge>
            </div>
          ))}
        </div>

        <Button onClick={() => navigate("/upgrade")} className="w-full gradient-primary">
          <Crown className="h-4 w-4 mr-2" />
          Assinar plano Essencial por R$ 89/mês
        </Button>
      </div>
    </PageContainer>
  );
};

export default ProfileBlocks;
