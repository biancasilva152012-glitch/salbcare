import { useState } from "react";
import { HelpCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: Record<string, FaqItem[]> = {
  agenda: [
    { q: "Como agendar uma consulta?", a: "Clique em 'Nova' no topo da Agenda, preencha os dados do paciente, data e horário, e clique em Agendar." },
    { q: "Posso importar consultas de uma planilha?", a: "Sim! Use o botão 'Importar' e envie um arquivo CSV seguindo o modelo disponível no botão 'Modelo'." },
    { q: "O que acontece se eu cancelar 3 consultas no mês?", a: "Seu perfil ficará suspenso das buscas públicas por 7 dias para proteger a experiência dos pacientes." },
  ],
  teleconsulta: [
    { q: "Como configuro meu Google Meet?", a: "Acesse seu Perfil > Configurações da Consulta e cole o link padrão da sua sala do Google Meet." },
    { q: "O paciente precisa instalar algo?", a: "Não! O Google Meet funciona diretamente no navegador do paciente." },
    { q: "Como o paciente recebe o link?", a: "Ao agendar, compartilhe o link de agendamento da SALBCARE. O paciente verá o botão para entrar na consulta." },
  ],
  financeiro: [
    { q: "Como funciona o Simulador de Economia?", a: "Insira seu faturamento mensal e o sistema calcula a diferença entre pagar imposto como PF (Carnê-Leão) vs. PJ otimizado." },
    { q: "A SALBCARE cobra comissão nas consultas?", a: "Não! Você fica com 100% do valor das suas consultas. A receita da plataforma é apenas das assinaturas." },
    { q: "Como exportar relatórios financeiros?", a: "Disponível no plano Profissional. Acesse Financeiro e clique no botão de exportar PDF." },
  ],
  contabilidade: [
    { q: "Como falo com o contador?", a: "No plano Profissional, acesse Contabilidade > Chat para conversar com um contador especialista em saúde." },
    { q: "O contador pode abrir meu CNPJ?", a: "Sim! Na aba de Solicitação de CNPJ, preencha seus dados e o contador parceiro cuidará de tudo." },
  ],
};

interface HelpFabProps {
  section: keyof typeof FAQS;
}

const HelpFab = ({ section }: HelpFabProps) => {
  const [open, setOpen] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const faqs = FAQS[section] || [];

  if (faqs.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Ajuda"
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Perguntas Frequentes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-card overflow-hidden">
                <button
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="flex w-full items-center justify-between p-3 text-left"
                >
                  <span className="text-sm font-medium pr-2">{faq.q}</span>
                  {expandedIdx === idx ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>
                {expandedIdx === idx && (
                  <div className="px-3 pb-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HelpFab;
