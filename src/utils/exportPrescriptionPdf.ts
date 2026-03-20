import jsPDF from "jspdf";
import { format } from "date-fns";
import { getProfessionConfig } from "@/config/professions";

export interface PrescriptionPdfData {
  doctorName: string;
  professionalType: string;
  doctorCrm: string;
  doctorCouncilState?: string;
  patientName: string;
  patientCpf?: string;
  prescription: string;
  certificate: string;
  notes: string;
  officeAddress?: string;
}

export function generatePrescriptionPdf(data: PrescriptionPdfData): jsPDF {
  const config = getProfessionConfig(data.professionalType || "medico");
  const doc = new jsPDF({ format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
  const today = format(new Date(), "dd/MM/yyyy");
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const signatureTitle = data.professionalType === "dentista" ? "Cirurgião(ã)-Dentista" : config.label;
  const normalizedCouncilNumber = data.doctorCrm?.trim() || "";
  const normalizedCouncilState = data.doctorCouncilState?.trim().toUpperCase() || "";
  const councilRegistrationText = normalizedCouncilNumber
    ? data.professionalType === "dentista" && normalizedCouncilState
      ? `CRO-${normalizedCouncilState} Nº ${normalizedCouncilNumber}`
      : `${config.councilPrefix}${normalizedCouncilState ? `-${normalizedCouncilState}` : ""} ${normalizedCouncilNumber}`
    : config.label;

  // ── Header ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 36, "F");
  doc.setFillColor(45, 212, 191);
  doc.rect(0, 36, pageWidth, 1.5, "F");

  doc.setTextColor(45, 212, 191);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SALBCARE", margin, 16);

  doc.setTextColor(200, 210, 220);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.doctorName, margin, 24);
  const councilText = normalizedCouncilNumber
    ? `${signatureTitle} — ${councilRegistrationText}`
    : signatureTitle;
  doc.text(councilText, margin, 30);

  if (data.officeAddress) {
    doc.setFontSize(7.5);
    doc.setTextColor(160, 170, 180);
    const addrLines = doc.splitTextToSize(data.officeAddress, contentWidth / 2);
    doc.text(addrLines, pageWidth - margin, 24, { align: "right" });
  }

  doc.setTextColor(160, 170, 180);
  doc.setFontSize(8);
  doc.text(`Emitido em ${now}`, pageWidth - margin, 33, { align: "right" });

  let y = 48;

  // ── Document title ──
  const docTitle = data.prescription.trim()
    ? config.prescriptionTitle
    : data.certificate.trim()
      ? config.certificateTitle
      : config.prescriptionTitle;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(docTitle, margin, y);
  y += 10;

  // ── Patient info box ──
  const patientBoxH = data.patientCpf ? 20 : 14;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y - 4, contentWidth, patientBoxH, 2, 2, "F");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Paciente:", margin + 4, y + 4);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(data.patientName, margin + 28, y + 4);

  if (data.patientCpf) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.setFontSize(9);
    doc.text(`CPF: ${data.patientCpf}`, margin + 4, y + 12);
  }

  y += patientBoxH + 6;

  // ── Date ──
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text(`Data de emissão: ${today}`, margin, y);
  y += 8;

  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Helper: check page break
  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 40) {
      doc.addPage();
      y = 20;
    }
  };

  // ── Prescription section ──
  if (data.prescription.trim()) {
    checkPage(30);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Medicamentos e Posologia", margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const prescLines = doc.splitTextToSize(data.prescription, contentWidth);
    for (const line of prescLines) {
      checkPage(6);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 6;
  }

  // ── Certificate section ──
  if (data.certificate.trim()) {
    checkPage(30);
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(config.certificateTitle, margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const certLines = doc.splitTextToSize(data.certificate, contentWidth);
    for (const line of certLines) {
      checkPage(6);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 6;
  }

  // ── Notes section ──
  if (data.notes.trim()) {
    checkPage(30);
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Orientações", margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const noteLines = doc.splitTextToSize(data.notes, contentWidth);
    for (const line of noteLines) {
      checkPage(6);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 6;
  }

  // ── Signature block ──
  checkPage(55);
  y += 16;

  // Signature line
  const sigLineW = 80;
  const cx = pageWidth / 2;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(cx - sigLineW / 2, y, cx + sigLineW / 2, y);
  y += 5;

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(data.doctorName, cx, y, { align: "center" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.setFontSize(8);
  doc.text(signatureTitle, cx, y, { align: "center" });
  y += 4;

  doc.setFontSize(7.5);
  doc.setTextColor(130);
  doc.text(councilRegistrationText, cx, y, { align: "center" });

  // ── Footer on all pages ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageHeight - 14, pageWidth, 14, "F");
    doc.setFillColor(45, 212, 191);
    doc.rect(0, pageHeight - 14, pageWidth, 0.8, "F");

    doc.setFontSize(6.5);
    doc.setTextColor(160, 170, 180);
    doc.text(
      "Documento gerado pela SalbCare — salbcare.com.br",
      margin, pageHeight - 6
    );
    doc.text(
      `Pág. ${i}/${pageCount}`,
      pageWidth - margin, pageHeight - 6, { align: "right" }
    );
  }

  return doc;
}
