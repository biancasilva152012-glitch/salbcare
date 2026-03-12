import { motion } from "framer-motion";
import { Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { useState } from "react";
import { toast } from "sonner";

const partners = [
  { id: 1, name: "ContabilMed", specialty: "Contabilidade para profissionais de saúde", price: 299, rating: 4.8, reviews: 124 },
  { id: 2, name: "SaúdeContábil", specialty: "Especialistas em clínicas e consultórios", price: 349, rating: 4.6, reviews: 89 },
  { id: 3, name: "MedFinance", specialty: "Gestão fiscal e tributária médica", price: 279, rating: 4.9, reviews: 201 },
  { id: 4, name: "ContábilPro Saúde", specialty: "Contabilidade digital para autônomos", price: 199, rating: 4.5, reviews: 56 },
];

const Accounting = () => {
  const [hired, setHired] = useState<number[]>([]);

  const handleHire = (id: number, name: string) => {
    setHired([...hired, id]);
    toast.success(`Parceiro "${name}" contratado com sucesso!`);
  };

  return (
    <PageContainer>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Contabilidade</h1>
          <p className="text-sm text-muted-foreground mt-1">Encontre parceiros contábeis especializados em saúde</p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {partners.map((p) => (
            <div key={p.id} className="glass-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.specialty}</p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{p.rating}</span>
                  <span className="text-xs text-muted-foreground">({p.reviews})</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-primary">R$ {p.price}</span>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>
                {hired.includes(p.id) ? (
                  <div className="flex items-center gap-1 text-success text-sm font-medium">
                    <CheckCircle className="h-4 w-4" /> Contratado
                  </div>
                ) : (
                  <Button onClick={() => handleHire(p.id, p.name)} size="sm" className="gradient-primary">
                    Contratar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </PageContainer>
  );
};

export default Accounting;
