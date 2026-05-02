import SEOHead from "@/components/SEOHead";
import blogImage from "@/assets/blog/prontuario-dentista.jpg";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlogBreadcrumb from "@/components/blog/BlogBreadcrumb";
import RelatedPosts from "@/components/blog/RelatedPosts";
import FAQSection from "@/components/blog/FAQSection";
import { buildBlogPostingSchema, buildBreadcrumbSchema } from "@/components/blog/blogSchema";

const SLUG = "prontuario-digital-dentista";
const TITLE = "Prontuário Digital para Dentista: Organize Pacientes, HOF e Receituários";
const PUBLISHED = "2026-04-14";
const MODIFIED = "2026-05-02";

const BlogProntuarioDentista = () => (
  <>
    <SEOHead
      title="Prontuário Eletrônico para Dentista: Guia 2026"
      description="Sistema para dentista com prontuário eletrônico, HOF, receituário e LGPD. Organize seu consultório odontológico e atenda dentro da Resolução CFO 118/2012."
      canonical={`/blog/${SLUG}`}
      ogType="article"
      ogImage={`https://salbcare.com.br${blogImage}`}
      keywords={[
        "prontuário eletrônico",
        "sistema para dentista",
        "software para clínica odontológica",
        "prontuário eletrônico LGPD",
        "sistema para consultório",
        "agenda online",
      ]}
      publishedTime={PUBLISHED}
      modifiedTime={MODIFIED}
      jsonLd={[
        buildBlogPostingSchema({
          slug: SLUG,
          headline: TITLE,
          description:
            "Como o prontuário eletrônico ajuda o cirurgião-dentista a organizar pacientes, HOF, receituários e documentos clínicos com segurança jurídica.",
          image: blogImage,
          datePublished: PUBLISHED,
          dateModified: MODIFIED,
          category: "Odontologia",
          keywords: ["prontuário eletrônico", "sistema para dentista", "CFO", "LGPD"],
        }),
        buildBreadcrumbSchema(TITLE, SLUG),
      ]}
    />
    <article className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <BlogBreadcrumb articleTitle="Prontuário Digital para Dentista" />

        <header className="space-y-3">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Odontologia</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">{TITLE}</h1>
          <p className="text-muted-foreground text-base">
            O prontuário eletrônico é uma obrigação ética e um diferencial competitivo para consultórios odontológicos modernos. Saiba como escolher o melhor sistema para dentista.
          </p>
          <time className="text-xs text-muted-foreground" dateTime={PUBLISHED}>14 de abril de 2026</time>
        </header>

        <img src={blogImage} alt="Prontuário eletrônico odontológico com odontograma em tablet" width={1200} height={672} className="rounded-xl w-full object-cover" loading="eager" />

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">O que é o prontuário digital odontológico?</h2>
          <p>
            O prontuário digital é o registro eletrônico de toda a jornada clínica do paciente: anamnese, plano de tratamento, exames, radiografias, procedimentos realizados e evolução. Ele substitui as fichas em papel com mais segurança, rastreabilidade e praticidade.
          </p>

          <h2 className="text-xl font-semibold text-foreground">O que diz o CFO sobre documentação digital?</h2>
          <p>
            O Conselho Federal de Odontologia (CFO) exige que todo atendimento seja documentado. A <strong>Resolução CFO 118/2012</strong> reforça a obrigatoriedade do prontuário odontológico. O formato digital é aceito desde que garanta autenticidade, integridade e confidencialidade dos dados.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Vantagens do prontuário digital</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Organização:</strong> histórico completo acessível em segundos.</li>
            <li><strong>Segurança jurídica:</strong> registro com data, hora e validação digital.</li>
            <li><strong>Mobilidade:</strong> acesse de qualquer dispositivo, a qualquer momento.</li>
            <li><strong>Receituário integrado:</strong> emita <Link to="/blog/receituario-digital" className="text-primary hover:underline">prescrição digital</Link> diretamente do prontuário.</li>
            <li><strong>Agenda integrada:</strong> consulte horários pela <Link to="/blog/agenda-medica-digital" className="text-primary hover:underline">agenda online</Link>.</li>
            <li><strong>Economia de espaço:</strong> sem armários de fichas físicas.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Como usar na SalbCare</h2>
          <p>
            A SalbCare oferece prontuário digital completo para dentistas, com campos para anamnese, HOF (História de Odontograma Funcional), diagnóstico, prescrições e acompanhamento. Tudo centralizado em um sistema para consultório seguro e acessível pelo navegador.
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Cadastre-se gratuitamente e complete seu perfil</li>
            <li>Adicione pacientes e preencha o prontuário</li>
            <li>Emita receitas, atestados e acompanhe a evolução</li>
          </ol>
        </div>

        <FAQSection
          items={[
            {
              question: "Prontuário eletrônico é obrigatório?",
              answer: "Sim. O Conselho Federal de Odontologia (Resolução CFO 118/2012) exige documentação completa de cada atendimento. O formato eletrônico é aceito desde que garanta autenticidade, integridade e confidencialidade — requisitos atendidos pela SalbCare.",
            },
            {
              question: "Qual o melhor sistema para consultório odontológico?",
              answer: "Um bom software para clínica deve ter prontuário eletrônico, agenda online, receituário digital, controle financeiro e estar em conformidade com a LGPD. A SalbCare reúne todos esses módulos em uma única plataforma.",
            },
            {
              question: "Como o prontuário eletrônico atende a LGPD?",
              answer: "Dados clínicos são considerados sensíveis pela LGPD. A plataforma deve oferecer criptografia em trânsito e em repouso, controle de acesso por usuário e logs de auditoria — tudo já incluso na SalbCare.",
            },
          ]}
        />

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild className="gradient-primary font-semibold gap-2">
            <Link to="/cadastro">
              Criar minha conta grátis <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/consulta-online/dentista">Ver dentistas disponíveis</Link>
          </Button>
        </div>

        <RelatedPosts currentSlug={SLUG} preferSlugs={["receituario-digital", "agenda-medica-digital", "teleconsulta-medica"]} />
      </div>
    </article>
  </>
);

export default BlogProntuarioDentista;
