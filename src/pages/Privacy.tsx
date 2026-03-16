import PageContainer from "@/components/PageContainer";

const Privacy = () => {
  return (
    <PageContainer>
      <div className="space-y-6 pb-8">
        <h1 className="text-2xl font-bold">Política de Privacidade</h1>
        <p className="text-xs text-muted-foreground">Última atualização: 14 de março de 2026</p>

        <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">O que coletamos</h2>
            <p>
              Coletamos apenas os dados necessários para o funcionamento da plataforma:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Nome, e-mail, telefone e tipo profissional (no cadastro)</li>
              <li>Dados de pacientes que você registra (nome, contato, histórico clínico)</li>
              <li>Registros de consultas, prontuários e prescrições</li>
              <li>Dados financeiros de transações registradas na plataforma</li>
              <li>Mensagens trocadas no chat com contador parceiro</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Como usamos seus dados</h2>
            <p>
              Seus dados são usados exclusivamente para:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Permitir o funcionamento das funcionalidades da plataforma (agenda, prontuário, financeiro)</li>
              <li>Conectar você ao contador parceiro para assessoria contábil</li>
              <li>Enviar comunicações sobre sua conta e assinatura</li>
              <li>Melhorar a experiência de uso da plataforma</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Compartilhamento de dados</h2>
            <p>
              A SALBCARE poderá compartilhar dados <strong>agregados e anonimizados</strong> com parceiros comerciais (B2B) para fins de análise de mercado, relatórios setoriais e melhoria de serviços. Esses dados:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Não permitem a identificação individual de profissionais ou pacientes</li>
              <li>São processados de forma estatística (ex: volume de consultas por região, especialidades mais ativas)</li>
              <li>Nunca incluem dados sensíveis de saúde, informações pessoais ou dados financeiros individualizados</li>
            </ul>
            <p>
              Dados pessoais identificáveis <strong>nunca</strong> são compartilhados com terceiros sem seu consentimento expresso, exceto quando exigido por lei ou ordem judicial.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Dados de pacientes</h2>
            <p>
              Os dados de saúde dos seus pacientes são considerados dados sensíveis pela LGPD (Lei nº 13.709/2018). Eles são:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Armazenados de forma criptografada em servidores seguros</li>
              <li>Acessíveis apenas por você (o profissional que os registrou)</li>
              <li>Nunca acessados pela equipe da SALBCARE sem sua autorização</li>
              <li>Protegidos por controles de acesso baseados em autenticação</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Cookies</h2>
            <p>
              Usamos apenas cookies essenciais para manter sua sessão ativa e garantir o funcionamento da plataforma. Não usamos cookies de rastreamento ou publicidade.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Seus direitos (LGPD Art. 18)</h2>
            <p>
              Você tem direito a:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Acessar</strong> todos os dados que temos sobre você</li>
              <li><strong>Corrigir</strong> dados incompletos ou desatualizados</li>
              <li><strong>Excluir</strong> sua conta e todos os dados associados</li>
              <li><strong>Exportar</strong> seus dados em formato legível</li>
              <li><strong>Revogar</strong> seu consentimento a qualquer momento</li>
            </ul>
            <p>
              Para exercer esses direitos, acesse <strong>Perfil → Privacidade e meus dados</strong> ou envie um e-mail para <a href="mailto:contato@salbcare.com.br" className="text-primary hover:underline">contato@salbcare.com.br</a>. Respondemos em até 15 dias úteis.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Retenção de dados</h2>
            <p>
              Seus dados são mantidos enquanto sua conta estiver ativa. Ao solicitar a exclusão da conta, todos os dados são removidos permanentemente em até 30 dias, exceto quando a retenção for exigida por lei (ex: registros fiscais devem ser mantidos por 5 anos).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Como nos contatar</h2>
            <p>
              Se tiver dúvidas sobre esta política ou sobre seus dados:
            </p>
            <ul className="list-none space-y-1">
              <li>📧 E-mail: <a href="mailto:contato@salbcare.com.br" className="text-primary hover:underline">contato@salbcare.com.br</a></li>
              <li>📍 Responsável: SALBCARE Tecnologia LTDA</li>
            </ul>
          </section>
        </div>
      </div>
    </PageContainer>
  );
};

export default Privacy;
