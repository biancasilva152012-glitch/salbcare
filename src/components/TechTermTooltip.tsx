import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TERMS: Record<string, string> = {
  "Carnê-Leão": "Imposto mensal que profissionais autônomos precisam recolher sobre seus rendimentos. Vence todo mês.",
  "DAS": "Boleto mensal do MEI. Cobre INSS e impostos do microempreendedor individual.",
  "DARF": "Guia de pagamento de imposto federal. Gerado automaticamente aqui na plataforma.",
  "MEI": "Microempreendedor Individual — regime simplificado de empresa para faturamento até R$ 81 mil/ano.",
  "Simples Nacional": "Regime tributário simplificado que unifica vários impostos em uma guia só. Ideal para pequenas empresas.",
  "IRPF": "Imposto de Renda da Pessoa Física — declaração anual obrigatória de rendimentos.",
  "NFS-e": "Nota Fiscal de Serviço eletrônica — comprovante fiscal obrigatório emitido para cada serviço prestado.",
  "NF-e": "Nota Fiscal eletrônica — documento fiscal digital que comprova a prestação de serviço.",
  "CRC": "Conselho Regional de Contabilidade — registro obrigatório para contadores exercerem a profissão.",
  "ISS": "Imposto Sobre Serviços — tributo municipal cobrado sobre a prestação de serviços.",
  "INSS": "Instituto Nacional do Seguro Social — contribuição obrigatória que garante aposentadoria e benefícios.",
  "IR": "Imposto de Renda — tributo federal sobre os rendimentos de pessoas físicas e jurídicas.",
  "CNPJ": "Cadastro Nacional da Pessoa Jurídica — número de registro da empresa na Receita Federal.",
};

interface TechTermTooltipProps {
  term: string;
  children?: React.ReactNode;
}

const TechTermTooltip = ({ term, children }: TechTermTooltipProps) => {
  const explanation = TERMS[term];
  if (!explanation) return <>{children || term}</>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-0.5 cursor-help">
            {children || term}
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors inline-block shrink-0" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
          <p><span className="font-semibold">{term}:</span> {explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Utility: wraps all known technical terms in a text string with tooltips.
 * Use in JSX: <TermsHighlighter text="Pague o DAS e o DARF..." />
 */
export const TermsHighlighter = ({ text }: { text: string }) => {
  const sortedTerms = Object.keys(TERMS).sort((a, b) => b.length - a.length);
  const regex = new RegExp(`(${sortedTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|")})`, "g");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        TERMS[part] ? <TechTermTooltip key={i} term={part} /> : <span key={i}>{part}</span>
      )}
    </>
  );
};

export default TechTermTooltip;
