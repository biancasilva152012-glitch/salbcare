import SEOHead from "@/components/SEOHead";
import blogImage from "@/assets/blog/consulta-psicologo.jpg";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlogBreadcrumb from "@/components/blog/BlogBreadcrumb";
import RelatedPosts from "@/components/blog/RelatedPosts";
import { buildBlogPostingSchema, buildBreadcrumbSchema } from "@/components/blog/blogSchema";

const SLUG = "consulta-online-psicologo";
const TITLE = "Consulta Online com Psicólogo: Como Funciona, Benefícios e Como Agendar";

const BlogConsultaPsicologo = () => (
  <>
    <SEOHead
      title="Consulta Online com Psicólogo: Como Funciona"
      description="Como funciona a consulta online com psicólogo. Sistema para psicólogo aprovado pelo CFP, terapia virtual com privacidade e agendamento simples pela SalbCare."
      canonical={`/blog/${SLUG}`}
      ogType="article"
      ogImage={`https://salbcare.com.br${blogImage}`}
      keywords={["consulta online psicólogo", "sistema para psicólogo", "terapia online", "teleconsulta", "CFP", "agenda online"]}
      publishedTime="2026-04-14"
      modifiedTime="2026-05-02"
      jsonLd={[
        buildBlogPostingSchema({
          slug: SLUG, headline: TITLE,
          description: "Guia completo sobre terapia online: regulamentação do CFP, benefícios, como funciona na prática e como agendar pelo SalbCare.",
          image: blogImage, datePublished: "2026-04-14", dateModified: "2026-05-02",
          category: "Saúde Mental", keywords: ["consulta online", "psicólogo", "CFP", "terapia online"],
        }),
        buildBreadcrumbSchema(TITLE, SLUG),
      ]}
    />
    <article className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <BlogBreadcrumb articleTitle="Consulta Online com Psicólogo" />

        <header className="space-y-3">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Saúde Mental</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
            Consulta Online com Psicólogo: Como Funciona, Benefícios e Como Agendar
          </h1>
          <p className="text-muted-foreground text-base">
            A terapia online é regulamentada pelo Conselho Federal de Psicologia (CFP) e oferece praticidade, sigilo e acesso a profissionais de qualquer lugar do Brasil.
          </p>
          <time className="text-xs text-muted-foreground" dateTime="2026-04-14">14 de abril de 2026</time>
        </header>

        <img src={blogImage} alt="Consulta online com psicólogo via videochamada" width={1200} height={672} className="rounded-xl w-full object-cover" loading="eager" />

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">O que é a consulta online com psicólogo?</h2>
          <p>
            A consulta online com psicólogo é um atendimento terapêutico realizado por videochamada, com a mesma validade clínica de uma sessão presencial. O psicólogo utiliza plataformas seguras para manter o sigilo da conversa, e o paciente pode participar do conforto de sua casa.
          </p>

          <h2 className="text-xl font-semibold text-foreground">A terapia online é regulamentada?</h2>
          <p>
            Sim. O Conselho Federal de Psicologia (CFP) autoriza o atendimento psicológico online por meio da <strong>Resolução CFP 11/2018</strong>. O profissional precisa estar registrado no CRP e cadastrado na plataforma e-Psi para atender virtualmente.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Benefícios da terapia online</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Acessibilidade:</strong> atendimento de qualquer cidade do Brasil, sem deslocamento.</li>
            <li><strong>Flexibilidade de horário:</strong> sessões nos horários mais convenientes para você.</li>
            <li><strong>Privacidade:</strong> sem sala de espera, sem cruzar com outras pessoas.</li>
            <li><strong>Continuidade:</strong> ideal para quem viaja ou mora no exterior.</li>
            <li><strong>Economia:</strong> sem custos de transporte e estacionamento.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Como agendar pelo SalbCare?</h2>
          <p>
            Na plataforma SalbCare, você encontra psicólogos habilitados prontos para atender. O processo é simples:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Acesse o <Link to="/consulta-online/psicologo" className="text-primary hover:underline">diretório de psicólogos</Link></li>
            <li>Escolha o profissional e horário disponível</li>
            <li>Confirme o agendamento — tudo online, sem downloads</li>
          </ol>

          <h2 className="text-xl font-semibold text-foreground">Em caso de crise</h2>
          <p>
            A consulta online não substitui atendimento emergencial. Em situações de risco, ligue para o <strong>CVV: 188</strong> (24 horas, gratuito).
          </p>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild className="gradient-primary font-semibold gap-2">
            <Link to="/consulta-online/psicologo">
              Encontrar psicólogos disponíveis <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/cadastro">Sou profissional — quero me cadastrar</Link>
          </Button>
        </div>

        <RelatedPosts currentSlug={SLUG} preferSlugs={["teleconsulta-medica", "agenda-medica-digital", "nutricionista-online"]} />
      </div>
    </article>
  </>
);

export default BlogConsultaPsicologo;
