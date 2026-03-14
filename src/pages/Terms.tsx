import PageContainer from "@/components/PageContainer";

const Terms = () => {
  return (
    <PageContainer>
      <div className="space-y-6 pb-8">
        <h1 className="text-2xl font-bold">Termos de Uso</h1>
        <p className="text-xs text-muted-foreground">Última atualização: 14 de março de 2026</p>

        <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar a plataforma SALBCARE, você concorda com estes Termos de Uso. Caso não concorde com alguma disposição, não utilize a plataforma.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. Descrição do Serviço</h2>
            <p>
              A SALBCARE é uma plataforma tecnológica que oferece ferramentas de gestão para profissionais de saúde, incluindo agenda, prontuário eletrônico, teleconsulta, controle financeiro e conexão com serviços de assessoria contábil e jurídica.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. Assessoria Contábil — Intermediação</h2>
            <div className="glass-card p-4 space-y-2 border-l-4 border-primary">
              <p className="text-foreground font-medium text-sm">
                Cláusula de Intermediação Contábil
              </p>
              <p>
                A SALBCARE atua exclusivamente como plataforma tecnológica de intermediação. Os serviços de assessoria contábil são prestados por profissionais contábeis parceiros, pessoas físicas ou jurídicas devidamente habilitadas pelo Conselho Regional de Contabilidade (CRC), que respondem técnica e legalmente pelos serviços prestados.
              </p>
              <p>
                A SALBCARE não é responsável por erros, omissões ou danos decorrentes dos serviços prestados pelos contadores parceiros. A responsabilidade técnica e legal é exclusivamente do profissional contábil que presta o serviço.
              </p>
              <p>
                Os honorários dos contadores parceiros são cobrados diretamente pelo profissional contábil, de acordo com os serviços realizados. A SALBCARE facilita a conexão entre o usuário e o contador, mas não é responsável pelos valores cobrados pelo contador.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Prontuário Eletrônico</h2>
            <p>
              O prontuário eletrônico da SALBCARE é uma ferramenta de registro e organização de dados clínicos. Para validade legal plena conforme a Resolução CFM nº 1.821/2007, o profissional deve utilizar certificado digital ICP-Brasil (A1 ou A3) para assinar os documentos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Teleconsulta</h2>
            <p>
              A funcionalidade de teleconsulta é oferecida como ferramenta de comunicação. A responsabilidade pelo atendimento, diagnóstico e tratamento é integralmente do profissional de saúde que utiliza a plataforma.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Proteção de Dados</h2>
            <p>
              A SALBCARE trata os dados pessoais e de saúde em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). Os dados de pacientes são armazenados de forma segura e acessíveis apenas pelo profissional responsável.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">7. Planos e Pagamentos</h2>
            <p>
              Os planos de assinatura incluem período de teste gratuito de 7 dias. Após o período de teste, a cobrança é realizada mensalmente. O cancelamento pode ser feito a qualquer momento, sem multa.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">8. Limitação de Responsabilidade</h2>
            <p>
              A SALBCARE não se responsabiliza por decisões clínicas, contábeis ou jurídicas tomadas com base nas informações disponibilizadas na plataforma. A plataforma é uma ferramenta de apoio e organização — a responsabilidade profissional é de cada usuário e dos parceiros que prestam serviços através da plataforma.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">9. Contato</h2>
            <p>
              Dúvidas sobre estes Termos de Uso podem ser enviadas para o suporte da SALBCARE através da plataforma.
            </p>
          </section>
        </div>
      </div>
    </PageContainer>
  );
};

export default Terms;
