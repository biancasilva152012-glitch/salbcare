import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Teleconsultation {
  patient_name: string;
  date: string;
  duration?: number | null;
  status: string;
  notes?: string | null;
  room_url?: string | null;
}

interface ExportParams {
  doctorName: string;
  professionalType?: string;
  doctorCrm?: string;
  startDate?: string; // ISO yyyy-mm-dd
  endDate?: string;
  statusFilter?: string;
  consultations: Teleconsultation[];
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  scheduled: "Confirmada",
  in_progress: "Em andamento",
  completed: "Encerrada",
};

export function exportTelehealthHistoryPdf({
  doctorName,
  professionalType,
  doctorCrm,
  startDate,
  endDate,
  statusFilter,
  consultations,
}: ExportParams) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Histórico de Teleconsultas", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const subtitle = `${doctorName}${doctorCrm ? ` — ${professionalType?.toUpperCase() || "CRM"} ${doctorCrm}` : ""}`;
  doc.text(subtitle, pageWidth / 2, 25, { align: "center" });

  // Filters summary
  const filterParts: string[] = [];
  if (startDate) filterParts.push(`De: ${new Date(startDate).toLocaleDateString("pt-BR")}`);
  if (endDate) filterParts.push(`Até: ${new Date(endDate).toLocaleDateString("pt-BR")}`);
  if (statusFilter && statusFilter !== "all")
    filterParts.push(`Status: ${STATUS_LABEL[statusFilter] || statusFilter}`);
  if (filterParts.length === 0) filterParts.push("Todos os registros");

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(filterParts.join("  •  "), pageWidth / 2, 32, { align: "center" });
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, pageWidth / 2, 37, { align: "center" });
  doc.setTextColor(0);

  // Table
  const rows = consultations.map((tc) => {
    const d = new Date(tc.date);
    return [
      d.toLocaleDateString("pt-BR"),
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      tc.patient_name,
      tc.duration ? `${tc.duration} min` : "—",
      STATUS_LABEL[tc.status] || tc.status,
      tc.notes || "—",
    ];
  });

  autoTable(doc, {
    startY: 44,
    head: [["Data", "Hora", "Paciente", "Duração", "Status", "Observações"]],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [13, 27, 42], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 16 },
      2: { cellWidth: 45 },
      3: { cellWidth: 18 },
      4: { cellWidth: 28 },
      5: { cellWidth: "auto" },
    },
  });

  // Footer with total
  const finalY = (doc as any).lastAutoTable?.finalY || 50;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${consultations.length} consulta(s)`, 14, finalY + 8);

  return doc;
}
