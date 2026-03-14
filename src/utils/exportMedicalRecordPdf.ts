import jsPDF from "jspdf";
import { format } from "date-fns";
import { getProfessionConfig } from "@/config/professions";

interface MedicalRecordData {
  doctorName: string;
  professionalType: string;
  doctorCrm: string;
  patientName: string;
  consultationDate?: string;
  chiefComplaint?: string;
  historyPresentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  allergies?: string;
  currentMedications?: string;
  physicalExam?: string;
  vitalSigns?: Record<string, string>;
  diagnosis?: string;
  icdCode?: string;
  treatmentPlan?: string;
  prescription?: string;
  certificate?: string;
  followUpNotes?: string;
}

const vitalLabels: Record<string, string> = {
  blood_pressure: "PA", heart_rate: "FC", temperature: "Temp",
  respiratory_rate: "FR", oxygen_saturation: "SpO2", weight: "Peso", height: "Altura",
};

export function generateMedicalRecordPdf(data: MedicalRecordData): jsPDF {
  const config = getProfessionConfig(data.professionalType);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = format(new Date(), "dd/MM/yyyy");
  const consultDate = data.consultationDate
    ? format(new Date(data.consultationDate), "dd/MM/yyyy 'às' HH:mm")
    : today;

  // Header
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
  doc.text(`${data.doctorName}`, 14, 28);
  doc.text(`${config.label}${data.doctorCrm ? ` — ${config.councilPrefix} ${data.doctorCrm}` : ""}`, 14, 34);

  doc.setTextColor(160, 170, 180);
  doc.setFontSize(9);
  doc.text(consultDate, pageWidth - 14, 28, { align: "right" });
  doc.text(config.recordTitle.toUpperCase(), pageWidth - 14, 34, { align: "right" });

  let y = 54;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(config.recordTitle, 14, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Paciente:", 14, y);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(data.patientName, 42, y);
  y += 8;

  const addSection = (title: string, content: string | undefined) => {
    if (!content?.trim()) return;
    if (y > 255) { doc.addPage(); y = 20; }
    doc.setDrawColor(220);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;
    doc.setFontSize(11);
    doc.setTextColor(45, 212, 191);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const lines = doc.splitTextToSize(content, pageWidth - 28);
    for (const line of lines) {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, 14, y);
      y += 5;
    }
    y += 4;
  };

  // Vital signs
  if (data.vitalSigns && Object.values(data.vitalSigns).some((v) => v?.trim())) {
    if (y > 255) { doc.addPage(); y = 20; }
    doc.setDrawColor(220);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;
    doc.setFontSize(11);
    doc.setTextColor(45, 212, 191);
    doc.setFont("helvetica", "bold");
    doc.text("Sinais Vitais", 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const vitals = Object.entries(data.vitalSigns)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `${vitalLabels[k] || k}: ${v}`)
      .join("  |  ");
    doc.text(vitals, 14, y);
    y += 8;
  }

  addSection(config.chiefComplaintLabel, data.chiefComplaint);
  addSection(config.historyLabel, data.historyPresentIllness);
  addSection("Antecedentes Pessoais", data.pastMedicalHistory);
  addSection("Antecedentes Familiares", data.familyHistory);
  addSection("Hábitos de Vida", data.socialHistory);
  addSection("Alergias", data.allergies);
  addSection("Medicações em Uso", data.currentMedications);
  addSection(config.examLabel, data.physicalExam);
  addSection(`${config.diagnosisLabel}${data.icdCode ? ` (CID: ${data.icdCode})` : ""}`, data.diagnosis);
  addSection(config.treatmentLabel, data.treatmentPlan);
  addSection(config.prescriptionTitle, data.prescription);
  addSection(config.certificateTitle, data.certificate);
  addSection("Retorno / Acompanhamento", data.followUpNotes);

  // Signature
  if (y > 240) { doc.addPage(); y = 20; }
  y += 16;
  doc.setDrawColor(15, 23, 42);
  doc.line(pageWidth / 2 - 40, y, pageWidth / 2 + 40, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(data.doctorName, pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.setFontSize(9);
  doc.text(`${config.label}${data.doctorCrm ? ` — ${config.councilPrefix} ${data.doctorCrm}` : ""}`, pageWidth / 2, y, { align: "center" });

  // Legal footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(
      `${config.recordTitle} gerado via SALBCARE — ${today} — ${config.legalResolution} — Pág. ${i}/${pageCount}`,
      pageWidth / 2, ph - 8, { align: "center" }
    );
  }

  return doc;
}
