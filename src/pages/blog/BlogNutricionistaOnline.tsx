import SEOHead from "@/components/SEOHead";
import blogImage from "@/assets/blog/nutricionista-online.jpg";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlogBreadcrumb from "@/components/blog/BlogBreadcrumb";
import RelatedPosts from "@/components/blog/RelatedPosts";
import { buildBlogPostingSchema, buildBreadcrumbSchema } from "@/components/blog/blogSchema";

const SLUG = "nutricionista-online";
const TITLE = "Nutricionista Online: Como Funciona a Consulta por Vídeo e Como Agendar";

const BlogNutricionistaOnline = () => (
  <>
    <SEOHead
      title="Nutricionista Online: Software para Nutricionista"
      description="Software para nutricionista com teleconsulta, prontuário eletrônico e agenda online. Atenda pacientes por vídeo dentro das normas do CFN. Teste grátis."
      canonical={`/blog/${SLUG}`}
      ogType="article"
      ogImage={`https://salbcare.com.br${blogImage}`}
      keywords={["software para nutricionista", "nutricionista online", "teleconsulta", "sistema para profissional de saúde", "CFN"]}
      publishedTime="2026-04-14"
      modifiedTime="2026-05-02"
      jsonLd={[
        buildBlogPostingSchema({
          slug: SLUG, headline: TITLE,
          description: "Guia completo sobre consulta nutricional online: regulamentação do CFN, benefícios e como agendar.",
          image: blogImage, datePublished: "2026-04-14", dateModified: "2026-05-02",
          category: "Nutrição", keywords: ["nutricionista online", "CFN", "teleconsulta"],
        }),
        buildBreadcrumbSchema(TITLE, SLUG),
      ]}
    />
    <article className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <BlogBreadcrumb articleTitle="Nutricionista Online" />
        <header className="space-y-3">
          <img src={blogImage} alt="Nutricionista online em consulta por vídeo" width={1200} height={672} className="rounded-xl w-full object-cover mb-4" loading="eager" />
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Nutrição</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
            Nutricionista Online: Como Funciona a Consulta por Vídeo e Como Agendar
          </h1>
          <p className="text-muted-foreground text-base">
            A consulta nutricional online é autorizada pelo Conselho Federal de Nutricionistas e permite acompanhamento personalizado de qualquer lugar.
          </p>
          <time className="text-xs text-muted-foreground" dateTime="2026-04-14">14 de abril de 2026</time>
        </header>
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">O que é a consulta online com nutricionista?</h2>
          <p>É o atendimento nutricional realizado por videochamada, onde o nutricionista faz anamnese, avalia hábitos alimentares, solicita exames e elabora um plano alimentar individualizado — tudo a distância, com a mesma qualidade do atendimento presencial.</p>

          <h2 className="text-xl font-semibold text-foreground">Regulamentação do CFN</h2>
          <p>O Conselho Federal de Nutricionistas autoriza a teleconsulta nutricional. O profissional deve estar inscrito no CRN e seguir as diretrizes éticas da profissão. O plano alimentar é elaborado exclusivamente pelo nutricionista responsável pelo atendimento.</p>

          <h2 className="text-xl font-semibold text-foreground">Benefícios da consulta nutricional online</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Praticidade:</strong> sem deslocamento, sem filas de espera.</li>
            <li><strong>Flexibilidade:</strong> agende nos horários que funcionam para você.</li>
            <li><strong>Acompanhamento contínuo:</strong> retornos mais frequentes e acessíveis.</li>
            <li><strong>Acesso nacional:</strong> consulte especialistas de qualquer estado.</li>
            <li><strong>Plano alimentar digital:</strong> receba tudo organizado por email ou app.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Como funciona na SalbCare</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Acesse o <Link to="/consulta-online/nutricionista" className="text-primary hover:underline">diretório de nutricionistas</Link></li>
            <li>Escolha o profissional e horário disponível</li>
            <li>Confirme o agendamento — sem downloads ou cadastro</li>
            <li>Receba seu plano alimentar personalizado após a consulta</li>
          </ol>

          <h2 className="text-xl font-semibold text-foreground">Quando procurar um nutricionista?</h2>
          <p>Reeducação alimentar, perda ou ganho de peso, controle de diabetes, intolerâncias alimentares, nutrição esportiva, gestação e amamentação são alguns dos motivos mais comuns para buscar acompanhamento nutricional.</p>
        </div>
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild className="gradient-primary font-semibold gap-2">
            <Link to="/consulta-online/nutricionista">Encontrar nutricionistas <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/cadastro">Sou nutricionista — quero me cadastrar</Link>
          </Button>
        </div>

        <RelatedPosts currentSlug={SLUG} preferSlugs={["teleconsulta-medica", "agenda-medica-digital", "consulta-online-psicologo"]} />
      </div>
    </article>
  </>
);

export default BlogNutricionistaOnline;
