import { useEffect, useState } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldX, Search, Loader2, FileText, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";

interface DocumentResult {
  professional_name: string;
  professional_type: string;
  council_number: string | null;
  council_state: string | null;
  patient_name: string;
  document_type: string;
  signed_icp: boolean;
  created_at: string;
}

interface SalbScoreDocResult {
  tipo: string;
  professional_name_partial: string;
  conselho: string;
  score_emissao: number;
  faixa_emissao: string;
  emitido_em: string;
  valido_ate: string;
  is_valid: boolean;
  dados_publicos: Record<string, unknown> | null;
}

const FAIXA_LABELS: Record<string, string> = {
  iniciante: "Iniciante",
  desenvolvimento: "Em desenvolvimento",
  estabelecido: "Estabelecido",
  premium: "Premium",
  elite: "Elite",
};

const TIPO_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  comprovante_renda: { label: "Comprovante de Renda SalbCare", icon: <FileText className="h-4 w-4" /> },
  certidao_atividade: { label: "Certidão de Atividade Profissional", icon: <ShieldCheck className="h-4 w-4" /> },
  selo_publico: { label: "Selo Verificado Público", icon: <Award className="h-4 w-4" /> },
};

const VerifyDocument = () => {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const initialHash = params.hash || searchParams.get("hash") || "";
  const [hash, setHash] = useState(initialHash);
  const [loading, setLoading] = useState(false);
  const [docResult, setDocResult] = useState<DocumentResult | null>(null);
  const [salbResult, setSalbResult] = useState<SalbScoreDocResult | null>(null);
  const [searched, setSearched] = useState(false);

  const handleVerify = async (h?: string) => {
    const target = (h ?? hash).trim().toUpperCase();
    if (!target) return;
    setLoading(true);
    setSearched(true);
    setDocResult(null);
    setSalbResult(null);
    try {
      // SalbScore docs começam com SALB-
      if (target.startsWith("SALB-")) {
        const { data } = await supabase.rpc("verify_salbscore_document_by_hash", { _hash: target });
        const row = Array.isArray(data) ? data[0] ?? null : data;
        setSalbResult(row as SalbScoreDocResult | null);
      } else {
        const { data } = await supabase.rpc("verify_document_by_hash", { _hash: target });
        const row = Array.isArray(data) ? data[0] ?? null : data;
        setDocResult(row as DocumentResult | null);
      }
    } catch {
      setDocResult(null);
      setSalbResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialHash) handleVerify(initialHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHash]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEOHead
        title="Verificar Documento | SALBCARE"
        description="Verifique a autenticidade de documentos digitais e comprovantes SalbScore emitidos pela plataforma SalbCare."
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Verificar Documento</h1>
          <p className="text-sm text-muted-foreground">
            Insira o código do documento para confirmar sua autenticidade junto à SalbCare.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Ex: SALB-A1B2-C3D4-XY9Z"
            value={hash}
            onChange={(e) => setHash(e.target.value.toUpperCase())}
            className="bg-accent border-border font-mono text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
          <Button onClick={() => handleVerify()} disabled={loading || !hash.trim()} className="gradient-primary shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {searched && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {salbResult ? (
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center gap-2" style={{ color: salbResult.is_valid ? "#00B4A0" : "#9CA3AF" }}>
                  {TIPO_LABELS[salbResult.tipo]?.icon ?? <ShieldCheck className="h-5 w-5" />}
                  <span className="font-semibold text-sm">
                    {salbResult.is_valid ? "Documento autêntico ✅" : "Documento autêntico, porém vencido"}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <Row label="Tipo" value={TIPO_LABELS[salbResult.tipo]?.label ?? salbResult.tipo} />
                  <Row label="Profissional" value={salbResult.professional_name_partial} />
                  <Row label="Conselho" value={salbResult.conselho || "—"} />
                  <Row label="SalbScore na emissão" value={`${salbResult.score_emissao} (${FAIXA_LABELS[salbResult.faixa_emissao] ?? salbResult.faixa_emissao})`} />
                  <Row label="Emitido em" value={new Date(salbResult.emitido_em).toLocaleDateString("pt-BR")} />
                  <Row label="Válido até" value={new Date(salbResult.valido_ate).toLocaleDateString("pt-BR")} />
                </div>
                <p className="text-[10px] text-muted-foreground break-all">
                  Hash: {hash}
                </p>
                <Link to="/profissionais" className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver outros profissionais SalbCare
                  </Button>
                </Link>
              </div>
            ) : docResult ? (
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="font-semibold text-sm">Documento Verificado ✅</span>
                </div>
                <div className="space-y-2 text-sm">
                  <Row label="Tipo" value={docResult.document_type === "prescription" ? "Receita Digital" : "Atestado Digital"} />
                  <Row label="Profissional" value={docResult.professional_name} />
                  <Row label="Conselho" value={docResult.council_number || "—"} />
                  <Row label="Paciente" value={docResult.patient_name} />
                  <Row label="Emitido em" value={new Date(docResult.created_at).toLocaleString("pt-BR")} />
                  <Row label="Assinatura ICP-Brasil" value={docResult.signed_icp ? "✅ Assinado digitalmente" : "⚠️ Sem assinatura ICP-Brasil"} />
                </div>
                <p className="text-[10px] text-muted-foreground">Hash: {hash}</p>
              </div>
            ) : (
              <div className="glass-card p-5 text-center space-y-2">
                <ShieldX className="h-8 w-8 text-destructive mx-auto" />
                <p className="font-semibold text-sm">Documento não encontrado</p>
                <p className="text-xs text-muted-foreground">
                  O código informado não corresponde a nenhum documento emitido pela plataforma SalbCare.
                </p>
              </div>
            )}
          </motion.div>
        )}

        <p className="text-center text-[10px] text-muted-foreground">
          Powered by <strong>SALBCARE</strong> — Plataforma de Saúde Digital
        </p>
      </motion.div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="font-medium text-right">{value}</span>
  </div>
);

export default VerifyDocument;
