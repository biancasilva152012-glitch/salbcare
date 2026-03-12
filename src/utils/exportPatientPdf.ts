import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientData {
  name: string;
  phone: string | null;
  email?: string | null;
  birth_date: string | null;
  notes: string | null;
  medical_history: string | null;
}

interface Appointment {
  date: string;
  time: string;
  appointment_type: string;
  notes: string | null;
  status: string;
}

interface Document {
  file_name: string;
  description: string | null;
  created_at: string;
}

export function exportPatientPdf(
  patient: PatientData,
  appointments: Appointment[],
  documents: Document[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 36, "F");
  doc.setTextColor(255);
  doc.setFontSize(20);
  doc.text("Prontuário do Paciente", 14, 16);
  doc.setFontSize(10);
  doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 14, 26);

  // Patient Info
  let y = 46;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.text(patient.name, 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100);

  const info: [string, string][] = [
    ["Telefone", patient.phone || "Não informado"],
    ["E-mail", patient.email || "Não informado"],
    ["Data de Nascimento", patient.birth_date
      ? format(new Date(patient.birth_date + "T12:00:00"), "dd/MM/yyyy")
      : "Não informada"],
  ];

  info.forEach(([label, value]) => {
    doc.setTextColor(120);
    doc.text(`${label}:`, 14, y);
    doc.setTextColor(30, 41, 59);
    doc.text(value, 55, y);
    y += 6;
  });

  // Notes
  if (patient.notes) {
    y += 4;
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Observações", 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(80);
    const lines = doc.splitTextToSize(patient.notes, pageWidth - 28);
    doc.text(lines, 14, y);
    y += lines.length * 4.5 + 4;
  }

  // Medical History
  if (patient.medical_history) {
    y += 2;
    doc.setDrawColor(200);
    doc.setFillColor(245, 247, 250);
    const histLines = doc.splitTextToSize(patient.medical_history, pageWidth - 34);
    const boxH = histLines.length * 4.5 + 16;
    doc.roundedRect(14, y, pageWidth - 28, boxH, 2, 2, "FD");
    y += 8;
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("Histórico Médico", 18, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text(histLines, 18, y);
    y += histLines.length * 4.5 + 6;
  }

  // Appointments
  if (appointments.length > 0) {
    y += 4;
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Histórico de Consultas", 14, y);
    y += 2;

    const rows = appointments
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((a) => [
        format(new Date(a.date + "T12:00:00"), "dd/MM/yyyy"),
        a.time,
        a.appointment_type === "presencial" ? "Presencial" : "Telehealth",
        a.status === "scheduled" ? "Agendada" : a.status === "completed" ? "Realizada" : a.status,
        a.notes || "—",
      ]);

    autoTable(doc, {
      startY: y,
      head: [["Data", "Hora", "Tipo", "Status", "Notas"]],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      columnStyles: { 4: { cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Documents list
  if (documents.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Documentos Anexados", 14, y);
    y += 2;

    const docRows = documents.map((d) => [
      d.file_name,
      d.description || "—",
      format(new Date(d.created_at), "dd/MM/yyyy"),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Arquivo", "Descrição", "Data"]],
      body: docRows,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text(
      `${patient.name} — Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  doc.save(`prontuario-${patient.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
