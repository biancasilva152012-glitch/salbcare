import { motion } from "framer-motion";
import { Star, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";
import { useState } from "react";
import { toast } from "sonner";

const lawyers = [
  { id: 1, name: "Dra. Fernanda Alves", specialty: "Direito Médico", price: 450, rating: 4.9, reviews: 87 },
  { id: 2, name: "Dr. Ricardo Mendes", specialty: "Direito Sanitário", price: 380, rating: 4.7, reviews: 63 },
  { id: 3, name: "Dra. Juliana Torres", specialty: "Responsabilidade Civil Médica", price: 500, rating: 4.8, reviews: 112 },
  { id: 4, name: "Dr. Marcos Pinto", specialty: "Regulação em Saúde", price: 320, rating: 4.6, reviews: 41 },
];

const Legal = () => {
  const [booked, setBooked] = useState<number[]>([]);

  const handleBook = (id: number, name: string) => {
    setBooked([...booked, id]);
    toast.success(`Consulta com "${name}" agendada!`);
  };

  return (
    <PageContainer>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Suporte Jurídico</h1>
          <p className="text-sm text-muted-foreground mt-1">Advogados especializados em direito da saúde</p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {lawyers.map((l) => (
            <div key={l.id} className="glass-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent">
                    <Scale className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{l.name}</h3>
                    <p className="text-xs text-muted-foreground">{l.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{l.rating}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-primary">R$ {l.price}</span>
                  <span className="text-xs text-muted-foreground">/consulta</span>
                </div>
                {booked.includes(l.id) ? (
                  <span className="text-sm font-medium text-success">Agendado ✓</span>
                ) : (
                  <Button onClick={() => handleBook(l.id, l.name)} size="sm" className="gradient-primary">
                    Agendar
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

export default Legal;
