import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Link2 } from "lucide-react";

interface CreateTeleconsultationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  patients: { id: string; name: string; phone: string | null }[];
  defaultMeetLink?: string;
  onSuccess: () => void;
}

const CreateTeleconsultationModal = ({
  open,
  onOpenChange,
  userId,
  patients,
  defaultMeetLink = "",
  onSuccess,
}: CreateTeleconsultationModalProps) => {
  const [patientName, setPatientName] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");
  const [meetLink, setMeetLink] = useState(defaultMeetLink);
  const [saving, setSaving] = useState(false);

  const handlePatientSelect = (value: string) => {
    if (value === "new") {
      setSelectedPatientId(null);
      setPatientName("");
    } else {
      const patient = patients.find((p) => p.id === value);
      setSelectedPatientId(value);
      setPatientName(patient?.name || "");
    }
  };

  const handleSubmit = async () => {
    if (!patientName.trim() || !date || !time) {
      toast.error("Preencha nome do paciente, data e horário.");
      return;
    }

    setSaving(true);
    try {
      const dateTime = new Date(`${date}T${time}`).toISOString();
      const { error } = await supabase.from("teleconsultations").insert({
        user_id: userId,
        patient_name: patientName.trim(),
        patient_id: selectedPatientId,
        date: dateTime,
        duration: parseInt(duration),
        notes: notes.trim() || null,
        status: "scheduled",
        room_url: meetLink.trim() || null,
      });
      if (error) throw error;

      toast.success("Teleconsulta agendada com sucesso!");
      toast("Você acaba de economizar R$ 0 em comissões comparado a outras plataformas. Continue crescendo com a SALBCARE! 🚀", { duration: 5000 });
      onSuccess();
      onOpenChange(false);
      setPatientName("");
      setSelectedPatientId(null);
      setDate("");
      setTime("");
      setDuration("30");
      setNotes("");
      setMeetLink(defaultMeetLink);
    } catch {
      toast.error("Não conseguimos salvar. Tente de novo em instantes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Nova Teleconsulta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {patients.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Paciente cadastrado</Label>
              <Select onValueChange={handlePatientSelect}>
                <SelectTrigger className="bg-accent border-border">
                  <SelectValue placeholder="Selecionar paciente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Novo paciente</SelectItem>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Nome do paciente</Label>
            <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Nome completo"
              className="bg-accent border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Link2 className="h-3 w-3" /> Link do Google Meet
            </Label>
            <Input
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className="bg-accent border-border"
            />
            <p className="text-[10px] text-muted-foreground">
              Cole o link da sua sala do Google Meet. Se vazio, será usado o link padrão do perfil.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="bg-accent border-border text-foreground [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Horário</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-accent border-border text-foreground [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Duração (minutos)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="bg-accent border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Observações (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo da consulta, sintomas..."
              className="bg-accent border-border resize-none"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full gradient-primary font-semibold"
          >
            {saving ? "Agendando..." : "Agendar Teleconsulta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTeleconsultationModal;
