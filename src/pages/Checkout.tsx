import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, PlanKey } from "@/config/plans";
import { motion } from "framer-motion";
import { QrCode, Copy, Upload, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const PIX_KEY = "88996924700";

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planKey = (searchParams.get("plan") || "basic") as PlanKey;
  const plan = PLANS[planKey] || PLANS.basic;
  const { user } = useAuth();

  const [mode, setMode] = useState<"select" | "auto" | "manual">("select");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast.success("Chave PIX copiada!");
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-receipts")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          plan: planKey,
          payment_status: "pending_approval",
          trial_start_date: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      navigate("/payment-success?method=manual");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePixAuto = async () => {
    if (!user) return;
    try {
      // Simulate auto PIX — in production integrate with Stripe/payment gateway
      const { error } = await supabase
        .from("profiles")
        .update({
          plan: planKey,
          payment_status: "active",
          trial_start_date: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      if (error) throw error;
      navigate("/payment-success?method=auto");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <button onClick={() => mode === "select" ? navigate(-1) : setMode("select")} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6">
          <h1 className="text-xl font-bold">Assinar {plan.name}</h1>
          <p className="text-2xl font-bold text-primary mt-1">R$ {plan.price}<span className="text-sm text-muted-foreground font-normal">/mês</span></p>
        </motion.div>

        {mode === "select" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <p className="text-sm text-muted-foreground text-center mb-4">Escolha como pagar</p>

            <button
              onClick={() => setMode("auto")}
              className="glass-card p-4 w-full flex items-center gap-4 text-left hover:ring-1 hover:ring-primary transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">PIX Automático</p>
                <p className="text-xs text-muted-foreground">QR Code com liberação imediata</p>
              </div>
            </button>

            <button
              onClick={() => setMode("manual")}
              className="glass-card p-4 w-full flex items-center gap-4 text-left hover:ring-1 hover:ring-primary transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Copy className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">PIX Manual</p>
                <p className="text-xs text-muted-foreground">Copie a chave e envie o comprovante</p>
              </div>
            </button>
          </motion.div>
        )}

        {mode === "auto" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="glass-card p-6 flex flex-col items-center gap-4">
              <div className="w-48 h-48 bg-accent rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                <div className="text-center">
                  <QrCode className="h-20 w-20 text-primary mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground">QR Code PIX</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Escaneie o QR Code acima com o app do seu banco
              </p>
            </div>
            <Button onClick={handlePixAuto} className="w-full gradient-primary font-semibold py-5">
              Confirmar Pagamento
            </Button>
          </motion.div>
        )}

        {mode === "manual" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="glass-card p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Chave PIX</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-accent px-3 py-2 rounded text-sm font-mono">{PIX_KEY}</code>
                  <Button size="sm" variant="outline" onClick={handleCopyPix} className="gap-1">
                    <Copy className="h-3.5 w-3.5" /> Copiar
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Enviar comprovante</p>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="bg-accent border-border"
                />
                {file && (
                  <p className="text-xs text-success mt-1 flex items-center gap-1">
                    <Check className="h-3 w-3" /> {file.name}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full gradient-primary font-semibold py-5 gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Enviando..." : "Enviar Comprovante"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
