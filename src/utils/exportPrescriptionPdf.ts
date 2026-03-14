import jsPDF from "jspdf";
import { format } from "date-fns";
import { getProfessionConfig } from "@/config/professions";

interface PrescriptionData {
  doctorName: string;
  professionalType: string;
  doctorCrm: string;
  patientName: string;
  prescription: string;
  certificate: string;
  notes: string;
}

export function generatePrescriptionPdf(data: PrescriptionData): jsPDF {
  const config = getProfessionConfig(data.professionalType || "medico");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const today = format(new Date(), "dd/MM/yyyy");
  const now = format(new Date(), "dd/MM/yyyy 'às' HH:mm");

  // Generate unique document hash for verification
  const docHash = generateDocHash(data, now);

  // Header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setFillColor(45, 212, 191);
  doc.rect(0, 40, pageWidth, 2, "F");

  doc.setTextColor(45, 212, 191);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SALBCARE", 14, 18);

  doc.setTextColor(200, 210, 220);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.doctorName, 14, 28);
  doc.text(`${config.label}${data.doctorCrm ? ` — ${config.councilPrefix} ${data.doctorCrm}` : ""}`, 14, 34);

  doc.setTextColor(160, 170, 180);
  doc.setFontSize(9);
  doc.text(now, pageWidth - 14, 28, { align: "right" });

  let y = 54;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(config.prescriptionTitle, 14, y);
  y += 10;

  // Patient info box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, y - 4, pageWidth - 28, 14, 2, 2, "F");
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Paciente:", 18, y + 5);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(data.patientName, 46, y + 5);
  y += 18;

  doc.setDrawColor(220);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  if (data.prescription.trim()) {
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(config.prescriptionTitle, 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const prescLines = doc.splitTextToSize(data.prescription, pageWidth - 28);
    doc.text(prescLines, 14, y);
    y += prescLines.length * 5 + 8;
  }

  if (data.certificate.trim()) {
    if (y > 210) { doc.addPage(); y = 20; }
    doc.setDrawColor(220);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(config.certificateTitle, 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const certLines = doc.splitTextToSize(data.certificate, pageWidth - 28);
    doc.text(certLines, 14, y);
    y += certLines.length * 5 + 8;
  }

  if (data.notes.trim()) {
    if (y > 210) { doc.addPage(); y = 20; }
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

  // ── Signature block ──
  if (y > 200) { doc.addPage(); y = 20; }
  y += 12;

  // Signature box with border
  const sigBoxY = y;
  const sigBoxH = 52;
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageWidth / 2 - 55, sigBoxY, 110, sigBoxH, 3, 3, "S");

  // Shield icon (simulated)
  y += 8;
  doc.setFillColor(45, 212, 191);
  doc.circle(pageWidth / 2, y, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("✓", pageWidth / 2, y + 1.5, { align: "center" });

  y += 8;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 35, y, pageWidth / 2 + 35, y);
  y += 5;
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(data.doctorName, pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.setFontSize(8);
  doc.text(
    `${config.label}${data.doctorCrm ? ` — ${config.councilPrefix} ${data.doctorCrm}` : ""}`,
    pageWidth / 2, y, { align: "center" }
  );
  y += 4;
  doc.setFontSize(7);
  doc.setTextColor(130);
  doc.text(`${config.council}`, pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.setFontSize(6.5);
  doc.setTextColor(45, 212, 191);
  doc.text(`Hash: ${docHash}`, pageWidth / 2, y, { align: "center" });

  // ── ICP-Brasil notice ──
  y = sigBoxY + sigBoxH + 8;
  if (y > 250) { doc.addPage(); y = 20; }

  doc.setFillColor(255, 251, 235); // amber-50
  doc.roundedRect(14, y - 3, pageWidth - 28, 20, 2, 2, "F");
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y - 3, pageWidth - 28, 20, 2, 2, "S");

  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14); // amber-800
  doc.setFont("helvetica", "bold");
  doc.text("⚠ AVISO SOBRE VALIDADE JURÍDICA", 18, y + 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(120, 53, 15);
  const icpNotice = doc.splitTextToSize(
    `Este documento possui identificação do profissional (${config.councilPrefix}) e hash de verificação. ` +
    `Para plena validade jurídica conforme MP 2.200-2/2001 e Lei 14.063/2020, recomenda-se a aplicação de ` +
    `assinatura digital qualificada com certificado ICP-Brasil (tipo A1 ou A3) via software como Adobe Acrobat, ` +
    `BirdID ou VIDaaS.`,
    pageWidth - 36
  );
  doc.text(icpNotice, 18, y + 8);

  // ── Footer on all pages ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Bottom border
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageHeight - 18, pageWidth, 18, "F");
    doc.setFillColor(45, 212, 191);
    doc.rect(0, pageHeight - 18, pageWidth, 1, "F");

    doc.setFontSize(6.5);
    doc.setTextColor(160, 170, 180);
    doc.text(
      `SALBCARE — ${config.legalResolution}`,
      14, pageHeight - 10
    );
    doc.text(
      `Emitido em ${now} — Pág. ${i}/${pageCount}`,
      pageWidth - 14, pageHeight - 10, { align: "right" }
    );
    doc.setFontSize(5.5);
    doc.setTextColor(100, 110, 120);
    doc.text(
      `Verificação: ${docHash}`,
      14, pageHeight - 5
    );
  }

  return doc;
}

/**
 * Generates a deterministic hash for document verification.
 * Not cryptographic — serves as a visual identifier for the document.
 */
function generateDocHash(data: PrescriptionData, timestamp: string): string {
  const input = `${data.doctorName}|${data.doctorCrm}|${data.patientName}|${timestamp}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  return `SALB-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
}