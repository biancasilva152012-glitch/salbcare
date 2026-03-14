// Legal terminology and labels per health profession
// Based on Brazilian regulatory bodies: CFM, CRO, CRP, CRN, COFFITO

export type ProfessionalType = "medico" | "dentista" | "psicologo" | "nutricionista" | "fisioterapeuta";

interface ProfessionConfig {
  label: string;
  council: string;
  councilPrefix: string;
  prescriptionTitle: string;
  certificateTitle: string;
  recordTitle: string;
  prescriptionPlaceholder: string;
  certificatePlaceholder: string;
  chiefComplaintLabel: string;
  chiefComplaintPlaceholder: string;
  historyLabel: string;
  historyPlaceholder: string;
  examLabel: string;
  examPlaceholder: string;
  diagnosisLabel: string;
  diagnosisPlaceholder: string;
  treatmentLabel: string;
  treatmentPlaceholder: string;
  legalResolution: string;
  canPrescribeMedication: boolean;
  usesIcd: boolean;
  anamnesisFields: string[];
}

export const PROFESSION_CONFIG: Record<ProfessionalType, ProfessionConfig> = {
  medico: {
    label: "Médico(a)",
    council: "Conselho Regional de Medicina",
    councilPrefix: "CRM",
    prescriptionTitle: "Receita Médica",
    certificateTitle: "Atestado Médico",
    recordTitle: "Prontuário Médico",
    prescriptionPlaceholder: "1) Amoxicilina 500mg — 1 comp. de 8/8h por 7 dias\n2) Ibuprofeno 400mg — 1 comp. de 12/12h se dor",
    certificatePlaceholder: "Atesto para os devidos fins que o(a) paciente necessita de afastamento de suas atividades por ___ dias, a partir de ___/___/___.",
    chiefComplaintLabel: "Queixa Principal",
    chiefComplaintPlaceholder: "Motivo da consulta...",
    historyLabel: "História da Doença Atual (HDA)",
    historyPlaceholder: "Início, evolução, sintomas associados...",
    examLabel: "Exame Físico",
    examPlaceholder: "Ectoscopia, ausculta cardíaca e pulmonar, palpação abdominal...",
    diagnosisLabel: "Hipótese Diagnóstica",
    diagnosisPlaceholder: "Diagnóstico principal e diferenciais...",
    treatmentLabel: "Plano Terapêutico / Conduta",
    treatmentPlaceholder: "Exames solicitados, orientações, encaminhamentos...",
    legalResolution: "Documento com validade legal conforme Resolução CFM nº 2.299/2021",
    canPrescribeMedication: true,
    usesIcd: true,
    anamnesisFields: ["chief_complaint", "history_present_illness", "past_medical_history", "family_history", "social_history", "allergies", "current_medications"],
  },
  dentista: {
    label: "Dentista",
    council: "Conselho Regional de Odontologia",
    councilPrefix: "CRO",
    prescriptionTitle: "Receita Odontológica",
    certificateTitle: "Atestado Odontológico",
    recordTitle: "Prontuário Odontológico",
    prescriptionPlaceholder: "1) Amoxicilina 500mg — 1 comp. de 8/8h por 7 dias\n2) Nimesulida 100mg — 1 comp. de 12/12h por 3 dias",
    certificatePlaceholder: "Atesto para os devidos fins que o(a) paciente foi submetido(a) a procedimento odontológico, necessitando de ___ dias de repouso.",
    chiefComplaintLabel: "Queixa Principal",
    chiefComplaintPlaceholder: "Dor, sensibilidade, sangramento gengival...",
    historyLabel: "História da Doença Atual",
    historyPlaceholder: "Início dos sintomas, localização, intensidade...",
    examLabel: "Exame Clínico Odontológico",
    examPlaceholder: "Exame intra e extraoral, periograma, odontograma...",
    diagnosisLabel: "Diagnóstico Odontológico",
    diagnosisPlaceholder: "Cárie, doença periodontal, maloclusão...",
    treatmentLabel: "Plano de Tratamento Odontológico",
    treatmentPlaceholder: "Procedimentos planejados, número de sessões...",
    legalResolution: "Documento com validade legal conforme Resolução CFO nº 118/2012",
    canPrescribeMedication: true,
    usesIcd: false,
    anamnesisFields: ["chief_complaint", "history_present_illness", "past_medical_history", "allergies", "current_medications"],
  },
  psicologo: {
    label: "Psicólogo(a)",
    council: "Conselho Regional de Psicologia",
    councilPrefix: "CRP",
    prescriptionTitle: "Orientações Terapêuticas",
    certificateTitle: "Atestado Psicológico",
    recordTitle: "Registro de Atendimento Psicológico",
    prescriptionPlaceholder: "Orientações sobre manejo de ansiedade, técnicas de relaxamento, frequência das sessões...",
    certificatePlaceholder: "Atesto para os devidos fins que o(a) paciente encontra-se em acompanhamento psicológico, necessitando de afastamento de suas atividades por ___ dias.",
    chiefComplaintLabel: "Demanda Principal",
    chiefComplaintPlaceholder: "Motivo da busca por atendimento psicológico...",
    historyLabel: "Histórico da Queixa",
    historyPlaceholder: "Contexto, fatores desencadeantes, evolução...",
    examLabel: "Observação Clínica",
    examPlaceholder: "Estado emocional, comportamento, cognição, afeto...",
    diagnosisLabel: "Avaliação / Hipótese Diagnóstica",
    diagnosisPlaceholder: "Impressão clínica, hipótese psicodiagnóstica...",
    treatmentLabel: "Plano Terapêutico",
    treatmentPlaceholder: "Abordagem terapêutica, frequência, encaminhamentos...",
    legalResolution: "Documento com validade legal conforme Resolução CFP nº 11/2018",
    canPrescribeMedication: false,
    usesIcd: false,
    anamnesisFields: ["chief_complaint", "history_present_illness", "past_medical_history", "family_history", "social_history"],
  },
  nutricionista: {
    label: "Nutricionista",
    council: "Conselho Regional de Nutricionistas",
    councilPrefix: "CRN",
    prescriptionTitle: "Prescrição Dietética",
    certificateTitle: "Atestado Nutricional",
    recordTitle: "Registro de Atendimento Nutricional",
    prescriptionPlaceholder: "Plano alimentar:\nDesjejum: ...\nLanche da manhã: ...\nAlmoço: ...\nLanche da tarde: ...\nJantar: ...\nCeia: ...\n\nSuplementação: ...",
    certificatePlaceholder: "Atesto para os devidos fins que o(a) paciente encontra-se em acompanhamento nutricional.",
    chiefComplaintLabel: "Motivo da Consulta",
    chiefComplaintPlaceholder: "Objetivo nutricional, queixas alimentares...",
    historyLabel: "Histórico Alimentar",
    historyPlaceholder: "Hábitos alimentares, recordatório 24h, preferências...",
    examLabel: "Avaliação Antropométrica",
    examPlaceholder: "IMC, circunferências, dobras cutâneas, composição corporal...",
    diagnosisLabel: "Diagnóstico Nutricional",
    diagnosisPlaceholder: "Estado nutricional, classificação IMC, deficiências...",
    treatmentLabel: "Conduta Nutricional",
    treatmentPlaceholder: "Objetivos, metas calóricas, orientações...",
    legalResolution: "Documento com validade legal conforme Resolução CFN nº 599/2018",
    canPrescribeMedication: false,
    usesIcd: false,
    anamnesisFields: ["chief_complaint", "history_present_illness", "past_medical_history", "allergies", "social_history"],
  },
  fisioterapeuta: {
    label: "Fisioterapeuta",
    council: "Conselho Regional de Fisioterapia e Terapia Ocupacional",
    councilPrefix: "CREFITO",
    prescriptionTitle: "Prescrição Fisioterapêutica",
    certificateTitle: "Atestado de Fisioterapia",
    recordTitle: "Prontuário Fisioterapêutico",
    prescriptionPlaceholder: "Exercícios prescritos:\n1) Alongamento de cadeia posterior — 3x30s\n2) Fortalecimento de quadríceps — 3x15 rep\n3) Crioterapia local — 20 min",
    certificatePlaceholder: "Atesto para os devidos fins que o(a) paciente encontra-se em tratamento fisioterapêutico, necessitando de ___ sessões semanais.",
    chiefComplaintLabel: "Queixa Funcional Principal",
    chiefComplaintPlaceholder: "Dor, limitação de movimento, déficit funcional...",
    historyLabel: "História da Queixa Funcional",
    historyPlaceholder: "Mecanismo de lesão, evolução, tratamentos anteriores...",
    examLabel: "Exame Físico / Avaliação Funcional",
    examPlaceholder: "Amplitude de movimento, força muscular, testes especiais, marcha...",
    diagnosisLabel: "Diagnóstico Cinético-Funcional",
    diagnosisPlaceholder: "Disfunção, CIF, classificação funcional...",
    treatmentLabel: "Plano de Tratamento Fisioterapêutico",
    treatmentPlaceholder: "Objetivos, modalidades, frequência, número de sessões...",
    legalResolution: "Documento com validade legal conforme Resolução COFFITO nº 516/2020",
    canPrescribeMedication: false,
    usesIcd: false,
    anamnesisFields: ["chief_complaint", "history_present_illness", "past_medical_history", "allergies", "current_medications"],
  },
};

export function getProfessionConfig(type: string): ProfessionConfig {
  return PROFESSION_CONFIG[type as ProfessionalType] || PROFESSION_CONFIG.medico;
}

export function getProfessionalTitle(type: string): string {
  const config = getProfessionConfig(type);
  return config.label;
}

export function getCouncilPrefix(type: string): string {
  const config = getProfessionConfig(type);
  return config.councilPrefix;
}
