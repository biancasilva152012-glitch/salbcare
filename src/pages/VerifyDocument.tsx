import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldX, ShieldAlert, Search, Loader2, Copy, Check, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";

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

type Status = "idle" | "loading" | "valid" | "expired" | "not_found" | "error";

const FAIXA_LABELS: Record<string, string> = {
  iniciante: "Iniciante",
  desenvolvimento: "Em desenvolvimento",
  estabelecido: "Estabelecido",
  premium: "Premium",
  elite: "Elite",
};

const TIPO_LABELS: Record<string, string> = {
  comprovante_renda: "Comprovante de Renda SalbCare",
  certidao_atividade: "Certidão de Atividade Profissional",
  selo_publico: "Selo Verificado Público",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  prescription: "Receita Digital",
  medical_certificate: "Atestado Digital",
  exam_request: "Pedido de Exames",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const VerifyDocument = () => {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const initialHash = params.hash || searchParams.get("hash") || "";
  const [hash, setHash] = useState(initialHash);
  const [status, setStatus] = useState<Status>("idle");
  const [docResult, setDocResult] = useState<DocumentResult | null>(null);
  const [salbResult, setSalbResult] = useState<SalbScoreDocResult | null>(null);
  const [verifiedHash, setVerifiedHash] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleVerify = async (h?: string) => {
    const target = (h ?? hash).trim().toUpperCase();
    if (!target) return;
    setStatus("loading");
    setDocResult(null);
    setSalbResult(null);
    setErrorMsg("");
    try {
      if (target.startsWith("SALB-")) {
        const { data, error } = await supabase.rpc("verify_salbscore_document_by_hash", { _hash: target });
        if (error) throw error;
        const row = (Array.isArray(data) ? data[0] ?? null : data) as SalbScoreDocResult | null;
        setVerifiedHash(target);
        if (!row) setStatus("not_found");
        else {
          setSalbResult(row);
          setStatus(row.is_valid ? "valid" : "expired");
        }
      } else {
        const { data, error } = await supabase.rpc("verify_document_by_hash", { _hash: target });
        if (error) throw error;
        const row = (Array.isArray(data) ? data[0] ?? null : data) as DocumentResult | null;
        setVerifiedHash(target);
        if (!row) setStatus("not_found");
        else {
          setDocResult(row);
          setStatus("valid");
        }
      }
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Falha ao consultar o documento.");
    }
  };

  useEffect(() => {
    if (initialHash) handleVerify(initialHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHash]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(verifiedHash || hash);
      setCopied(true);
      toast.success("Código copiado");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const banner = useMemo(() => {
    switch (status) {
      case "valid":
        return {
          tone: "valid" as const,
          title: "Documento autêntico",
          subtitle: "Emitido pela plataforma SalbCare e válido nesta data.",
          icon: <ShieldCheck className="h-5 w-5" />,
        };
      case "expired":
        return {
          tone: "warn" as const,
          title: "Documento autêntico, porém vencido",
          subtitle: "O conteúdo é genuíno, mas o período de validade expirou.",
          icon: <ShieldAlert className="h-5 w-5" />,
        };
      case "not_found":
        return {
          tone: "invalid" as const,
          title: "Documento não encontrado",
          subtitle: "Nenhum documento corresponde a este código na SalbCare.",
          icon: <ShieldX className="h-5 w-5" />,
        };
      case "error":
        return {
          tone: "invalid" as const,
          title: "Falha na verificação",
          subtitle: errorMsg || "Tente novamente em instantes.",
          icon: <ShieldX className="h-5 w-5" />,
        };
      default:
        return null;
    }
  }, [status, errorMsg]);

  return (
    <div className="min-h-screen bg-background flex items-start sm:items-center justify-center px-4 py-10">
      <SEOHead
        noindex={true}
        title="Verificar Documento | SALBCARE"
        description="Verifique a autenticidade de documentos digitais e comprovantes SalbScore emitidos pela plataforma SalbCare."
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-6"
      >
        <header className="text-center space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">SalbCare</p>
          <h1 className="text-2xl font-semibold tracking-tight">Verificação de documento</h1>
          <p className="text-sm text-muted-foreground">
            Confirme se um documento ou comprovante foi realmente emitido pela plataforma.
          </p>
        </header>

        <div className="glass-card p-4 sm:p-5 space-y-3">
          <label htmlFor="doc-hash" className="text-xs font-medium text-muted-foreground">
            Código do documento
          </label>
          <div className="flex gap-2">
            <Input
              id="doc-hash"
              placeholder="Ex.: SALB-A1B2-C3D4-XY9Z"
              value={hash}
              onChange={(e) => setHash(e.target.value.toUpperCase())}
              className="bg-accent border-border font-mono text-sm tracking-wide"
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              autoComplete="off"
              spellCheck={false}
            />
            <Button
              onClick={() => handleVerify()}
              disabled={status === "loading" || !hash.trim()}
              className="gradient-primary shrink-0"
              aria-label="Verificar"
            >
              {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            O código está impresso no rodapé ou QR code do documento. Não diferenciamos maiúsculas e minúsculas.
          </p>
        </div>

        {banner && (
          <motion.section
            key={status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden"
            aria-live="polite"
          >
            <div
              className={
                "flex items-start gap-3 px-4 sm:px-5 py-4 border-b border-border " +
                (banner.tone === "valid"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : banner.tone === "warn"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-destructive/10 text-destructive")
              }
            >
              <div className="mt-0.5">{banner.icon}</div>
              <div className="space-y-0.5">
                <p className="font-semibold text-sm">{banner.title}</p>
                <p className="text-xs opacity-90">{banner.subtitle}</p>
              </div>
            </div>

            {(status === "valid" || status === "expired") && (salbResult || docResult) && (
              <div className="px-4 sm:px-5 py-4 space-y-4">
                <dl className="space-y-2.5 text-sm">
                  {salbResult ? (
                    <>
                      <Row label="Tipo" value={TIPO_LABELS[salbResult.tipo] ?? salbResult.tipo} />
                      <Row label="Profissional" value={salbResult.professional_name_partial || "—"} />
                      <Row label="Conselho" value={salbResult.conselho || "—"} />
                      <Row
                        label="SalbScore na emissão"
                        value={`${salbResult.score_emissao} · ${FAIXA_LABELS[salbResult.faixa_emissao] ?? salbResult.faixa_emissao}`}
                      />
                      <Row label="Emitido em" value={formatDate(salbResult.emitido_em)} />
                      <Row label="Válido até" value={formatDate(salbResult.valido_ate)} />
                    </>
                  ) : docResult ? (
                    <>
                      <Row
                        label="Tipo"
                        value={DOC_TYPE_LABELS[docResult.document_type] ?? docResult.document_type}
                      />
                      <Row label="Profissional" value={docResult.professional_name} />
                      <Row
                        label="Conselho"
                        value={
                          docResult.council_number
                            ? `${docResult.council_number}${docResult.council_state ? " / " + docResult.council_state : ""}`
                            : "—"
                        }
                      />
                      <Row label="Paciente" value={docResult.patient_name} />
                      <Row label="Emitido em" value={formatDateTime(docResult.created_at)} />
                      <Row
                        label="Assinatura ICP-Brasil"
                        value={docResult.signed_icp ? "Assinado digitalmente" : "Sem assinatura ICP-Brasil"}
                      />
                    </>
                  ) : null}
                </dl>

                <div className="rounded-md bg-muted/40 border border-border px-3 py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Código</p>
                    <p className="font-mono text-xs truncate">{verifiedHash}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleCopy}
                      aria-label="Copiar código"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => window.print()}
                      aria-label="Imprimir comprovação"
                      className="hidden sm:inline-flex"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {(status === "not_found" || status === "error") && (
              <div className="px-4 sm:px-5 py-4 space-y-2 text-xs text-muted-foreground">
                <p>Confira se digitou exatamente como aparece no documento, incluindo os traços.</p>
                <p>
                  Se o problema continuar, fale com quem emitiu o documento ou com o suporte da
                  SalbCare.
                </p>
              </div>
            )}
          </motion.section>
        )}

        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Voltar ao início
          </Link>
          <span aria-hidden>·</span>
          <a
            href="https://wa.me/5588996924700"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Falar com o suporte
          </a>
        </div>

        <p className="text-center text-[10px] text-muted-foreground">
          Verificação pública fornecida pela plataforma SalbCare.
        </p>
      </motion.div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-muted-foreground shrink-0">{label}</dt>
    <dd className="font-medium text-right break-words">{value}</dd>
  </div>
);

export default VerifyDocument;
