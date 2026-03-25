import jsPDF from "jspdf";
import { format } from "date-fns";
import { getProfessionConfig } from "@/config/professions";
import QRCode from "qrcode";
import { type MedicationType, MEDICATION_COLORS } from "@/utils/prescriptionColors";

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
  medicationType?: MedicationType;
  hashCode?: string;
  validationUrl?: string;
}

export async function generatePrescriptionPdf(data: PrescriptionPdfData): Promise<jsPDF> {
  const config = getProfessionConfig(data.professionalType || "medico");
  const doc = new jsPDF({ format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
  const today = format(new Date(), "dd/MM/yyyy");
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const borderWidth = 3;
  const signatureTitle = data.professionalType === "dentista" ? "Cirurgião(ã)-Dentista" : config.label;
  const normalizedCouncilNumber = data.doctorCrm?.trim() || "";
  const normalizedCouncilState = data.doctorCouncilState?.trim().toUpperCase() || "";
  const councilRegistrationText = normalizedCouncilNumber
    ? data.professionalType === "dentista" && normalizedCouncilState
      ? `CRO-${normalizedCouncilState} Nº ${normalizedCouncilNumber}`
      : `${config.councilPrefix}${normalizedCouncilState ? `-${normalizedCouncilState}` : ""} ${normalizedCouncilNumber}`
    : config.label;

  // Determine color scheme
  let medType: MedicationType = data.medicationType || "common";
  if (!data.medicationType && data.professionalType === "dentista") {
    medType = "dental";
  }
  const colors = MEDICATION_COLORS[medType];

  // ── Left border stripe ──
  const drawBorder = (d: jsPDF) => {
    d.setFillColor(...colors.borderColor);
    d.rect(0, 0, borderWidth, pageHeight, "F");
  };
  drawBorder(doc);

  // ── Header with dynamic color ──
  doc.setFillColor(...colors.headerBg);
  doc.rect(borderWidth, 0, pageWidth - borderWidth, 42, "F");

  // Top-left: Platform name
  doc.setTextColor(...colors.headerText);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SALBCARE", margin + borderWidth, 14);

  // Professional info - left side
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(data.doctorName, margin + borderWidth, 23);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(signatureTitle, margin + borderWidth, 29);

  // Council registration - prominently displayed
  if (normalizedCouncilNumber) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(councilRegistrationText, margin + borderWidth, 36);
  }

  // Right side: address + date
  if (data.officeAddress) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const addrLines = doc.splitTextToSize(data.officeAddress, contentWidth / 2.5);
    doc.text(addrLines, pageWidth - margin, 14, { align: "right" });
  }

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(`Emitido em ${now}`, pageWidth - margin, 39, { align: "right" });

  // ── Badge / type indicator ──
  const badgeY = 50;
  const badgeText = colors.label;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const badgeW = doc.getTextWidth(badgeText) + 12;
  doc.setFillColor(...colors.badgeBg);
  doc.roundedRect(margin + borderWidth, badgeY - 4, badgeW, 10, 2, 2, "F");
  doc.setTextColor(...colors.badgeText);
  doc.text(badgeText, margin + borderWidth + 6, badgeY + 2.5);

  let y = badgeY + 14;

  // ── Document title ──
  const docTitle = data.prescription.trim()
    ? config.prescriptionTitle
    : data.certificate.trim()
      ? config.certificateTitle
      : config.prescriptionTitle;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(docTitle, margin + borderWidth, y);
  y += 9;

  // ── Patient info box ──
  const patientBoxH = data.patientCpf ? 22 : 16;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin + borderWidth, y - 4, contentWidth - borderWidth, patientBoxH, 2, 2, "F");
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(margin + borderWidth, y - 4, contentWidth - borderWidth, patientBoxH, 2, 2, "S");

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Paciente:", margin + borderWidth + 4, y + 4);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(data.patientName, margin + borderWidth + 28, y + 4);

  if (data.patientCpf) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.setFontSize(9);
    doc.text(`CPF: ${data.patientCpf}`, margin + borderWidth + 4, y + 13);
  }

  // Date on the right inside patient box
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${today}`, pageWidth - margin - 4, y + 4, { align: "right" });

  y += patientBoxH + 8;

  doc.setDrawColor(220);
  doc.line(margin + borderWidth, y, pageWidth - margin, y);
  y += 8;

  // Helper: check page break
  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 65) {
      doc.addPage();
      drawBorder(doc);
      y = 20;
    }
  };

  // ── Prescription section ──
  if (data.prescription.trim()) {
    checkPage(30);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Medicamentos e Posologia", margin + borderWidth, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const prescLines = doc.splitTextToSize(data.prescription, contentWidth - borderWidth);
    for (const line of prescLines) {
      checkPage(6);
      doc.text(line, margin + borderWidth, y);
      y += 5.5;
    }
    y += 6;
  }

  // ── Certificate section ──
  if (data.certificate.trim()) {
    checkPage(30);
    doc.setDrawColor(220);
    doc.line(margin + borderWidth, y, pageWidth - margin, y);
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(config.certificateTitle, margin + borderWidth, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const certLines = doc.splitTextToSize(data.certificate, contentWidth - borderWidth);
    for (const line of certLines) {
      checkPage(6);
      doc.text(line, margin + borderWidth, y);
      y += 5.5;
    }
    y += 6;
  }

  // ── Notes section ──
  if (data.notes.trim()) {
    checkPage(30);
    doc.setDrawColor(220);
    doc.line(margin + borderWidth, y, pageWidth - margin, y);
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Orientações", margin + borderWidth, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const noteLines = doc.splitTextToSize(data.notes, contentWidth - borderWidth);
    for (const line of noteLines) {
      checkPage(6);
      doc.text(line, margin + borderWidth, y);
      y += 5.5;
    }
    y += 6;
  }

  // ── Legal warning for controlled substances ──
  if (colors.legalWarning) {
    checkPage(20);
    doc.setFillColor(255, 243, 224);
    doc.roundedRect(margin + borderWidth, y - 3, contentWidth - borderWidth, 14, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(180, 60, 0);
    doc.setFont("helvetica", "bold");
    doc.text("⚠ AVISO LEGAL:", margin + borderWidth + 3, y + 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    const warnLines = doc.splitTextToSize(colors.legalWarning, contentWidth - borderWidth - 6);
    doc.text(warnLines, margin + borderWidth + 3, y + 7);
    y += 18;
  }

  // ── Stamp / Signature block ──
  checkPage(70);
  y += 10;

  // Stamp area - dashed rectangle for professional stamp
  const stampW = 90;
  const stampH = 40;
  const stampX = (pageWidth - stampW) / 2;

  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.3);
  // Draw dashed border
  const dashLen = 3;
  const gapLen = 2;
  // Top
  for (let dx = 0; dx < stampW; dx += dashLen + gapLen) {
    doc.line(stampX + dx, y, stampX + Math.min(dx + dashLen, stampW), y);
  }
  // Bottom
  for (let dx = 0; dx < stampW; dx += dashLen + gapLen) {
    doc.line(stampX + dx, y + stampH, stampX + Math.min(dx + dashLen, stampW), y + stampH);
  }
  // Left
  for (let dy = 0; dy < stampH; dy += dashLen + gapLen) {
    doc.line(stampX, y + dy, stampX, y + Math.min(dy + dashLen, stampH));
  }
  // Right
  for (let dy = 0; dy < stampH; dy += dashLen + gapLen) {
    doc.line(stampX + stampW, y + dy, stampX + stampW, y + Math.min(dy + dashLen, stampH));
  }

  // Label inside stamp area
  doc.setFontSize(7);
  doc.setTextColor(160);
  doc.setFont("helvetica", "normal");
  doc.text("CARIMBO E ASSINATURA DO PROFISSIONAL", pageWidth / 2, y + 6, { align: "center" });

  // Pre-filled professional info inside stamp
  const cx = pageWidth / 2;
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(data.doctorName, cx, y + 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  doc.setFontSize(9);
  doc.text(signatureTitle, cx, y + 22, { align: "center" });

  if (normalizedCouncilNumber) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(councilRegistrationText, cx, y + 28, { align: "center" });
  }

  // Signature line below stamp
  y += stampH + 8;
  const sigLineW = 80;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(cx - sigLineW / 2, y, cx + sigLineW / 2, y);
  y += 4;
  doc.setFontSize(7);
  doc.setTextColor(130);
  doc.setFont("helvetica", "normal");
  doc.text("Assinatura do Profissional", cx, y, { align: "center" });

  // ── Legal resolution line ──
  y += 10;
  checkPage(12);
  doc.setFillColor(248, 249, 252);
  doc.roundedRect(margin + borderWidth, y - 3, contentWidth - borderWidth, 10, 1.5, 1.5, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(120);
  doc.setFont("helvetica", "normal");
  doc.text(config.legalResolution, pageWidth / 2, y + 3, { align: "center" });
  y += 12;

  // ── QR Code ──
  let qrDataUrl: string | null = null;
  if (data.hashCode) {
    const qrContent = data.validationUrl || `https://salbcare.lovable.app/verificar?hash=${data.hashCode}`;
    try {
      qrDataUrl = await QRCode.toDataURL(qrContent, { width: 200, margin: 1, color: { dark: "#0F172A" } });
    } catch {
      // silently fail
    }
  }

  // ── Footer on all pages ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawBorder(doc);

    // Footer bar
    doc.setFillColor(15, 23, 42);
    doc.rect(borderWidth, pageHeight - 20, pageWidth - borderWidth, 20, "F");
    // Accent line
    doc.setFillColor(...colors.borderColor);
    doc.rect(borderWidth, pageHeight - 20, pageWidth - borderWidth, 0.8, "F");

    // Footer text
    doc.setFontSize(6.5);
    doc.setTextColor(160, 170, 180);
    doc.text(
      "Documento gerado pela SalbCare — salbcare.com.br",
      margin + borderWidth, pageHeight - 12
    );

    // Council registration in footer
    if (normalizedCouncilNumber) {
      doc.setFontSize(6);
      doc.text(
        `${data.doctorName} — ${councilRegistrationText}`,
        margin + borderWidth, pageHeight - 7
      );
    }

    doc.setFontSize(6.5);
    doc.text(
      `Pág. ${i}/${pageCount}`,
      pageWidth - margin, pageHeight - 12, { align: "right" }
    );

    if (data.hashCode) {
      doc.setFontSize(5.5);
      doc.text(`Código de verificação: ${data.hashCode}`, pageWidth - margin, pageHeight - 7, { align: "right" });
    }

    // QR code on last page only
    if (i === pageCount && qrDataUrl) {
      const qrSize = 22;
      const qrX = pageWidth - margin - qrSize;
      const qrY = pageHeight - 20 - qrSize - 6;

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 1, 1, "F");
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      doc.setFontSize(5);
      doc.setTextColor(100);
      doc.text("Escaneie para validar", qrX + qrSize / 2, qrY + qrSize + 4, { align: "center" });
    }
  }

  return doc;
}
