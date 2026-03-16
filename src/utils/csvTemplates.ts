export function downloadCsvTemplate(filename: string, headers: string[], sampleRows?: string[][]) {
  const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  let csv = bom + headers.join(";") + "\n";
  if (sampleRows) {
    for (const row of sampleRows) {
      csv += row.join(";") + "\n";
    }
  }
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const PATIENT_TEMPLATE_HEADERS = [
  "Nome",
  "Telefone",
  "E-mail",
  "Data de Nascimento",
  "Anamnese Inicial",
  "Procedimento Realizado",
  "Observações",
  "Histórico Médico",
];

export const PATIENT_TEMPLATE_SAMPLE: string[][] = [
  ["Maria Silva", "(11) 99999-1234", "maria@email.com", "15/03/1985", "Dor lombar há 3 meses", "Avaliação inicial", "Paciente cooperativa", "Hipertensão controlada"],
  ["João Santos", "(21) 98888-5678", "joao@email.com", "22/07/1990", "Cefaleia recorrente", "", "Retorno em 30 dias", ""],
];

export const AGENDA_TEMPLATE_HEADERS = [
  "Nome do Paciente",
  "Data",
  "Horário",
  "Tipo (presencial/telehealth)",
  "Observações",
];

export const AGENDA_TEMPLATE_SAMPLE: string[][] = [
  ["Maria Silva", "20/03/2026", "09:00", "presencial", "Primeira consulta"],
  ["João Santos", "20/03/2026", "10:30", "telehealth", "Retorno"],
];
