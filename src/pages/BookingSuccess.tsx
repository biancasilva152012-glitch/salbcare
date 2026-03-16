import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

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

        <h1 className="text-2xl font-bold">Consulta agendada com sucesso! ✅</h1>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Seu pagamento foi confirmado! Você receberá a confirmação por{" "}
            <span className="text-primary font-semibold">WhatsApp</span> e{" "}
            <span className="text-primary font-semibold">e-mail</span> com o link de acesso à videochamada.
          </p>

          <div className="glass-card p-4 text-left space-y-2">
            <p className="text-xs text-muted-foreground">
              📱 Acesse o link <strong>5 minutos antes</strong> do horário agendado
            </p>
            <p className="text-xs text-muted-foreground">
              ❌ Precisa cancelar? Faça com até <strong>2h de antecedência</strong> para reembolso total
            </p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          O pagamento foi processado com segurança pela Stripe. O valor será transferido
          ao profissional após a realização da consulta.
        </p>
      </motion.div>
    </div>
  );
};

export default BookingSuccess;
