import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlogBreadcrumb from "@/components/blog/BlogBreadcrumb";

const BlogCnpjMedico = () => (
  <>
    <SEOHead
      title="Como Abrir CNPJ Médico: Guia Completo 2026"
      description="Passo a passo para abrir CNPJ como médico ou profissional de saúde. Tipos de empresa, regime tributário, documentos necessários e quanto custa."
      canonical="/blog/como-abrir-cnpj-medico"
      ogType="article"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Como Abrir CNPJ Médico: Guia Completo para Profissionais de Saúde",
        description: "Passo a passo para abrir CNPJ: tipos de empresa, regimes tributários, custos e vantagens para médicos e profissionais de saúde.",
        author: { "@type": "Organization", name: "SalbCare" },
        publisher: { "@type": "Organization", name: "SalbCare", url: "https://salbcare.com.br" },
        datePublished: "2026-04-14",
        mainEntityOfPage: "https://salbcare.com.br/blog/como-abrir-cnpj-medico",
      }}
    />
    <article className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <BlogBreadcrumb articleTitle="Como Abrir CNPJ Médico" />
        <header className="space-y-3">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Contabilidade</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
            Como Abrir CNPJ Médico: Guia Completo para Profissionais de Saúde em 2026
          </h1>
          <p className="text-muted-foreground text-base">
            Atender como pessoa jurídica pode reduzir seus impostos em até 70%. Entenda quando vale a pena e como fazer.
          </p>
          <time className="text-xs text-muted-foreground" dateTime="2026-04-14">14 de abril de 2026</time>
        </header>
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">PJ ou Pessoa Física: quando vale a pena?</h2>
          <p>Como regra geral, profissionais de saúde que faturam acima de <strong>R$ 5.000 por mês</strong> como autônomos costumam pagar menos impostos atuando como pessoa jurídica. A diferença pode chegar a 70% dependendo do regime tributário escolhido.</p>
          <p>Para faturamentos menores, o Carnê-Leão como pessoa física pode ser mais vantajoso pela simplicidade. A SalbCare calcula automaticamente sua situação ideal.</p>

          <h2 className="text-xl font-semibold text-foreground">Tipos de empresa para profissionais de saúde</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>SLU (Sociedade Limitada Unipessoal):</strong> sem sócio, sem capital mínimo. A opção mais comum para médicos e dentistas que atuam sozinhos.</li>
            <li><strong>Sociedade Simples Limitada:</strong> para quem tem sócio (ex: clínica com dois médicos).</li>
            <li><strong>EIRELI:</strong> em desuso desde a criação da SLU, mas ainda válida.</li>
          </ul>
          <p><strong>Atenção:</strong> profissionais de saúde <strong>não podem ser MEI</strong> (Microempreendedor Individual). As atividades regulamentadas por conselhos profissionais são vedadas no MEI.</p>

          <h2 className="text-xl font-semibold text-foreground">Regimes tributários</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Simples Nacional:</strong> alíquota a partir de 6% (Anexo III) ou 15,5% (Anexo V). Ideal para faturamento até R$ 4,8 milhões/ano.</li>
            <li><strong>Lucro Presumido:</strong> alíquota efetiva entre 13% e 16%. Pode ser vantajoso para faturamentos maiores.</li>
            <li><strong>Lucro Real:</strong> raramente usado por consultórios individuais.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Documentos necessários</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>RG e CPF</li>
            <li>Comprovante de residência</li>
            <li>Registro no conselho profissional (CRM, CRO, CRP, etc.)</li>
            <li>Contrato social ou requerimento de empresário</li>
            <li>Alvará de funcionamento (se tiver endereço comercial)</li>
          </ol>

          <h2 className="text-xl font-semibold text-foreground">Quanto custa?</h2>
          <p>Os custos variam por estado, mas em média:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Honorários do contador:</strong> R$ 500 a R$ 1.500 para abertura</li>
            <li><strong>Taxas (Junta Comercial + prefeitura):</strong> R$ 200 a R$ 500</li>
            <li><strong>Mensalidade contábil:</strong> R$ 200 a R$ 600/mês</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">A SalbCare pode ajudar</h2>
          <p>Dentro da plataforma, você pode solicitar abertura de CNPJ diretamente pelo módulo de contabilidade. A SalbCare conecta você a contadores especializados em saúde e acompanha todo o processo.</p>
        </div>
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild className="gradient-primary font-semibold gap-2">
            <Link to="/cadastro">Criar conta e solicitar CNPJ <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/diagnostico">Fazer diagnóstico tributário grátis</Link>
          </Button>
        </div>
      </div>
    </article>
  </>
);

export default BlogCnpjMedico;
