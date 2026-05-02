import SEOHead from "@/components/SEOHead";
import blogImage from "@/assets/blog/teleconsulta-medica.jpg";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlogBreadcrumb from "@/components/blog/BlogBreadcrumb";
import RelatedPosts from "@/components/blog/RelatedPosts";
import FAQSection from "@/components/blog/FAQSection";
import { buildBlogPostingSchema, buildBreadcrumbSchema } from "@/components/blog/blogSchema";

const SLUG = "teleconsulta-medica";
const TITLE = "Teleconsulta Médica: Como Atender Pacientes Online de Forma Legal e Segura";
const PUBLISHED = "2026-04-14";
const MODIFIED = "2026-05-02";

const BlogTeleconsultaMedica = () => (
  <>
    <SEOHead
      title="Teleconsulta: Como Atender Pacientes Online"
      description="Como fazer teleconsulta dentro da Resolução CFM 2.314/2022. Software para clínica, prescrição digital ICP-Brasil e prontuário eletrônico para médicos online."
      canonical={`/blog/${SLUG}`}
      ogType="article"
      ogImage={`https://salbcare.com.br${blogImage}`}
      keywords={[
        "teleconsulta",
        "teleconsulta médica",
        "telemedicina",
        "sistema para profissional de saúde",
        "prontuário eletrônico",
        "prescrição digital",
        "agenda online para médicos",
      ]}
      publishedTime={PUBLISHED}
      modifiedTime={MODIFIED}
      jsonLd={[
        buildBlogPostingSchema({
          slug: SLUG,
          headline: TITLE,
          description:
            "Guia completo sobre teleconsulta médica no Brasil: regulamentação CFM 2.314/2022, plataformas, receituário digital e como começar.",
          image: blogImage,
          datePublished: PUBLISHED,
          dateModified: MODIFIED,
          category: "Telemedicina",
          keywords: ["teleconsulta", "telemedicina", "CFM 2.314", "prescrição digital"],
        }),
        buildBreadcrumbSchema(TITLE, SLUG),
      ]}
    />
    <article className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <BlogBreadcrumb articleTitle="Teleconsulta Médica" />

        <header className="space-y-3">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Telemedicina</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">{TITLE}</h1>
          <p className="text-muted-foreground text-base">
            A telemedicina é regulamentada no Brasil desde 2022. Saiba como montar seu consultório virtual, escolher o sistema para profissional de saúde certo e atender com segurança jurídica.
          </p>
          <time className="text-xs text-muted-foreground" dateTime={PUBLISHED}>14 de abril de 2026</time>
        </header>

        <img src={blogImage} alt="Teleconsulta médica realizada por videochamada com prontuário eletrônico" width={1200} height={672} className="rounded-xl w-full object-cover" loading="eager" />

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">O que é teleconsulta médica?</h2>
          <p>
            A teleconsulta é o atendimento médico realizado a distância, por meio de tecnologias de comunicação (videochamada). Permite consultas, acompanhamentos, emissão de receitas e atestados digitais, sem a presença física do paciente no consultório.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Regulamentação: o que diz o CFM?</h2>
          <p>
            A <strong>Resolução CFM 2.314/2022</strong> regulamenta a telemedicina no Brasil. Os principais pontos são:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>É obrigatório o <strong>consentimento informado</strong> do paciente</li>
            <li>O médico deve estar inscrito no CRM do estado onde atende</li>
            <li>O <Link to="/blog/prontuario-digital-dentista" className="text-primary hover:underline">prontuário eletrônico</Link> é obrigatório</li>
            <li>Receitas digitais devem ter <strong>assinatura eletrônica ICP-Brasil</strong> ou equivalente — veja o guia de <Link to="/blog/receituario-digital" className="text-primary hover:underline">prescrição digital</Link></li>
            <li>Em emergências, o paciente deve ser encaminhado para atendimento presencial</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Como montar seu consultório virtual</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Escolha um sistema para profissional de saúde seguro como o <strong>SalbCare</strong></li>
            <li>Configure seu perfil com CRM, especialidade e link do Google Meet</li>
            <li>Defina seus horários na <Link to="/blog/agenda-medica-digital" className="text-primary hover:underline">agenda online</Link></li>
            <li>Receba agendamentos e atenda diretamente pela plataforma</li>
          </ol>

          <h2 className="text-xl font-semibold text-foreground">Vantagens para o médico autônomo</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Sem comissão:</strong> 100% do valor da consulta é seu</li>
            <li><strong>Agenda integrada:</strong> controle de horários e pacientes em um só lugar</li>
            <li><strong>Prontuário + receituário:</strong> documentação digital com validade legal</li>
            <li><strong>Gestão financeira:</strong> acompanhe ganhos e impostos com mentoria de IA — veja como em <Link to="/blog/gestao-financeira-profissional-saude" className="text-primary hover:underline">gestão financeira para profissionais de saúde</Link></li>
          </ul>
        </div>

        <FAQSection
          items={[
            {
              question: "Teleconsulta médica é legal no Brasil?",
              answer: "Sim. A Resolução CFM 2.314/2022 regulamenta a telemedicina e permite consulta, monitoramento, emissão de receitas e atestados a distância, desde que o médico esteja inscrito no CRM e o paciente dê consentimento informado.",
            },
            {
              question: "Preciso de assinatura digital ICP-Brasil para receita online?",
              answer: "Para medicamentos controlados (tarjas vermelha, azul e amarela) sim. Para receitas simples, a Lei 14.063/2020 aceita assinatura eletrônica avançada. A SalbCare suporta os dois fluxos no mesmo prontuário.",
            },
            {
              question: "Qual o melhor sistema para teleconsulta?",
              answer: "Procure plataformas com prontuário eletrônico integrado, agenda online, prescrição digital e link de videochamada (Google Meet ou similar). A SalbCare reúne tudo isso sem cobrar comissão por consulta.",
            },
            {
              question: "Posso atender pacientes de outros estados?",
              answer: "Sim, desde que esteja inscrito no CRM de pelo menos um estado. Em emergências, é obrigatório encaminhar para atendimento presencial.",
            },
          ]}
        />

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild className="gradient-primary font-semibold gap-2">
            <Link to="/cadastro">
              Começar agora <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/consulta-online/medico">Ver médicos disponíveis</Link>
          </Button>
        </div>

        <RelatedPosts currentSlug={SLUG} preferSlugs={["receituario-digital", "agenda-medica-digital", "prontuario-digital-dentista"]} />
      </div>
    </article>
  </>
);

export default BlogTeleconsultaMedica;
