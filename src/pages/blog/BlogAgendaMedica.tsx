import SEOHead from "@/components/SEOHead";
import blogImage from "@/assets/blog/agenda-medica.jpg";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlogBreadcrumb from "@/components/blog/BlogBreadcrumb";
import RelatedPosts from "@/components/blog/RelatedPosts";
import FAQSection from "@/components/blog/FAQSection";
import { buildBlogPostingSchema, buildBreadcrumbSchema } from "@/components/blog/blogSchema";

const SLUG = "agenda-medica-digital";
const TITLE = "Agenda Médica Digital: Como Organizar seu Consultório e Reduzir Faltas";
const PUBLISHED = "2026-04-14";
const MODIFIED = "2026-05-02";

const BlogAgendaMedica = () => (
  <>
    <SEOHead
      title="Agenda Online para Médicos: Como Reduzir Faltas"
      description="Sistema de agenda online para médicos: lembretes automáticos, integração com prontuário eletrônico e teleconsulta. Reduza faltas em até 40% no consultório."
      canonical={`/blog/${SLUG}`}
      ogType="article"
      ogImage={`https://salbcare.com.br${blogImage}`}
      keywords={[
        "agenda online para médicos",
        "sistema para consultório médico",
        "como organizar agenda de consultório",
        "software para clínica",
        "agenda médica digital",
        "teleconsulta",
      ]}
      publishedTime={PUBLISHED}
      modifiedTime={MODIFIED}
      jsonLd={[
        buildBlogPostingSchema({
          slug: SLUG,
          headline: TITLE,
          description:
            "Como usar uma agenda médica digital para organizar consultas, reduzir faltas e gerenciar pacientes. Guia prático para profissionais de saúde autônomos.",
          image: blogImage,
          datePublished: PUBLISHED,
          dateModified: MODIFIED,
          category: "Gestão",
          keywords: ["agenda online", "sistema para consultório", "agenda médica"],
        }),
        buildBreadcrumbSchema(TITLE, SLUG),
      ]}
    />
    <article className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <BlogBreadcrumb articleTitle="Agenda Médica Digital" />
        <header className="space-y-3">
          <img src={blogImage} alt="Agenda online para médicos em tablet e celular" width={1200} height={672} className="rounded-xl w-full object-cover mb-4" loading="eager" />
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Gestão</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">{TITLE}</h1>
          <p className="text-muted-foreground text-base">
            Uma agenda online para médicos é a base de um consultório organizado. Saiba como implementar e otimizar seus horários com um sistema para profissional de saúde moderno.
          </p>
          <time className="text-xs text-muted-foreground" dateTime={PUBLISHED}>14 de abril de 2026</time>
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
            <li><strong>Integração com <Link to="/blog/prontuario-digital-dentista" className="text-primary hover:underline">prontuário eletrônico</Link>:</strong> ao clicar no paciente, acesse o histórico completo.</li>
            <li><strong>Suporte a <Link to="/blog/teleconsulta-medica" className="text-primary hover:underline">teleconsulta</Link>:</strong> link de videochamada gerado automaticamente.</li>
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

        <FAQSection
          items={[
            {
              question: "Como organizar agenda de consultório de forma eficiente?",
              answer: "Use um sistema com agendamento online, defina blocos de horário fixos, ative lembretes automáticos e integre a agenda ao prontuário eletrônico. A SalbCare faz tudo isso em uma única plataforma.",
            },
            {
              question: "Agenda online para médicos é segura para dados de pacientes?",
              answer: "Sim, desde que o sistema siga a LGPD. Procure plataformas com criptografia, controle de acesso por usuário e logs de auditoria — características incluídas na SalbCare.",
            },
            {
              question: "Quanto custa um sistema para consultório médico?",
              answer: "Os planos variam conforme funcionalidades. A SalbCare tem plano Essencial a partir de R$ 89/mês com agenda online, prontuário, teleconsulta e prescrição digital — sem comissão por consulta.",
            },
          ]}
        />

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild className="gradient-primary font-semibold gap-2">
            <Link to="/cadastro">Teste agenda grátis <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/planos">Ver planos</Link>
          </Button>
        </div>

        <RelatedPosts currentSlug={SLUG} preferSlugs={["teleconsulta-medica", "prontuario-digital-dentista", "receituario-digital"]} />
      </div>
    </article>
  </>
);

export default BlogAgendaMedica;
