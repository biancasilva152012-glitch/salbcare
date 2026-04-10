import { useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldX, Search, Loader2 } from "lucide-react";
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

const VerifyDocument = () => {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const initialHash = params.hash || searchParams.get("hash") || "";
  const [hash, setHash] = useState(initialHash);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocumentResult | null>(null);
  const [searched, setSearched] = useState(false);

  const handleVerify = async () => {
    if (!hash.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await supabase
        .rpc("verify_document_by_hash", { _hash: hash.trim().toUpperCase() });
      const row = Array.isArray(data) ? data[0] ?? null : data;
      setResult(row as DocumentResult | null);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify if hash in URL
  useState(() => {
    if (initialHash) handleVerify();
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEOHead
        title="Verificar Documento | SALBCARE"
        description="Verifique a autenticidade de receitas e atestados digitais emitidos pela plataforma SALBCARE."
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
            Insira o código hash do documento para verificar sua autenticidade.
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
          <Button onClick={handleVerify} disabled={loading || !hash.trim()} className="gradient-primary shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {searched && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {result ? (
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="font-semibold text-sm">Documento Verificado ✅</span>
                </div>
                <div className="space-y-2 text-sm">
                  <Row label="Tipo" value={result.document_type === "prescription" ? "Receita Digital" : "Atestado Digital"} />
                  <Row label="Profissional" value={result.professional_name} />
                  <Row label="Conselho" value={result.council_number || "—"} />
                  <Row label="Paciente" value={result.patient_name} />
                  <Row label="Emitido em" value={new Date(result.created_at).toLocaleString("pt-BR")} />
                  <Row
                    label="Assinatura ICP-Brasil"
                    value={result.signed_icp ? "✅ Assinado digitalmente" : "⚠️ Sem assinatura ICP-Brasil"}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Hash: {hash}
                </p>
              </div>
            ) : (
              <div className="glass-card p-5 text-center space-y-2">
                <ShieldX className="h-8 w-8 text-destructive mx-auto" />
                <p className="font-semibold text-sm">Documento não encontrado</p>
                <p className="text-xs text-muted-foreground">
                  O código informado não corresponde a nenhum documento emitido pela plataforma SALBCARE.
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
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right">{value}</span>
  </div>
);

export default VerifyDocument;
