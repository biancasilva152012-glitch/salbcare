import { useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, MapPin, Clock, Star, BadgeCheck, ChevronRight, CalendarPlus, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const EXAM_CATEGORIES = [
  { label: "Sangue e bioquímica", discount: "Até 40% off", emoji: "🩸" },
  { label: "Imagem (Raio-X, US)", discount: "Até 30% off", emoji: "📷" },
  { label: "Check-up completo", discount: "Até 35% off", emoji: "✅" },
  { label: "Hormonais e tireoide", discount: "Até 25% off", emoji: "🧬" },
];

const MOCK_LABS = [
  {
    id: "1",
    name: "Laboratório Vida & Saúde",
    discount: "Até 40% off",
    address: "Av. Bezerra de Menezes, 200 — Fortaleza, CE",
    hours: "Seg–Sáb 6h–18h",
    featured: true,
    rating: 4.9,
    phone: "(85) 3222-0001",
    website: "https://vidasaude.com.br",
    exams: ["Hemograma", "Glicose", "TSH", "Raio-X"],
  },
  {
    id: "2",
    name: "DiagLab Exames",
    discount: "Até 35% off",
    address: "Rua Padre Valdevino, 880 — Fortaleza, CE",
    hours: "Seg–Sex 6h30–17h",
    featured: true,
    rating: 4.7,
    phone: "(85) 3244-5678",
    website: null,
    exams: ["Ultrassom", "Hemograma", "Urina", "Colesterol"],
  },
  {
    id: "3",
    name: "ClinExames Popular",
    discount: "Até 25% off",
    address: "Rua Costa Barros, 321 — Fortaleza, CE",
    hours: "Seg–Sex 7h–16h",
    featured: false,
    rating: 4.4,
    phone: "(85) 3255-9900",
    website: null,
    exams: ["Hemograma", "Glicose", "Eletrocardiograma"],
  },
];

interface ScheduleForm {
  labId: string;
  labName: string;
  examType: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
}

const LabTab = () => {
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [selectedLab, setSelectedLab] = useState<typeof MOCK_LABS[0] | null>(null);
  const [form, setForm] = useState<ScheduleForm>({
    labId: "",
    labName: "",
    examType: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const openSchedule = (lab: typeof MOCK_LABS[0]) => {
    setSelectedLab(lab);
    setForm({ labId: lab.id, labName: lab.name, examType: "", preferredDate: "", preferredTime: "", notes: "" });
    setScheduleDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.examType || !form.preferredDate) {
      toast.error("Preencha o tipo de exame e a data desejada.");
      return;
    }
    setSubmitting(true);
    // Simulate scheduling (in production this would save to a table)
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setScheduleDialog(false);
    toast.success(`Solicitação enviada para ${form.labName}! Entraremos em contato para confirmar.`);
  };

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
            <FlaskConical className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Exames com desconto exclusivo</p>
            <p className="text-[11px] text-muted-foreground">Rede de laboratórios parceiros SALBCARE</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Agende exames nos laboratórios parceiros com descontos especiais. Basta informar que é paciente SALBCARE.
        </p>
      </motion.div>

      {/* Exam categories */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Categorias de exames</h3>
        <div className="grid grid-cols-2 gap-2">
          {EXAM_CATEGORIES.map((cat) => (
            <div key={cat.label} className="glass-card p-3 text-center space-y-1">
              <span className="text-lg">{cat.emoji}</span>
              <p className="text-[10px] font-medium leading-tight">{cat.label}</p>
              <p className="text-[10px] text-primary font-bold">{cat.discount}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lab directory */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Laboratórios parceiros</h3>
        <div className="space-y-2">
          {MOCK_LABS.map((lab, i) => (
            <motion.div
              key={lab.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-3 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-base">
                    🔬
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-semibold">{lab.name}</p>
                      {lab.featured && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                      {lab.rating}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                  {lab.discount}
                </span>
              </div>

              {/* Available exams */}
              <div className="flex flex-wrap gap-1">
                {lab.exams.map((exam) => (
                  <span key={exam} className="text-[9px] bg-accent text-muted-foreground rounded-full px-2 py-0.5">
                    {exam}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">{lab.address}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {lab.hours}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-muted-foreground px-2"
                    onClick={() => window.open(`tel:${lab.phone}`, "_self")}
                  >
                    <Phone className="h-3 w-3 mr-0.5" /> Ligar
                  </Button>
                  <Button
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => openSchedule(lab)}
                  >
                    <CalendarPlus className="h-3 w-3 mr-0.5" /> Agendar
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-3">
          Mais laboratórios serão adicionados em breve.
        </p>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialog} onOpenChange={setScheduleDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Agendar exame</DialogTitle>
            <DialogDescription className="text-xs">
              {selectedLab?.name} — preencha os dados para solicitar agendamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Tipo de exame *</Label>
              <Input
                placeholder="Ex: Hemograma, TSH, Raio-X..."
                value={form.examType}
                onChange={(e) => setForm({ ...form, examType: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Data desejada *</Label>
                <Input
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Horário preferido</Label>
                <Input
                  type="time"
                  value={form.preferredTime}
                  onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Observações</Label>
              <Input
                placeholder="Precisa de jejum? Alguma alergia?"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" className="w-full text-xs" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Enviando..." : "Solicitar agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabTab;
