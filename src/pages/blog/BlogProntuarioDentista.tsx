import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlogBreadcrumb from "@/components/blog/BlogBreadcrumb";

const BlogProntuarioDentista = () => (
  <>
    <SEOHead
      title="Prontuário Digital para Dentista: Guia Completo"
      description="Descubra como o prontuário digital transforma a rotina do consultório odontológico. Organização, segurança e praticidade para cirurgiões-dentistas."
      canonical="/blog/prontuario-digital-dentista"
      ogType="article"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Prontuário Digital para Dentista: Guia Completo",
        description: "Como o prontuário eletrônico ajuda o cirurgião-dentista a organizar pacientes, HOF, receituários e documentos clínicos com segurança.",
        author: { "@type": "Organization", name: "SalbCare" },
        publisher: { "@type": "Organization", name: "SalbCare", url: "https://salbcare.com.br" },
        datePublished: "2026-04-14",
        mainEntityOfPage: "https://salbcare.com.br/blog/prontuario-digital-dentista",
      }}
    />
    <article className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <BlogBreadcrumb articleTitle="Prontuário Digital para Dentista" />

        <header className="space-y-3">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Odontologia</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
            Prontuário Digital para Dentista: Organize Pacientes, HOF e Receituários
          </h1>
          <p className="text-muted-foreground text-base">
            O prontuário eletrônico é uma obrigação ética e um diferencial competitivo para consultórios odontológicos modernos.
          </p>
          <time className="text-xs text-muted-foreground" dateTime="2026-04-14">14 de abril de 2026</time>
        </header>

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
            <li><strong>Receituário integrado:</strong> emissão de receitas e atestados diretamente do prontuário.</li>
            <li><strong>Economia de espaço:</strong> sem armários de fichas físicas.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Como usar na SalbCare</h2>
          <p>
            A SalbCare oferece prontuário digital completo para dentistas, com campos para anamnese, HOF (História de Odontograma Funcional), diagnóstico, prescrições e acompanhamento. Tudo centralizado em uma plataforma segura e acessível pelo navegador.
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Cadastre-se gratuitamente e complete seu perfil</li>
            <li>Adicione pacientes e preencha o prontuário</li>
            <li>Emita receitas, atestados e acompanhe a evolução</li>
          </ol>
        </div>

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
      </div>
    </article>
  </>
);

export default BlogProntuarioDentista;
