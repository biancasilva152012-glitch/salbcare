// Prescription color scheme per ANVISA medication category

export type MedicationType =
  | "common"       // Uso contínuo / comum
  | "red_stripe"   // Tarja vermelha simples (permitido)
  | "black_stripe" // Tarja preta (BLOQUEADO)
  | "antimicrobial" // Antimicrobiano (permitido)
  | "psychotropic" // Psicotrópico C1 (BLOQUEADO)
  | "dental"       // Odontológica
  | "retinoid"     // Tarja vermelha C2 (BLOQUEADO)
  | "immunosuppressant"; // Tarja vermelha C3 (BLOQUEADO)

export interface PrescriptionColorScheme {
  label: string;
  borderColor: [number, number, number];
  headerBg: [number, number, number];
  headerText: [number, number, number];
  badgeBg: [number, number, number];
  badgeText: [number, number, number];
  legalWarning?: string;
  blockedForTeleconsultation?: boolean;
  blockReason?: string;
}

export const MEDICATION_COLORS: Record<MedicationType, PrescriptionColorScheme> = {
  common: {
    label: "RECEITA COMUM",
    borderColor: [46, 125, 50],
    headerBg: [46, 125, 50],
    headerText: [255, 255, 255],
    badgeBg: [46, 125, 50],
    badgeText: [255, 255, 255],
  },
  red_stripe: {
    label: "TARJA VERMELHA — SIMPLES",
    borderColor: [204, 0, 0],
    headerBg: [204, 0, 0],
    headerText: [255, 255, 255],
    badgeBg: [204, 0, 0],
    badgeText: [255, 255, 255],
    legalWarning: "Receita válida mediante avaliação médica na teleconsulta. Sujeita à aprovação do profissional.",
  },
  black_stripe: {
    label: "TARJA PRETA — CONTROLADO",
    borderColor: [26, 26, 26],
    headerBg: [26, 26, 26],
    headerText: [255, 255, 255],
    badgeBg: [26, 26, 26],
    badgeText: [255, 255, 255],
    legalWarning: "Este documento não substitui a receita física obrigatória exigida pela ANVISA para medicamentos controlados.",
    blockedForTeleconsultation: true,
    blockReason: "Medicamentos de tarja preta exigem receituário especial físico (Portaria 344/98) e não podem ser renovados por teleconsulta.",
  },
  antimicrobial: {
    label: "ANTIMICROBIANO",
    borderColor: [0, 87, 168],
    headerBg: [0, 87, 168],
    headerText: [255, 255, 255],
    badgeBg: [0, 87, 168],
    badgeText: [255, 255, 255],
  },
  psychotropic: {
    label: "PSICOTRÓPICO — C1",
    borderColor: [232, 119, 34],
    headerBg: [232, 119, 34],
    headerText: [255, 255, 255],
    badgeBg: [232, 119, 34],
    badgeText: [255, 255, 255],
    blockedForTeleconsultation: true,
    blockReason: "Psicotrópicos da lista C1 exigem receituário especial físico (RDC 471/2021) e não podem ser renovados por teleconsulta.",
  },
  dental: {
    label: "RECEITA ODONTOLÓGICA",
    borderColor: [106, 27, 154],
    headerBg: [106, 27, 154],
    headerText: [255, 255, 255],
    badgeBg: [106, 27, 154],
    badgeText: [255, 255, 255],
  },
  retinoid: {
    label: "TARJA VERMELHA — C2 (RETINOIDE)",
    borderColor: [204, 0, 0],
    headerBg: [204, 0, 0],
    headerText: [255, 255, 255],
    badgeBg: [204, 0, 0],
    badgeText: [255, 255, 255],
    blockedForTeleconsultation: true,
    blockReason: "Retinoides da lista C2 exigem receituário especial físico e não podem ser renovados por teleconsulta.",
  },
  immunosuppressant: {
    label: "TARJA VERMELHA — C3 (IMUNOSSUPRESSOR)",
    borderColor: [204, 0, 0],
    headerBg: [204, 0, 0],
    headerText: [255, 255, 255],
    badgeBg: [204, 0, 0],
    badgeText: [255, 255, 255],
    blockedForTeleconsultation: true,
    blockReason: "Imunossupressores da lista C3 exigem receituário especial físico e não podem ser renovados por teleconsulta.",
  },
};

// Options for the prescription generation modal (professional-facing)
export const MEDICATION_TYPE_OPTIONS: { value: MedicationType; label: string }[] = [
  { value: "common", label: "Uso comum / contínuo" },
  { value: "red_stripe", label: "Tarja vermelha simples" },
  { value: "black_stripe", label: "Tarja preta (controlado)" },
  { value: "antimicrobial", label: "Antimicrobiano" },
  { value: "psychotropic", label: "Psicotrópico (C1)" },
  { value: "retinoid", label: "Retinoide (C2)" },
  { value: "immunosuppressant", label: "Imunossupressor (C3)" },
  { value: "dental", label: "Odontológica" },
];

// Blocked medication keywords for auto-detection in renewal flow
export const BLOCKED_MEDICATION_KEYWORDS: { keywords: string[]; type: MedicationType }[] = [
  // Tarja preta
  { keywords: ["clonazepam", "rivotril", "diazepam", "valium", "alprazolam", "frontal", "midazolam", "dormonid", "bromazepam", "lexotan", "lorazepam", "lorax", "nitrazepam", "flunitrazepam", "fenobarbital", "gardenal", "morfina", "dimorf", "codeína", "codein", "tramadol", "tramal", "oxicodona", "oxycontin", "fentanil", "metadona", "zolpidem", "stilnox", "zopiclona"], type: "black_stripe" },
  // Psicotrópicos C1
  { keywords: ["metilfenidato", "ritalina", "concerta", "venvanse", "lisdexanfetamina", "anfetamina", "modafinila", "provigil"], type: "psychotropic" },
  // Retinoides C2
  { keywords: ["isotretinoína", "roacutan", "acnova", "tretinoína", "acitretina"], type: "retinoid" },
  // Imunossupressores C3
  { keywords: ["talidomida", "ciclosporina", "tacrolimo", "sirolimo", "micofenolato"], type: "immunosuppressant" },
];

export function detectBlockedMedication(medicationName: string): PrescriptionColorScheme | null {
  const lower = medicationName.toLowerCase().trim();
  if (!lower) return null;
  for (const entry of BLOCKED_MEDICATION_KEYWORDS) {
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword)) {
        const scheme = MEDICATION_COLORS[entry.type];
        if (scheme.blockedForTeleconsultation) return scheme;
      }
    }
  }
  return null;
}
