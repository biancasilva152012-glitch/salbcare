import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, Award, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";

interface PublicSalbScore {
  professional_name: string;
  professional_type: string;
  council_number: string | null;
  council_state: string | null;
  bio: string | null;
  avatar_url: string | null;
  profile_slug: string;
  score: number | null;
  faixa: string | null;
  calculado_em: string | null;
  meses_ativo: number;
}

const FAIXA_INFO: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  iniciante: { label: "Iniciante", color: "#9CA3AF", bg: "rgba(156,163,175,0.12)", desc: "Construindo histórico verificado" },
  desenvolvimento: { label: "Em desenvolvimento", color: "#60A5FA", bg: "rgba(96,165,250,0.12)", desc: "Ganhando consistência mês a mês" },
  estabelecido: { label: "Estabelecido", color: "#3B82F6", bg: "rgba(59,130,246,0.12)", desc: "Profissional consolidado na plataforma" },
  premium: { label: "Premium", color: "#00B4A0", bg: "rgba(0,180,160,0.12)", desc: "Alta confiabilidade comprovada" },
  elite: { label: "Elite", color: "#D4A017", bg: "rgba(212,160,23,0.14)", desc: "Topo da plataforma SalbCare" },
};

const SalbScoreSelo = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicSalbScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setLoading(false); setNotFound(true); return; }
    (async () => {
      try {
        const { data: rows, error } = await supabase.rpc("get_public_salbscore_by_slug", { _slug: slug });
        if (error) throw error;
        const row = Array.isArray(rows) ? rows[0] ?? null : rows;
        if (!row) setNotFound(true);
        else setData(row as PublicSalbScore);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <SEOHead title="Selo não encontrado | SalbCare" description="Este selo público não foi encontrado." />
        <div className="text-center space-y-3 max-w-sm">
          <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto" />
          <h1 className="text-lg font-semibold">Selo não encontrado</h1>
          <p className="text-sm text-muted-foreground">
            Este profissional não possui um selo SalbScore público ativo.
          </p>
          <Link to="/profissionais">
            <Button variant="outline" size="sm">Ver profissionais SalbCare</Button>
          </Link>
        </div>
      </div>
    );
  }

  const faixa = data.faixa ? FAIXA_INFO[data.faixa] ?? FAIXA_INFO.iniciante : null;
  const conselho =
    data.council_number && data.council_state
      ? `${(data.professional_type || "").toUpperCase()} ${data.council_state} ${data.council_number}`
      : (data.professional_type || "").toUpperCase();

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <SEOHead
        title={`${data.professional_name} — Selo Verificado SalbCare`}
        description={`SalbScore verificado de ${data.professional_name}. ${faixa?.desc ?? ""}`}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto space-y-6"
      >
        {/* Header credencial */}
        <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Award className="h-3.5 w-3.5" /> Selo Verificado SalbCare
          </div>

          {data.avatar_url ? (
            <img
              src={data.avatar_url}
              alt={data.professional_name}
              className="w-20 h-20 rounded-full mx-auto object-cover"
              style={{ border: "2px solid #00B4A0" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-xl font-semibold"
              style={{ background: "rgba(0,180,160,0.12)", color: "#00B4A0", border: "2px solid #00B4A0" }}
            >
              {data.professional_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
          )}

          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold" style={{ color: "#0D1B2A" }}>{data.professional_name}</h1>
            <p className="text-xs text-muted-foreground">{conselho}</p>
          </div>

          {/* Score */}
          {data.score !== null && faixa ? (
            <div
              className="rounded-xl py-5 px-4 space-y-1"
              style={{ background: faixa.bg, border: `1px solid ${faixa.color}33` }}
            >
              <div className="text-[11px] uppercase tracking-wider font-medium" style={{ color: faixa.color }}>
                SalbScore
              </div>
              <div className="text-4xl font-bold tracking-tight" style={{ color: "#0D1B2A" }}>
                {data.score}
                <span className="text-base text-muted-foreground font-normal"> / 1000</span>
              </div>
              <div className="text-sm font-medium" style={{ color: faixa.color }}>{faixa.label}</div>
              <div className="text-xs text-muted-foreground">{faixa.desc}</div>
            </div>
          ) : (
            <div className="rounded-xl py-4 px-4 bg-muted text-sm text-muted-foreground">
              Score ainda não calculado
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-muted/50 p-2.5">
              <div className="text-muted-foreground">Atividade</div>
              <div className="font-semibold" style={{ color: "#0D1B2A" }}>{data.meses_ativo} meses</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5">
              <div className="text-muted-foreground">Última atualização</div>
              <div className="font-semibold" style={{ color: "#0D1B2A" }}>
                {data.calculado_em
                  ? new Date(data.calculado_em).toLocaleDateString("pt-BR")
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        {data.bio && (
          <div className="rounded-xl border border-border/60 p-4 text-sm text-muted-foreground leading-relaxed">
            {data.bio}
          </div>
        )}

        <Link to={`/p/${data.profile_slug}`} className="block">
          <Button className="w-full" style={{ background: "#00B4A0" }}>
            Ver perfil completo <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>

        <p className="text-center text-[10px] text-muted-foreground">
          Selo emitido e verificado pela <strong>SalbCare</strong> · Plataforma de Saúde Digital
        </p>
      </motion.div>
    </div>
  );
};

export default SalbScoreSelo;
