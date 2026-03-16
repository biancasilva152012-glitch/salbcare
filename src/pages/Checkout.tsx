import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, PlanKey } from "@/config/plans";
import { motion } from "framer-motion";
import { Copy, Upload, Check, ArrowLeft, Loader2, ShieldCheck, AlertTriangle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const PIX_KEY = "88996924700";

type ValidationResult = {
  status: "idle" | "uploading" | "validating" | "confirmed" | "manual_review" | "error";
  message?: string;
};

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planKey = (searchParams.get("plan") || "basic") as PlanKey;
  const plan = PLANS[planKey] || PLANS.basic;
  const { user, refreshSubscription } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult>({ status: "idle" });

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast.success("Chave PIX copiada!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setValidation({ status: "idle" });
    if (selected && selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    // Step 1: Upload file
    setValidation({ status: "uploading", message: "Enviando comprovante..." });
    try {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-receipts")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Step 2: Validate with AI
      setValidation({ status: "validating", message: "Analisando comprovante com IA..." });

      const { data, error } = await supabase.functions.invoke("validate-pix-receipt", {
        body: {
          file_path: filePath,
          plan_key: planKey,
          expected_amount: plan.price,
        },
      });

      if (error) throw error;

      if (data?.validated) {
        setValidation({ status: "confirmed", message: "Pagamento confirmado automaticamente!" });
        await refreshSubscription();
        setTimeout(() => navigate("/payment-success?method=pix-auto"), 2000);
      } else {
        setValidation({
          status: "manual_review",
          message: data?.reason || "Não foi possível validar automaticamente, aguarde a revisão manual.",
        });
        await refreshSubscription();
      }
    } catch (err) {
      console.error(err);
      setValidation({
        status: "error",
        message: "Ocorreu um erro. Tente novamente.",
      });
    }
  };

  const isProcessing = validation.status === "uploading" || validation.status === "validating";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6">
          <h1 className="text-xl font-bold">Assinar {plan.name}</h1>
          <p className="text-2xl font-bold text-primary mt-1">
            R$ {plan.price}
            <span className="text-sm text-muted-foreground font-normal">/mês</span>
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* PIX Key */}
          <div className="glass-card p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                1. Faça o Pix para a chave abaixo
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-accent px-3 py-2 rounded text-sm font-mono">{PIX_KEY}</code>
                <Button size="sm" variant="outline" onClick={handleCopyPix} className="gap-1">
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Valor exato: <span className="font-semibold text-foreground">R$ {plan.price},00</span>
              </p>
            </div>

            {/* Upload */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                2. Envie o print do comprovante
              </p>
              <label className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-accent/30">
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-40 rounded-lg object-contain" />
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Toque para selecionar imagem</span>
                  </>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {file && (
                <p className="text-xs text-success mt-1.5 flex items-center gap-1">
                  <Check className="h-3 w-3" /> {file.name}
                </p>
              )}
            </div>
          </div>

          {/* Validation Status */}
          {validation.status === "confirmed" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-5 ring-2 ring-success/40 text-center space-y-2"
            >
              <ShieldCheck className="h-10 w-10 text-success mx-auto" />
              <p className="font-semibold text-success">{validation.message}</p>
              <p className="text-xs text-muted-foreground">Redirecionando...</p>
            </motion.div>
          )}

          {validation.status === "manual_review" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-5 ring-2 ring-warning/40 space-y-3"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-warning shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Revisão manual necessária</p>
                  <p className="text-xs text-muted-foreground">{validation.message}</p>
                </div>
              </div>
              <Button onClick={() => navigate("/dashboard")} variant="outline" className="w-full" size="sm">
                Ir para o painel
              </Button>
            </motion.div>
          )}

          {validation.status === "error" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-4 ring-1 ring-destructive/40 text-center"
            >
              <p className="text-sm text-destructive">{validation.message}</p>
            </motion.div>
          )}

          {/* Submit button */}
          {validation.status !== "confirmed" && validation.status !== "manual_review" && (
            <Button
              onClick={handleUpload}
              disabled={!file || isProcessing}
              className="w-full gradient-primary font-semibold py-5 gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {validation.message}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Enviar Comprovante
                </>
              )}
            </Button>
          )}

          <p className="text-[10px] text-center text-muted-foreground">
            Nosso sistema valida automaticamente via IA. Se não conseguir ler o comprovante, ele será revisado manualmente em até 24h.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
