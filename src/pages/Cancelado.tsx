import { motion } from "framer-motion";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openVersionedSubscriptionRoute } from "@/utils/subscriptionNavigation";

const Cancelado = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 max-w-md w-full text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <XCircle className="mx-auto h-16 w-16 text-destructive" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Pagamento cancelado</h1>
          <p className="text-sm text-muted-foreground">
            Você cancelou o processo de pagamento. Nenhuma cobrança foi realizada. Você pode tentar novamente quando quiser.
          </p>
        </div>

        <Button
          onClick={openVersionedSubscriptionRoute}
          variant="outline"
          className="w-full gap-2 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos planos
        </Button>
      </motion.div>
    </div>
  );
};

export default Cancelado;
