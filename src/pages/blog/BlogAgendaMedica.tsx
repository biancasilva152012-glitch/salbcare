import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlogBreadcrumb from "@/components/blog/BlogBreadcrumb";

const BlogAgendaMedica = () => (
  <>
    <SEOHead
      title="Agenda Médica Digital: Organize seu Consultório"
      description="Como usar uma agenda médica digital para organizar consultas, reduzir faltas e gerenciar pacientes. Guia prático para profissionais de saúde autônomos."
      canonical="/blog/agenda-medica-digital"
      ogType="article"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Agenda Médica Digital: Como Organizar seu Consultório Online",
        description: "Guia completo sobre agenda digital para médicos e profissionais de saúde: funcionalidades, benefícios e como implementar.",
        author: { "@type": "Organization", name: "SalbCare" },
        publisher: { "@type": "Organization", name: "SalbCare", url: "https://salbcare.com.br" },
        datePublished: "2026-04-14",
        mainEntityOfPage: "https://salbcare.com.br/blog/agenda-medica-digital",
      }}
    />
    <article className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <BlogBreadcrumb articleTitle="Agenda Médica Digital" />
        <header className="space-y-3">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Gestão</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
            Agenda Médica Digital: Como Organizar seu Consultório e Reduzir Faltas
          </h1>
          <p className="text-muted-foreground text-base">
            Uma agenda digital inteligente é a base de um consultório organizado. Saiba como implementar e otimizar seus horários.
          </p>
          <time className="text-xs text-muted-foreground" dateTime="2026-04-14">14 de abril de 2026</time>
        </header>
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">Por que trocar a agenda de papel?</h2>
          <p>A agenda em papel gera riscos: perda de informações, dificuldade de remarcar, impossibilidade de acesso remoto e falta de histórico organizado. A agenda digital resolve todos esses problemas com praticidade e segurança.</p>

          <h2 className="text-xl font-semibold text-foreground">Funcionalidades essenciais</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Agendamento online:</strong> pacientes reservam horários pelo link do seu perfil.</li>
            <li><strong>Confirmação automática:</strong> reduz faltas com lembretes por WhatsApp.</li>
            <li><strong>Bloqueio de horários:</strong> defina intervalos, almoço e dias de folga.</li>
            <li><strong>Visualização diária/semanal:</strong> veja toda a semana de uma vez.</li>
            <li><strong>Integração com prontuário:</strong> ao clicar no paciente, acesse o histórico completo.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Como reduzir faltas de pacientes</h2>
          <p>Estudos mostram que lembretes automáticos reduzem no-shows em até 40%. Na SalbCare, o paciente recebe confirmação por email e o profissional pode enviar lembrete por WhatsApp com um clique.</p>

          <h2 className="text-xl font-semibold text-foreground">Agenda digital na SalbCare</h2>
          <p>A plataforma SalbCare oferece agenda integrada com:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Configuração de horários disponíveis por dia da semana</li>
            <li>Duração personalizada de consulta (30, 45, 60 minutos)</li>
            <li>Link público para agendamento direto</li>
            <li>Integração com Google Meet para teleconsultas</li>
          </ol>

          <h2 className="text-xl font-semibold text-foreground">Para quem serve?</h2>
          <p>Médicos, psicólogos, dentistas, nutricionistas, fisioterapeutas e qualquer profissional de saúde que atenda com hora marcada. Se você ainda usa WhatsApp para agendar consultas manualmente, uma agenda digital vai transformar sua rotina.</p>
        </div>
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild className="gradient-primary font-semibold gap-2">
            <Link to="/cadastro">Testar agenda grátis por 7 dias <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/planos">Ver planos</Link>
          </Button>
        </div>
      </div>
    </article>
  </>
);

export default BlogAgendaMedica;
