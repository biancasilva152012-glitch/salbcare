import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { X, Shield, MessageCircle, Lock, HelpCircle, Calendar, FileText, Video, UserSearch, DollarSign, Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import PageContainer from "@/components/PageContainer";
import SEOHead from "@/components/SEOHead";
import TaxSimulatorWidget from "@/components/financial/TaxSimulatorWidget";
import FreedomCalculator from "@/components/financial/FreedomCalculator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const pillars = [
  { icon: Calendar, label: "Agenda", desc: "Gerencie horários e agendamentos" },
  { icon: FileText, label: "Prontuário", desc: "Registros clínicos digitais" },
  { icon: Video, label: "Teleconsulta", desc: "Atendimento remoto seguro" },
  { icon: UserSearch, label: "Captação", desc: "Pacientes encontram você" },
  { icon: DollarSign, label: "Financeiro", desc: "Controle receitas e despesas" },
  { icon: Calculator, label: "Contabilidade", desc: "Contador especializado em saúde" },
];

const notItems = [
  "Não somos um plano de saúde",
  "Não somos um escritório de contabilidade",
  "Não prestamos serviços médicos ou clínicos",
  "Não substituímos seu contador para obrigações acessórias completas (balanço, escrita fiscal, folha)",
];

const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const HowItWorks = () => {
  const navigate = useNavigate();
  const { subscription, user } = useAuth();
  const isPaying = user && subscription.paymentStatus === "active";

  const handleContadorClick = () => {
    if (!isPaying) {
      toast.error("Acesso exclusivo para assinantes. Assine um plano para falar com o contador.", {
        action: { label: "Ver planos", onClick: () => navigate("/subscription") },
      });
      return;
    }
    navigate("/accounting");
  };

  return (
  <PageContainer backTo="/" className="overflow-y-auto">
    <SEOHead
      title="Como Funciona a SalbCare"
      description="Saiba como a SalbCare ajuda profissionais de saúde autônomos com agenda, prontuário, teleconsulta e assessoria contábil integrada."
      canonical="/como-funciona"
    />
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-8">
      {/* Header */}
      <motion.div variants={item} className="text-center space-y-2">
        <div className="mx-auto mb-4 h-16 w-16">
          <img src="/pwa-icon-512.png" alt="SALBCARE" className="h-full w-full object-contain" />
        </div>
        <h1 className="text-2xl font-bold">Como Funciona a SalbCare</h1>
        <p className="text-sm text-muted-foreground">Tudo que você precisa saber em 2 minutos</p>
      </motion.div>

      {/* Seção 1 */}
      <motion.div variants={item} className="glass-card p-5 space-y-3">
        <h2 className="text-lg font-bold">O que é a SalbCare</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A SalbCare é um ecossistema digital completo para profissionais de saúde autônomos. 
          Tudo que o profissional precisa para gerir e crescer seu consultório está em um único lugar: 
          agenda, prontuário, teleconsulta, captação de pacientes, controle financeiro e assessoria 
          contábil especializada em saúde.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A plataforma opera como um <span className="font-semibold text-foreground">marketplace de saúde</span>: 
          profissionais pagam mensalidade para acessar o ecossistema e crescer. Pacientes descobrem 
          seu perfil sem precisar se cadastrar — a conta é criada só na hora de agendar. Tudo acontece 
          dentro da plataforma, sem ferramentas externas, sem redirecionamentos.
        </p>
      </motion.div>

      {/* Pilares do ecossistema */}
      <motion.div variants={item} className="space-y-3">
        <h2 className="text-center text-lg font-bold">Os 6 pilares do ecossistema</h2>
        <motion.div
          className="grid grid-cols-3 gap-2 sm:gap-3"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {pillars.map(({ icon: Icon, label, desc }) => (
            <motion.div
              key={label}
              variants={{ hidden: { opacity: 0, y: 20, scale: 0.9 }, show: { opacity: 1, y: 0, scale: 1 } }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="glass-card flex flex-col items-center gap-1.5 p-3 sm:p-4 text-center"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary sm:h-12 sm:w-12">
                <Icon className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
              </div>
              <span className="text-xs font-semibold sm:text-sm">{label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight sm:text-xs">{desc}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Seção 2 */}
      <motion.div variants={item} className="glass-card p-5 space-y-3">
        <h2 className="text-lg font-bold">O que a SalbCare não é</h2>
        <ul className="space-y-3">
          {notItems.map((text) => (
            <li key={text} className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 mt-0.5">
                <X className="h-3.5 w-3.5 text-destructive" />
              </div>
              <span className="text-sm text-muted-foreground">{text}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Seção 3 */}
      <motion.div variants={item} className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Como funciona o contador parceiro</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Você será atendido por um contador parceiro da SalbCare com CRC ativo, 
          especializado em profissionais de saúde. Ele orienta você sobre impostos, regime 
          tributário e planejamento financeiro via chat.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          O atendimento e a responsabilidade técnica são do contador. 
          Para serviços além do escopo do plano, vocês combinam diretamente.
        </p>
        <Button
          onClick={handleContadorClick}
          className="w-full gradient-primary font-semibold"
        >
          Falar com meu contador agora
        </Button>
      </motion.div>

      {/* Seção 4 */}
      <motion.div variants={item} className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Seus dados estão seguros?</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sim. Todos os dados são armazenados com criptografia. 
          Seguimos a LGPD — você pode solicitar, corrigir ou excluir seus dados 
          a qualquer momento em{" "}
          <Link to="/profile" className="text-primary font-medium hover:underline">Meu Perfil</Link>.
        </p>
        <p className="text-sm font-medium text-foreground">Nunca vendemos seus dados.</p>
      </motion.div>

      {/* Calculadora de Economia */}
      <motion.div variants={item} className="space-y-3">
        <h2 className="text-center text-lg font-bold">Calculadora de Economia Tributária</h2>
        <p className="text-center text-xs text-muted-foreground">Descubra quanto você pode economizar como PJ na SalbCare</p>
        <TaxSimulatorWidget />
      </motion.div>

      {/* Calculadora de Liberdade */}
      <motion.div variants={item}>
        <FreedomCalculator />
      </motion.div>

      {/* FAQ */}
      <motion.div variants={item} className="space-y-3">
        <h2 className="text-center text-lg font-bold">Perguntas Frequentes</h2>
        <Accordion type="single" collapsible className="space-y-2">
          {[
            { q: "Preciso ter CNPJ para usar a SalbCare?", a: "Não. Você pode começar como pessoa física. Se quiser abrir CNPJ, ajudamos com o processo direto pela plataforma." },
            { q: "A SalbCare substitui meu contador?", a: "Não. Oferecemos um contador parceiro especializado em saúde para orientações e planejamento tributário. Para obrigações acessórias completas (balanço, folha, escrita fiscal), você combina diretamente com o contador." },
            { q: "Os dados dos meus pacientes estão seguros?", a: "Sim. Todos os dados são armazenados com criptografia e seguimos a LGPD. Você pode solicitar, corrigir ou excluir dados a qualquer momento." },
            { q: "Como funciona a teleconsulta?", a: "Você cria uma sala de atendimento, compartilha o link com o paciente e realiza a consulta por vídeo. Prontuário, receita e atestado podem ser preenchidos durante a chamada." },
            { q: "Posso testar antes de assinar?", a: "Sim! Oferecemos um período de teste gratuito para que você conheça todas as funcionalidades do ecossistema." },
            { q: "Quanto economizo com a SalbCare?", a: "Depende do seu faturamento. Use a calculadora acima para simular a economia comparando tributação como pessoa física vs pessoa jurídica pelo Simples Nacional." },
            { q: "Pacientes pagam para usar a plataforma?", a: "Não. Pacientes criam conta gratuitamente, encontram profissionais e agendam consultas sem custo." },
            { q: "Quais profissões de saúde podem usar?", a: "Médicos, dentistas, psicólogos, fisioterapeutas, nutricionistas, fonoaudiólogos, enfermeiros e outros profissionais de saúde autônomos." },
          ].map(({ q, a }, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="glass-card border-none px-4">
              <AccordionTrigger className="text-sm text-left font-semibold hover:no-underline py-3">{q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>

      {/* Seção 5 */}
      <motion.div variants={item} className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Preciso de ajuda</h2>
        </div>
        <div className="flex flex-col gap-2">
          <a href="mailto:biancadealbuquerquep@gmail.com">
            <Button className="w-full gradient-primary font-semibold">
              Falar com o suporte
            </Button>
          </a>
          <Link to="/como-funciona#faq-0">
            <Button variant="outline" className="w-full">
              Ver perguntas frequentes
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* CTA fixo */}
      <motion.div variants={item} className="glass-card p-5 text-center space-y-3 ring-1 ring-primary/30">
        <h2 className="text-lg font-bold">Pronto para transformar seu consultório?</h2>
        <p className="text-sm text-muted-foreground">Comece agora com um período de teste gratuito</p>
        <Button
          onClick={() => navigate("/register")}
          className="w-full gradient-primary font-semibold gap-2"
          size="lg"
        >
          Criar minha conta grátis
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  </PageContainer>
  );
};

export default HowItWorks;
