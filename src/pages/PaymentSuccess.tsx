import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const method = searchParams.get("method");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>

        <h1 className="text-2xl font-bold">
          {method === "manual" ? "Comprovante Enviado!" : "Pagamento Recebido!"}
        </h1>

        {method === "manual" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Recebemos seu comprovante! Seu acesso está com status{" "}
              <span className="text-yellow-400 font-semibold">Aguardando Aprovação</span>.
              Validaremos em até 24h.
            </p>
            <div className="glass-card p-4 text-left">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Se você escolheu o plano com contador, nossa equipe jurídica e contábil entrará em contato via{" "}
                  <span className="text-primary font-semibold">WhatsApp</span> em até 24h para iniciar a gestão do seu CNPJ e das suas Notas Fiscais.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Recebemos seu pagamento! Se você escolheu o plano com contador, nossa equipe jurídica e contábil
              entrará em contato via <span className="text-primary font-semibold">WhatsApp</span> em até 24h para
              iniciar a gestão do seu CNPJ e das suas Notas Fiscais.
            </p>
            <p className="text-lg font-semibold text-primary">
              Bem-vindo(a) à SALBCARE!
            </p>
          </div>
        )}

        <Button onClick={() => navigate("/dashboard")} className="w-full gradient-primary font-semibold py-5">
          Ir para o Painel
        </Button>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
