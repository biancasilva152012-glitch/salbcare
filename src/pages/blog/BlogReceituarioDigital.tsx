import SEOHead from "@/components/SEOHead";
import blogImage from "@/assets/blog/receituario-digital.jpg";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlogBreadcrumb from "@/components/blog/BlogBreadcrumb";
import RelatedPosts from "@/components/blog/RelatedPosts";
import { buildBlogPostingSchema, buildBreadcrumbSchema } from "@/components/blog/blogSchema";

const SLUG = "receituario-digital";
const TITLE = "Receituário Digital: Como Emitir Prescrição Eletrônica com Validade Legal";

const BlogReceituarioDigital = () => (
  <>
    <SEOHead
      title="Prescrição Digital: RDC ANVISA e ICP-Brasil"
      description="Prescrição digital com validade legal: assinatura ICP-Brasil, RDC 471 da ANVISA, tipos de receita e como emitir pelo prontuário eletrônico SalbCare."
      canonical={`/blog/${SLUG}`}
      ogType="article"
      ogImage={`https://salbcare.com.br${blogImage}`}
      keywords={["prescrição digital", "receituário digital", "ICP-Brasil", "RDC 471 ANVISA", "prontuário eletrônico", "teleconsulta"]}
      publishedTime="2026-04-14"
      modifiedTime="2026-05-02"
      jsonLd={[
        buildBlogPostingSchema({
          slug: SLUG, headline: TITLE,
          description: "Guia sobre prescrição digital: legislação, assinatura ICP-Brasil, tipos de receita e como emitir pela SalbCare.",
          image: blogImage, datePublished: "2026-04-14", dateModified: "2026-05-02",
          category: "Documentos Clínicos", keywords: ["prescrição digital", "ICP-Brasil", "ANVISA"],
        }),
        buildBreadcrumbSchema(TITLE, SLUG),
      ]}
    />
    <article className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <BlogBreadcrumb articleTitle="Receituário Digital" />
        <header className="space-y-3">
          <img src={blogImage} alt="Receituário digital sendo preenchido em tablet" width={1200} height={672} className="rounded-xl w-full object-cover mb-4" loading="eager" />
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Documentos Clínicos</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
            Receituário Digital: Como Emitir Prescrição Eletrônica com Validade Legal
          </h1>
          <p className="text-muted-foreground text-base">
            A prescrição eletrônica já é realidade no Brasil. Entenda como funciona, o que diz a lei e como emitir receitas digitais no seu consultório.
          </p>
          <time className="text-xs text-muted-foreground" dateTime="2026-04-14">14 de abril de 2026</time>
        </header>
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">O que é o receituário digital?</h2>
          <p>O receituário digital é a versão eletrônica da prescrição médica ou odontológica. Ele substitui o papel com vantagens de rastreabilidade, legibilidade e segurança. O paciente recebe a receita por email ou link, podendo apresentá-la na farmácia pelo celular.</p>

          <h2 className="text-xl font-semibold text-foreground">Validade legal da receita digital</h2>
          <p>Para ter validade legal, a receita digital precisa de <strong>assinatura eletrônica qualificada</strong> (ICP-Brasil) ou assinatura digital avançada conforme a <strong>Lei 14.063/2020</strong>. Receitas de medicamentos controlados (tarja preta e vermelha) exigem obrigatoriamente certificado ICP-Brasil.</p>
          <p>Receitas simples (medicamentos de venda livre) podem usar assinatura eletrônica avançada, sem necessidade de certificado ICP-Brasil.</p>

          <h2 className="text-xl font-semibold text-foreground">Tipos de receita digital</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Receita simples:</strong> medicamentos sem tarja. Aceita assinatura avançada.</li>
            <li><strong>Receita de controle especial:</strong> tarja vermelha (C1). Exige ICP-Brasil.</li>
            <li><strong>Receita azul (B):</strong> psicotrópicos. Exige ICP-Brasil.</li>
            <li><strong>Receita amarela (A):</strong> entorpecentes. Ainda exige receita física em muitos estados.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Como emitir na SalbCare</h2>
          <p>A SalbCare permite emitir receituários digitais integrados ao prontuário do paciente. O fluxo é simples:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Durante a consulta, abra o prontuário do paciente</li>
            <li>Clique em "Nova Receita" e preencha os medicamentos</li>
            <li>O sistema gera um PDF com código de verificação único</li>
            <li>Envie ao paciente por email ou compartilhe o link seguro</li>
          </ol>

          <h2 className="text-xl font-semibold text-foreground">Vantagens do receituário digital</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Legibilidade:</strong> fim das letras ilegíveis que causam erros na farmácia.</li>
            <li><strong>Histórico:</strong> todas as prescrições ficam salvas no prontuário.</li>
            <li><strong>Praticidade:</strong> paciente não precisa guardar papel — acessa pelo celular.</li>
            <li><strong>Verificação:</strong> farmácias podem conferir a autenticidade pelo código hash.</li>
          </ul>
        </div>
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild className="gradient-primary font-semibold gap-2">
            <Link to="/cadastro">Começar a emitir receitas digitais <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/planos">Ver planos</Link>
          </Button>
        </div>

        <RelatedPosts currentSlug={SLUG} preferSlugs={["teleconsulta-medica", "prontuario-digital-dentista", "agenda-medica-digital"]} />
      </div>
    </article>
  </>
);

export default BlogReceituarioDigital;
