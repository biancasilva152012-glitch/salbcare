/**
 * Motor de Triagem Nativo SALBCARE
 * Substitui chamadas de IA externas por lógica interna de scoring baseada em regras.
 * Zero dependências externas — roda 100% no cliente.
 */

export interface TriageInput {
  symptoms: string;
  duration: string;
  conditions: string;
}

export interface TriageResult {
  especialidade: string;
  motivo: string;
  urgencia: "normal" | "alta";
  score: number;
}

type SpecialtyKey = "medico" | "psicologo" | "nutricionista" | "fisioterapeuta" | "dentista";

interface Rule {
  keywords: string[];
  specialty: SpecialtyKey;
  weight: number;
  urgencyKeywords?: string[];
}

// ── Regras de mapeamento sintoma → especialidade ──────────────────────

const RULES: Rule[] = [
  // URGÊNCIA / CLÍNICO GERAL — alta prioridade
  {
    keywords: ["dor no peito", "peito", "falta de ar", "desmaio", "perda de consciência", "sangramento intenso", "convulsão", "pressão alta", "infarto", "avc", "derrame"],
    specialty: "medico",
    weight: 10,
    urgencyKeywords: ["dor no peito", "falta de ar", "desmaio", "perda de consciência", "sangramento intenso", "convulsão", "infarto", "avc", "derrame"],
  },
  // CLÍNICO GERAL — geral
  {
    keywords: ["febre", "gripe", "resfriado", "tosse", "dor de cabeça", "cefaleia", "enxaqueca", "dor no corpo", "mal estar", "enjoo", "náusea", "vômito", "diarreia", "infecção", "dor de garganta", "coriza", "calafrio", "tontura", "fraqueza", "cansaço", "fadiga", "alergia", "coceira", "urticária", "erupção", "mancha na pele", "pele", "queda de cabelo", "dor abdominal", "dor de barriga", "estômago", "azia", "refluxo", "gastrite", "dor nas costas", "lombar", "coluna", "pressão", "hipertensão", "diabetes", "glicose", "colesterol", "exame de rotina", "check-up", "consulta geral"],
    specialty: "medico",
    weight: 5,
  },
  // PSICÓLOGO
  {
    keywords: ["ansiedade", "depressão", "triste", "tristeza", "pânico", "angústia", "insônia", "não consigo dormir", "estresse", "stress", "burnout", "choro", "chorando", "pensamento negativo", "automutilação", "suicídio", "medo", "fobia", "compulsão", "vício", "relacionamento", "luto", "trauma", "abuso", "irritabilidade", "raiva", "nervoso", "terapia", "psicológico", "emocional", "mental"],
    specialty: "psicologo",
    weight: 7,
    urgencyKeywords: ["suicídio", "automutilação"],
  },
  // NUTRICIONISTA
  {
    keywords: ["emagrecer", "engordar", "peso", "dieta", "alimentação", "nutrição", "obesidade", "sobrepeso", "colesterol alto", "triglicerídeos", "intolerância alimentar", "alergia alimentar", "lactose", "glúten", "reeducação alimentar", "compulsão alimentar", "anorexia", "bulimia", "gordura", "metabolismo"],
    specialty: "nutricionista",
    weight: 6,
  },
  // FISIOTERAPEUTA
  {
    keywords: ["dor muscular", "lesão", "torção", "entorse", "tendinite", "bursite", "hérnia de disco", "lombalgia", "cervicalgia", "fisioterapia", "reabilitação", "pós-operatório", "mobilidade", "articulação", "joelho", "ombro", "cotovelo", "punho", "quadril", "tornozelo", "ciática", "nervo ciático", "postura", "escoliose", "rpg", "pilates", "alongamento"],
    specialty: "fisioterapeuta",
    weight: 6,
  },
  // DENTISTA
  {
    keywords: ["dor de dente", "dente", "gengiva", "sangramento na gengiva", "cárie", "canal", "extração", "siso", "bruxismo", "mordida", "ortodontia", "aparelho", "clareamento", "mau hálito", "halitose", "boca", "mandíbula", "atm", "prótese dentária", "implante dentário", "sensibilidade nos dentes"],
    specialty: "dentista",
    weight: 6,
  },
];

// ── Labels ────────────────────────────────────────────────────────────

const SPECIALTY_LABELS: Record<SpecialtyKey, string> = {
  medico: "Médico Clínico Geral",
  psicologo: "Psicólogo",
  nutricionista: "Nutricionista",
  fisioterapeuta: "Fisioterapeuta",
  dentista: "Cirurgião-Dentista",
};

const SPECIALTY_MOTIVOS: Record<SpecialtyKey, string> = {
  medico: "Com base nos sintomas que você descreveu, um clínico geral é o profissional mais indicado para avaliar sua condição, solicitar exames se necessário e encaminhá-lo para um especialista caso preciso.",
  psicologo: "Os sintomas que você relatou sugerem que um acompanhamento psicológico pode ser muito benéfico. Um psicólogo vai ajudá-lo a compreender e lidar melhor com o que está sentindo.",
  nutricionista: "Suas questões estão relacionadas à alimentação e metabolismo. Um nutricionista poderá criar um plano alimentar personalizado para suas necessidades.",
  fisioterapeuta: "Os sintomas que você descreveu apontam para questões musculoesqueléticas. Um fisioterapeuta pode avaliar, tratar e prevenir a progressão do problema.",
  dentista: "Seus sintomas indicam uma questão de saúde bucal. Um dentista vai avaliar e indicar o melhor tratamento para o seu caso.",
};

// ── Modificadores de duração ──────────────────────────────────────────

function getDurationMultiplier(duration: string): number {
  const d = duration.toLowerCase();
  if (d.includes("mais de 1 mês") || d.includes("mais de um mês")) return 1.3;
  if (d.includes("1 a 4 semanas") || d.includes("semanas")) return 1.1;
  return 1.0; // menos de 1 semana
}

// ── Modificadores de condições prévias ────────────────────────────────

function getConditionsBoost(conditions: string): Record<SpecialtyKey, number> {
  const c = conditions.toLowerCase();
  const boost: Record<SpecialtyKey, number> = { medico: 0, psicologo: 0, nutricionista: 0, fisioterapeuta: 0, dentista: 0 };

  if (c.includes("diabetes") || c.includes("hipertensão") || c.includes("pressão alta") || c.includes("cardíaco") || c.includes("coração")) {
    boost.medico += 3;
  }
  if (c.includes("depressão") || c.includes("ansiedade") || c.includes("pânico") || c.includes("bipolar")) {
    boost.psicologo += 3;
  }
  if (c.includes("obesidade") || c.includes("colesterol") || c.includes("triglicerídeos")) {
    boost.nutricionista += 2;
  }
  if (c.includes("hérnia") || c.includes("artrose") || c.includes("fibromialgia") || c.includes("lesão")) {
    boost.fisioterapeuta += 2;
  }

  return boost;
}

// ── Motor principal ───────────────────────────────────────────────────

export function runTriage(input: TriageInput): TriageResult {
  const symptomsLower = input.symptoms.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const symptomsOriginal = input.symptoms.toLowerCase();
  const durationMult = getDurationMultiplier(input.duration);
  const conditionsBoost = getConditionsBoost(input.conditions);

  const scores: Record<SpecialtyKey, number> = { medico: 0, psicologo: 0, nutricionista: 0, fisioterapeuta: 0, dentista: 0 };
  let isUrgent = false;

  for (const rule of RULES) {
    let matchCount = 0;
    for (const kw of rule.keywords) {
      const kwNorm = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (symptomsLower.includes(kwNorm) || symptomsOriginal.includes(kw)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      scores[rule.specialty] += rule.weight * matchCount * durationMult;
    }

    // Check urgency
    if (rule.urgencyKeywords) {
      for (const uk of rule.urgencyKeywords) {
        const ukNorm = uk.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (symptomsLower.includes(ukNorm) || symptomsOriginal.includes(uk)) {
          isUrgent = true;
        }
      }
    }
  }

  // Apply conditions boost
  for (const key of Object.keys(conditionsBoost) as SpecialtyKey[]) {
    scores[key] += conditionsBoost[key];
  }

  // Find top specialty
  let topSpecialty: SpecialtyKey = "medico";
  let topScore = 0;
  for (const [key, score] of Object.entries(scores) as [SpecialtyKey, number][]) {
    if (score > topScore) {
      topScore = score;
      topSpecialty = key;
    }
  }

  // Default to clínico geral if no strong match
  if (topScore === 0) {
    topSpecialty = "medico";
    topScore = 1;
  }

  return {
    especialidade: topSpecialty,
    motivo: SPECIALTY_MOTIVOS[topSpecialty],
    urgencia: isUrgent ? "alta" : "normal",
    score: Math.round(topScore),
  };
}

export { SPECIALTY_LABELS };
