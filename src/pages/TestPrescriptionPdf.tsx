import { generatePrescriptionPdf } from "@/utils/exportPrescriptionPdf";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

const TEST_DATA = {
  doctorName: "Dr. Carlos Alberto Silva",
  professionalType: "medico",
  doctorCrm: "123456/SP",
  patientName: "Maria Fernanda dos Santos",
  patientCpf: "123.456.789-00",
  prescription: "1) Amoxicilina 500mg — 1 comprimido de 8/8h por 7 dias\n2) Ibuprofeno 400mg — 1 comprimido de 12/12h se dor\n3) Omeprazol 20mg — 1 cápsula em jejum por 14 dias",
  certificate: "Atesto para os devidos fins que o(a) paciente Maria Fernanda dos Santos necessita de afastamento de suas atividades laborais por 3 (três) dias, a partir de 14/03/2026, por motivo de tratamento de saúde.",
  notes: "Retorno em 7 dias para reavaliação. Manter repouso relativo. Hidratação abundante.",
  officeAddress: "Rua das Flores, 123 — Sala 45 — São Paulo/SP",
};

const PROFESSIONS = [
  { type: "medico", label: "Médico" },
  { type: "dentista", label: "Dentista" },
  { type: "psicologo", label: "Psicólogo" },
  { type: "nutricionista", label: "Nutricionista" },
  { type: "fisioterapeuta", label: "Fisioterapeuta" },
];

export default function TestPrescriptionPdf() {
  const handleGenerate = async (profType: string) => {
    const doc = await generatePrescriptionPdf({ ...TEST_DATA, professionalType: profType });
    doc.save(`teste-receita-${profType}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold text-foreground">Teste PDF — Receita Digital</h1>
      <p className="text-muted-foreground text-sm">Clique para gerar e baixar o PDF de cada profissão:</p>
      <div className="flex flex-wrap gap-3">
        {PROFESSIONS.map((p) => (
          <Button key={p.type} onClick={() => handleGenerate(p.type)} className="gap-2">
            <FileDown className="h-4 w-4" />
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
