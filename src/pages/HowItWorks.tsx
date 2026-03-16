import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { X, Shield, MessageCircle, Lock, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/PageContainer";

const notItems = [
  "Não somos um plano de saúde",
  "Não somos um escritório de contabilidade",
  "Não prestamos serviços médicos ou clínicos",
  "Não substituímos seu contador para obrigações acessórias completas (balanço, escrita fiscal, folha)",
];

const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const HowItWorks = () => (
  <PageContainer>
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-8">
      {/* Header */}
      <motion.div variants={item} className="text-center space-y-2">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl overflow-hidden shadow-lg">
          <img src="/pwa-icon-512.png" alt="SALBCARE" className="h-full w-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold">Como funciona a SALBCARE</h1>
        <p className="text-sm text-muted-foreground">Tudo que você precisa saber em 2 minutos</p>
      </motion.div>

      {/* Seção 1 */}
      <motion.div variants={item} className="glass-card p-5 space-y-3">
        <h2 className="text-lg font-bold">O que é a SALBCARE</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A SALBCARE é uma plataforma de gestão para profissionais de saúde autônomos. 
          Aqui você organiza sua agenda, seus pacientes, suas finanças e tem acesso a um 
          contador especializado em saúde — tudo em um lugar só.
        </p>
      </motion.div>

      {/* Seção 2 */}
      <motion.div variants={item} className="glass-card p-5 space-y-3">
        <h2 className="text-lg font-bold">O que a SALBCARE não é</h2>
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
          Você será atendido por um contador parceiro da SALBCARE com CRC ativo, 
          especializado em profissionais de saúde. Ele orienta você sobre impostos, regime 
          tributário e planejamento financeiro via chat.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          O atendimento e a responsabilidade técnica são do contador. 
          Para serviços além do escopo do plano, vocês combinam diretamente.
        </p>
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

      {/* Seção 5 */}
      <motion.div variants={item} className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Preciso de ajuda</h2>
        </div>
        <div className="flex flex-col gap-2">
          <a href="mailto:contato@salbcare.com.br">
            <Button className="w-full gradient-primary font-semibold">
              Falar com o suporte
            </Button>
          </a>
          <Link to="/terms">
            <Button variant="outline" className="w-full">
              Ver perguntas frequentes
            </Button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  </PageContainer>
);

export default HowItWorks;
