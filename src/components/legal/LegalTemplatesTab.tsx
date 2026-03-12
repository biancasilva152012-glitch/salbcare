import { FileText, Download, Shield, ClipboardList, UserCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

const templates = [
  {
    id: "service-contract",
    title: "Contrato de Prestação de Serviços",
    description: "Modelo de contrato para serviços médicos e de saúde",
    icon: ClipboardList,
    content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS

CONTRATANTE: [Nome do Paciente], CPF [xxx.xxx.xxx-xx]
CONTRATADO(A): [Nome do Profissional], CRM/CRO/CRP [xxxxx]

CLÁUSULA 1ª - DO OBJETO
O presente contrato tem por objeto a prestação de serviços de [especialidade] pelo(a) CONTRATADO(A) ao CONTRATANTE.

CLÁUSULA 2ª - DO VALOR E FORMA DE PAGAMENTO
Os serviços serão remunerados no valor de R$ [valor] por [consulta/sessão/procedimento], a ser pago [forma de pagamento].

CLÁUSULA 3ª - DAS OBRIGAÇÕES DO CONTRATADO
a) Prestar os serviços com diligência e competência profissional;
b) Manter sigilo sobre informações do paciente;
c) Emitir documentos fiscais correspondentes.

CLÁUSULA 4ª - DAS OBRIGAÇÕES DO CONTRATANTE
a) Efetuar os pagamentos nas datas acordadas;
b) Fornecer informações verdadeiras sobre seu estado de saúde;
c) Seguir as orientações do profissional.

CLÁUSULA 5ª - DA VIGÊNCIA
Este contrato terá vigência de [período], podendo ser renovado por acordo entre as partes.

CLÁUSULA 6ª - DA RESCISÃO
O contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de [prazo] dias.

[Local], [Data]

_________________________          _________________________
CONTRATANTE                        CONTRATADO(A)`,
  },
  {
    id: "patient-consent",
    title: "Termo de Consentimento do Paciente",
    description: "Consentimento informado para procedimentos",
    icon: UserCheck,
    content: `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO

Eu, [Nome do Paciente], portador(a) do CPF [xxx.xxx.xxx-xx], declaro que fui devidamente informado(a) pelo(a) profissional [Nome do Profissional], [Registro Profissional], sobre:

1. DIAGNÓSTICO: [Descrição do diagnóstico]

2. PROCEDIMENTO PROPOSTO: [Descrição do procedimento]

3. BENEFÍCIOS ESPERADOS: [Descrição dos benefícios]

4. RISCOS E COMPLICAÇÕES: [Descrição dos riscos]

5. ALTERNATIVAS DE TRATAMENTO: [Descrição das alternativas]

6. CONSEQUÊNCIAS DA NÃO REALIZAÇÃO: [Descrição]

Declaro que tive a oportunidade de fazer perguntas, que foram respondidas satisfatoriamente, e que compreendo o conteúdo deste termo.

Autorizo a realização do procedimento descrito acima.

[Local], [Data]

_________________________          _________________________
PACIENTE                           PROFISSIONAL`,
  },
  {
    id: "lgpd-privacy",
    title: "Política de Privacidade (LGPD)",
    description: "Política de privacidade conforme a Lei Geral de Proteção de Dados",
    icon: Lock,
    content: `POLÍTICA DE PRIVACIDADE - LEI GERAL DE PROTEÇÃO DE DADOS (LGPD)

1. CONTROLADOR DOS DADOS
[Nome do Profissional/Clínica], inscrito no CNPJ/CPF [número], com sede em [endereço].

2. DADOS PESSOAIS COLETADOS
- Dados de identificação (nome, CPF, RG, data de nascimento)
- Dados de contato (telefone, e-mail, endereço)
- Dados de saúde (histórico médico, exames, diagnósticos)
- Dados financeiros (para fins de cobrança)

3. FINALIDADE DO TRATAMENTO
Os dados pessoais são tratados para:
a) Prestação de serviços de saúde;
b) Cumprimento de obrigações legais e regulatórias;
c) Comunicação com o paciente;
d) Emissão de documentos fiscais.

4. BASE LEGAL
O tratamento dos dados é realizado com base no Art. 7º e Art. 11 da LGPD.

5. COMPARTILHAMENTO
Os dados poderão ser compartilhados com:
a) Laboratórios e outros profissionais de saúde (quando necessário);
b) Órgãos reguladores (quando exigido por lei);
c) Operadoras de planos de saúde (quando aplicável).

6. DIREITOS DO TITULAR
O paciente tem direito a: acesso, correção, anonimização, portabilidade, eliminação e revogação do consentimento.

7. SEGURANÇA
Adotamos medidas técnicas e administrativas para proteger os dados pessoais.

8. CONTATO DO ENCARREGADO (DPO)
[Nome], [e-mail], [telefone]

Última atualização: [Data]`,
  },
  {
    id: "responsibility-terms",
    title: "Termo de Responsabilidade da Clínica",
    description: "Termo de responsabilidade e limitação de responsabilidade",
    icon: Shield,
    content: `TERMO DE RESPONSABILIDADE

[Nome da Clínica/Consultório], inscrito no CNPJ [número], representado por [Nome do Responsável], declara:

1. RESPONSABILIDADE PROFISSIONAL
A clínica se compromete a prestar serviços com qualidade, ética e em conformidade com as normas vigentes.

2. EQUIPE PROFISSIONAL
Todos os profissionais possuem registro ativo em seus respectivos conselhos e seguem os códigos de ética profissional.

3. INSTALAÇÕES E EQUIPAMENTOS
A clínica mantém suas instalações e equipamentos em conformidade com as normas sanitárias (ANVISA/Vigilância Sanitária).

4. SIGILO PROFISSIONAL
Garantimos o sigilo de todas as informações dos pacientes, conforme o Código de Ética e a LGPD.

5. LIMITAÇÃO DE RESPONSABILIDADE
A clínica não se responsabiliza por:
a) Resultados que dependam de fatores biológicos individuais;
b) Não adesão do paciente ao tratamento prescrito;
c) Informações falsas ou omitidas pelo paciente.

6. OUVIDORIA
Disponibilizamos canal de ouvidoria para reclamações e sugestões: [contato].

[Local], [Data]

_________________________
RESPONSÁVEL TÉCNICO`,
  },
];

const LegalTemplatesTab = () => {
  const handleDownload = (template: typeof templates[0]) => {
    const blob = new Blob([template.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Modelo "${template.title}" baixado!`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <p className="text-sm text-muted-foreground">Modelos de documentos jurídicos para profissionais de saúde</p>

      {templates.map((t) => {
        const Icon = t.icon;
        return (
          <div key={t.id} className="glass-card p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{t.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleDownload(t)} size="sm" variant="outline" className="gap-1">
                <Download className="h-3.5 w-3.5" /> Baixar Modelo
              </Button>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};

export default LegalTemplatesTab;
