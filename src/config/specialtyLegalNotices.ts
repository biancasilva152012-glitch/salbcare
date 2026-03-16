export const SPECIALTY_LEGAL_NOTICES: Record<string, string> = {
  medico:
    "Consultas médicas online seguem a Resolução CFM 2.314/2022. Em casos de emergência, ligue 192 (SAMU) ou vá ao pronto-socorro.",
  psicologo:
    "Atendimento psicológico online autorizado pelo CFP conforme Resolução 11/2018. Em crise ou risco de vida: CVV 188 (24h).",
  nutricionista:
    "Consulta nutricional online autorizada pelo CFN. O plano alimentar é elaborado exclusivamente pelo nutricionista responsável.",
  dentista:
    "Consultas odontológicas online são restritas a orientação, triagem e acompanhamento — conforme Resolução CFO 226/2021. Procedimentos clínicos exigem atendimento presencial.",
  fisioterapeuta:
    "Teleconsulta fisioterapêutica autorizada pelo COFFITO conforme Resolução 516/2020.",
};

export const SPECIALTY_SEO: Record<string, { slug: string; title: string; metaTitle: string; metaDescription: string }> = {
  medico: {
    slug: "medico",
    title: "Médico",
    metaTitle: "Consulta Online com Médico — Hoje, pelo celular | SALBCARE",
    metaDescription: "Agende sua consulta online com médico habilitado. Atendimento em todo o Brasil, sem sair de casa. Rápido, seguro e acessível.",
  },
  psicologo: {
    slug: "psicologo",
    title: "Psicólogo",
    metaTitle: "Consulta Online com Psicólogo — Hoje, pelo celular | SALBCARE",
    metaDescription: "Agende sua consulta online com psicólogo habilitado. Atendimento em todo o Brasil, sem sair de casa. Rápido, seguro e acessível.",
  },
  nutricionista: {
    slug: "nutricionista",
    title: "Nutricionista",
    metaTitle: "Consulta Online com Nutricionista — Hoje, pelo celular | SALBCARE",
    metaDescription: "Agende sua consulta online com nutricionista habilitado. Atendimento em todo o Brasil, sem sair de casa. Rápido, seguro e acessível.",
  },
  dentista: {
    slug: "dentista",
    title: "Dentista",
    metaTitle: "Consulta Online com Dentista — Hoje, pelo celular | SALBCARE",
    metaDescription: "Agende sua consulta online com dentista habilitado. Atendimento em todo o Brasil, sem sair de casa. Rápido, seguro e acessível.",
  },
  fisioterapeuta: {
    slug: "fisioterapeuta",
    title: "Fisioterapeuta",
    metaTitle: "Consulta Online com Fisioterapeuta — Hoje, pelo celular | SALBCARE",
    metaDescription: "Agende sua consulta online com fisioterapeuta habilitado. Atendimento em todo o Brasil, sem sair de casa. Rápido, seguro e acessível.",
  },
};
