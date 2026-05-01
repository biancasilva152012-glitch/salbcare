import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { exportTelehealthHistoryPdf } from "@/utils/exportTelehealthHistoryPdf";
import { toast } from "sonner";

interface ExportHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultations: any[];
  doctorName: string;
  professionalType?: string;
  doctorCrm?: string;
}

const ExportHistoryModal = ({
  open,
  onOpenChange,
  consultations,
  doctorName,
  professionalType,
  doctorCrm,
}: ExportHistoryModalProps) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleExport = () => {
    let filtered = [...consultations];
    if (startDate) {
      filtered = filtered.filter((c) => new Date(c.date) >= new Date(startDate + "T00:00:00"));
    }
    if (endDate) {
      filtered = filtered.filter((c) => new Date(c.date) <= new Date(endDate + "T23:59:59"));
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (filtered.length === 0) {
      toast.error("Nenhuma teleconsulta encontrada nesse intervalo.");
      return;
    }

    const doc = exportTelehealthHistoryPdf({
      doctorName,
      professionalType,
      doctorCrm,
      startDate,
      endDate,
      statusFilter,
      consultations: filtered.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    });
    doc.save(`historico-teleconsultas-${Date.now()}.pdf`);
    toast.success(`${filtered.length} consulta(s) exportada(s)!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar histórico em PDF</DialogTitle>
          <DialogDescription>
            Filtre por intervalo de datas e status. Deixe em branco para exportar tudo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">De</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-accent border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Até</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-accent border-border"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-accent border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="scheduled">Confirmada</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="completed">Encerrada</SelectItem>
                <SelectItem value="pending_payment">Aguardando pagamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleExport} className="w-full gradient-primary gap-2">
            <Download className="h-4 w-4" /> Gerar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportHistoryModal;
