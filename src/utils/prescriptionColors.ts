// Prescription color scheme per ANVISA medication category

export type MedicationType =
  | "common"       // Uso contínuo / comum
  | "red_stripe"   // Tarja vermelha (controlado)
  | "black_stripe" // Tarja preta (controlado)
  | "antimicrobial" // Antimicrobiano
  | "psychotropic" // Psicotrópico
  | "dental";      // Odontológica

export interface PrescriptionColorScheme {
  label: string;
  borderColor: [number, number, number];
  headerBg: [number, number, number];
  headerText: [number, number, number];
  badgeBg: [number, number, number];
  badgeText: [number, number, number];
  legalWarning?: string;
}

export const MEDICATION_COLORS: Record<MedicationType, PrescriptionColorScheme> = {
  common: {
    label: "RECEITA COMUM",
    borderColor: [46, 125, 50],       // #2E7D32
    headerBg: [46, 125, 50],
    headerText: [255, 255, 255],
    badgeBg: [46, 125, 50],
    badgeText: [255, 255, 255],
  },
  red_stripe: {
    label: "TARJA VERMELHA — CONTROLADO",
    borderColor: [204, 0, 0],         // #CC0000
    headerBg: [204, 0, 0],
    headerText: [255, 255, 255],
    badgeBg: [204, 0, 0],
    badgeText: [255, 255, 255],
    legalWarning: "Este documento não substitui a receita física obrigatória exigida pela ANVISA para medicamentos controlados.",
  },
  black_stripe: {
    label: "TARJA PRETA — CONTROLADO",
    borderColor: [26, 26, 26],        // #1A1A1A
    headerBg: [26, 26, 26],
    headerText: [255, 255, 255],
    badgeBg: [26, 26, 26],
    badgeText: [255, 255, 255],
    legalWarning: "Este documento não substitui a receita física obrigatória exigida pela ANVISA para medicamentos controlados.",
  },
  antimicrobial: {
    label: "ANTIMICROBIANO",
    borderColor: [0, 87, 168],        // #0057A8
    headerBg: [0, 87, 168],
    headerText: [255, 255, 255],
    badgeBg: [0, 87, 168],
    badgeText: [255, 255, 255],
  },
  psychotropic: {
    label: "PSICOTRÓPICO",
    borderColor: [232, 119, 34],      // #E87722
    headerBg: [232, 119, 34],
    headerText: [255, 255, 255],
    badgeBg: [232, 119, 34],
    badgeText: [255, 255, 255],
  },
  dental: {
    label: "RECEITA ODONTOLÓGICA",
    borderColor: [106, 27, 154],      // #6A1B9A
    headerBg: [106, 27, 154],
    headerText: [255, 255, 255],
    badgeBg: [106, 27, 154],
    badgeText: [255, 255, 255],
  },
};

export const MEDICATION_TYPE_OPTIONS: { value: MedicationType; label: string }[] = [
  { value: "common", label: "Uso comum / contínuo" },
  { value: "red_stripe", label: "Tarja vermelha (controlado)" },
  { value: "black_stripe", label: "Tarja preta (controlado)" },
  { value: "antimicrobial", label: "Antimicrobiano" },
  { value: "psychotropic", label: "Psicotrópico" },
  { value: "dental", label: "Odontológica" },
];
