import jsPDF from "jspdf";
import { format } from "date-fns";

interface PrescriptionData {
  doctorName: string;
  doctorType: string;
  doctorCrm: string;
  patientName: string;
  prescription: string;
  certificate: string;
  notes: string;
}

export function generatePrescriptionPdf(data: PrescriptionData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = format(new Date(), "dd/MM/yyyy");

  // Header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Teal accent line
  doc.setFillColor(45, 212, 191);
  doc.rect(0, 40, pageWidth, 2, "F");

  // Logo text
  doc.setTextColor(45, 212, 191);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SALBCARE", 14, 18);

  // Doctor info
  doc.setTextColor(200, 210, 220);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Dr(a). ${data.doctorName}`, 14, 28);
  doc.text(`${data.doctorType}${data.doctorCrm ? ` — ${data.doctorCrm}` : ""}`, 14, 34);

  // Date on right
  doc.setTextColor(160, 170, 180);
  doc.setFontSize(9);
  doc.text(today, pageWidth - 14, 28, { align: "right" });

  // Title
  let y = 54;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Receita Digital", 14, y);
  y += 10;

  // Patient
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Paciente:", 14, y);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(data.patientName, 42, y);
  y += 10;

  // Divider
  doc.setDrawColor(220);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  // Prescription section
  if (data.prescription.trim()) {
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Prescrição Médica", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const prescLines = doc.splitTextToSize(data.prescription, pageWidth - 28);
    doc.text(prescLines, 14, y);
    y += prescLines.length * 5 + 8;
  }

  // Certificate section
  if (data.certificate.trim()) {
    if (y > 230) { doc.addPage(); y = 20; }

    doc.setDrawColor(220);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Atestado Médico", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const certLines = doc.splitTextToSize(data.certificate, pageWidth - 28);
    doc.text(certLines, 14, y);
    y += certLines.length * 5 + 8;
  }

  // Notes
  if (data.notes.trim()) {
    if (y > 230) { doc.addPage(); y = 20; }

    doc.setDrawColor(220);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Orientações", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - 28);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 5 + 8;
  }

  // Signature area
  if (y > 240) { doc.addPage(); y = 20; }
  y += 16;
  doc.setDrawColor(15, 23, 42);
  doc.line(pageWidth / 2 - 40, y, pageWidth / 2 + 40, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(`Dr(a). ${data.doctorName}`, pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.setFontSize(9);
  doc.text(data.doctorType, pageWidth / 2, y, { align: "center" });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(
      `Documento gerado digitalmente via SalbCare — ${today} — Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  return doc;
}
