import { useState } from "react";
import { motion } from "framer-motion";
import { Pill, MapPin, Clock, QrCode, Download, Star, BadgeCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DISCOUNT_CATEGORIES = [
  { label: "Medicamentos controlados", discount: "Até 25% off", emoji: "💊" },
  { label: "Vitaminas e suplementos", discount: "Até 30% off", emoji: "🧬" },
  { label: "Fraldas e produtos de bebê", discount: "Até 20% off", emoji: "👶" },
  { label: "Dermocosméticos", discount: "Até 35% off", emoji: "✨" },
];

const MOCK_PHARMACIES = [
  {
    id: "1",
    name: "Farmácia Saúde Total",
    discount: "Até 30% off",
    address: "Rua das Flores, 123 — Fortaleza, CE",
    hours: "Seg–Sáb 7h–22h",
    featured: true,
    rating: 4.8,
  },
  {
    id: "2",
    name: "Drogaria Popular",
    discount: "Até 25% off",
    address: "Av. Santos Dumont, 456 — Fortaleza, CE",
    hours: "Seg–Dom 8h–21h",
    featured: false,
    rating: 4.5,
  },
  {
    id: "3",
    name: "Farmácia do Povo",
    discount: "Até 20% off",
    address: "Rua Barão de Aracati, 789 — Fortaleza, CE",
    hours: "Seg–Sex 8h–20h",
    featured: false,
    rating: 4.3,
  },
];

const PharmacyTab = () => {
  const { user } = useAuth();
  const [showQR, setShowQR] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["patient-profile-pharmacy", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const patientCode = user?.id?.substring(0, 8).toUpperCase() || "00000000";

  return (
    <div className="space-y-5">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Pill className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Descontos exclusivos em medicamentos</p>
            <p className="text-[11px] text-muted-foreground">Para pacientes SALBCARE</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Mostre seu QR Code na farmácia parceira e aproveite descontos especiais em medicamentos, vitaminas e mais.
        </p>
        <Button
          size="sm"
          className="w-full gradient-primary text-xs"
          onClick={() => setShowQR(true)}
        >
          <QrCode className="h-3.5 w-3.5 mr-1.5" />
          Ver meu QR Code
        </Button>
      </motion.div>

      {/* Discount categories */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Categorias de desconto</h3>
        <div className="grid grid-cols-2 gap-2">
          {DISCOUNT_CATEGORIES.map((cat) => (
            <div
              key={cat.label}
              className="glass-card p-3 text-center space-y-1"
            >
              <span className="text-lg">{cat.emoji}</span>
              <p className="text-[10px] font-medium leading-tight">{cat.label}</p>
              <p className="text-[10px] text-primary font-bold">{cat.discount}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pharmacy list */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Farmácias parceiras</h3>
        <div className="space-y-2">
          {MOCK_PHARMACIES.map((pharmacy, i) => (
            <motion.div
              key={pharmacy.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-3 space-y-1.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-base">
                    💊
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-semibold">{pharmacy.name}</p>
                      {pharmacy.featured && (
                        <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                      {pharmacy.rating}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                  {pharmacy.discount}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">{pharmacy.address}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {pharmacy.hours}
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary px-2">
                  Ver no mapa <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-3">
          Mais farmácias serão adicionadas em breve.
        </p>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Seu QR Code SALBCARE</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {/* QR Code placeholder using a visual representation */}
            <div className="relative">
              <div className="h-48 w-48 rounded-2xl bg-white p-3 flex items-center justify-center">
                <div className="h-full w-full rounded-xl border-4 border-foreground flex flex-col items-center justify-center gap-2">
                  <QrCode className="h-20 w-20 text-foreground" />
                  <span className="text-[10px] font-mono font-bold text-foreground">{patientCode}</span>
                </div>
              </div>
              <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                <Pill className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold">{profile?.name || "Paciente"}</p>
              <p className="text-[11px] text-muted-foreground">Código: {patientCode}</p>
              <p className="text-[10px] text-muted-foreground">
                Mostre este QR Code na farmácia parceira para receber seu desconto.
              </p>
            </div>
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Salvar na galeria
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PharmacyTab;
