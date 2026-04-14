import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlogBreadcrumb from "@/components/blog/BlogBreadcrumb";

const BlogGestaoFinanceira = () => (
  <>
    <SEOHead
      title="Gestão Financeira para Profissionais de Saúde"
      description="Aprenda a organizar as finanças do seu consultório: Carnê-Leão, reserva de emergência, preço mínimo por consulta e mentoria com IA. Guia prático para autônomos."
      canonical="/blog/gestao-financeira-profissional-saude"
      ogType="article"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Gestão Financeira para Profissionais de Saúde Autônomos",
        description: "Guia prático de finanças para médicos, dentistas, psicólogos e outros profissionais de saúde autônomos.",
        author: { "@type": "Organization", name: "SalbCare" },
        publisher: { "@type": "Organization", name: "SalbCare", url: "https://salbcare.com.br" },
        datePublished: "2026-04-14",
        mainEntityOfPage: "https://salbcare.com.br/blog/gestao-financeira-profissional-saude",
      }}
    />
    <article className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <BlogBreadcrumb articleTitle="Gestão Financeira" />

        <header className="space-y-3">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Finanças</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
            Gestão Financeira para Profissionais de Saúde: Guia Prático para Autônomos
          </h1>
          <p className="text-muted-foreground text-base">
            Organizar finanças é tão importante quanto cuidar de pacientes. Descubra como controlar seus ganhos, pagar menos impostos e construir segurança financeira.
          </p>
          <time className="text-xs text-muted-foreground" dateTime="2026-04-14">14 de abril de 2026</time>
        </header>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">Por que finanças importam na saúde?</h2>
          <p>
            Profissionais de saúde autônomos frequentemente não têm formação em gestão financeira. Isso leva a problemas como atraso no Carnê-Leão, precificação incorreta e falta de reserva de emergência. A boa notícia é que organizar tudo é mais simples do que parece.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Carnê-Leão: o que todo autônomo precisa saber</h2>
          <p>
            O Carnê-Leão é a forma de recolhimento mensal obrigatória do Imposto de Renda para quem recebe de pessoas físicas. Se você atende pacientes particulares, precisa preencher o Carnê-Leão todo mês e gerar o DARF para pagamento.
          </p>
          <p>
            Na SalbCare, o sistema calcula automaticamente o imposto estimado com base nos seus recebimentos registrados, simplificando todo o processo.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Como calcular o preço mínimo da consulta</h2>
          <p>
            O preço mínimo deve cobrir seus custos fixos (aluguel, internet, softwares) mais o custo variável por atendimento. A fórmula básica é:
          </p>
          <p className="bg-muted/50 p-4 rounded-lg text-foreground font-mono text-sm">
            Preço mínimo = (Custos fixos + Custos variáveis) ÷ Consultas por mês
          </p>
          <p>
            A SalbCare tem uma calculadora integrada que faz esse cálculo automaticamente com base nos valores que você informa.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Reserva de emergência</h2>
          <p>
            Profissionais autônomos devem manter entre <strong>6 a 12 meses</strong> de despesas fixas como reserva. Isso protege contra meses de baixa demanda, problemas de saúde ou imprevistos.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Mentoria financeira com IA</h2>
          <p>
            A SalbCare oferece uma mentora financeira com inteligência artificial que conhece seus dados reais. Ela responde perguntas como "quanto devo guardar de imposto este mês?" com base no que você realmente ganhou — não em suposições genéricas.
          </p>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild className="gradient-primary font-semibold gap-2">
            <Link to="/cadastro">
              Testar grátis por 7 dias <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/planos">Ver planos</Link>
          </Button>
        </div>
      </div>
    </article>
  </>
);

export default BlogGestaoFinanceira;
