import { useState, useMemo } from "react";
import SEOHead from "@/components/SEOHead";
import blogImage from "@/assets/blog/preco-minimo-consulta.jpg";
import { Link } from "react-router-dom";
import { ArrowRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlogBreadcrumb from "@/components/blog/BlogBreadcrumb";
import { maskCurrency, parseBRL } from "@/utils/currencyMask";

/* ---------- Inline calculator ---------- */
const CalcField = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-muted-foreground/50">R$</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(maskCurrency(e.target.value))}
        className="h-10 w-full rounded-lg border border-border/50 bg-accent/30 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
      />
    </div>
  </div>
);

const PrecoMinimoCalculator = () => {
  const [custoFixo, setCustoFixo] = useState("");
  const [custoVariavel, setCustoVariavel] = useState("");
  const [consultas, setConsultas] = useState("");

  const result = useMemo(() => {
    const fixo = parseBRL(custoFixo);
    const variavel = parseBRL(custoVariavel);
    const qtd = parseInt(consultas.replace(/\D/g, ""), 10) || 0;
    if (qtd === 0) return null;
    const minimo = (fixo + variavel) / qtd;
    return minimo;
  }, [custoFixo, custoVariavel, consultas]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="rounded-xl border border-primary/20 bg-card/80 p-5 space-y-4 my-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Calculadora de Preço Mínimo</h3>
      </div>

      <CalcField label="Custos fixos mensais (aluguel, software, internet…)" value={custoFixo} onChange={setCustoFixo} placeholder="2.500" />
      <CalcField label="Custos variáveis mensais (materiais, deslocamento…)" value={custoVariavel} onChange={setCustoVariavel} placeholder="500" />

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Consultas por mês</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="40"
          value={consultas}
          onChange={(e) => setConsultas(e.target.value.replace(/\D/g, ""))}
          className="h-10 w-full rounded-lg border border-border/50 bg-accent/30 px-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {result !== null && (
        <div className="rounded-lg bg-primary/10 p-4 text-center space-y-1">
          <p className="text-xs text-muted-foreground">Seu preço mínimo por consulta é</p>
          <p className="text-2xl font-bold text-primary">{fmt(result)}</p>
          <p className="text-[10px] text-muted-foreground">Abaixo disso, você está tendo prejuízo.</p>
        </div>
      )}
    </div>
  );
};

/* ---------- Blog article ---------- */
const BlogPrecoMinimoConsulta = () => (
  <>
    <SEOHead
      title="Como Calcular o Preço Mínimo da Sua Consulta"
      description="Aprenda a calcular o preço mínimo por consulta com nossa calculadora gratuita. Custos fixos, variáveis e margem de lucro explicados para profissionais de saúde."
      canonical="/blog/preco-minimo-consulta"
      ogType="article"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Como Calcular o Preço Mínimo da Sua Consulta",
        description: "Guia prático com calculadora interativa para profissionais de saúde definirem o preço mínimo sustentável por consulta.",
        author: { "@type": "Organization", name: "SalbCare" },
        publisher: { "@type": "Organization", name: "SalbCare", url: "https://salbcare.com.br" },
        datePublished: "2026-04-14",
        mainEntityOfPage: "https://salbcare.com.br/blog/preco-minimo-consulta",
      }}
    />
    <article className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <BlogBreadcrumb articleTitle="Preço Mínimo da Consulta" />

        <header className="space-y-3">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Finanças</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
            Como Calcular o Preço Mínimo da Sua Consulta
          </h1>
          <p className="text-muted-foreground text-base">
            Cobrar menos do que seus custos é o caminho mais rápido para fechar o consultório. Use nossa calculadora gratuita e descubra seu preço mínimo sustentável.
          </p>
          <time className="text-xs text-muted-foreground" dateTime="2026-04-14">14 de abril de 2026</time>
        </header>

        <img src={blogImage} alt="Profissional de saúde calculando preço mínimo da consulta" width={1200} height={672} className="rounded-xl w-full object-cover" loading="eager" />

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">O erro mais comum: precificar "por feeling"</h2>
          <p>
            A maioria dos profissionais de saúde autônomos define o valor da consulta com base no que colegas cobram ou no que "parece justo". O problema é que cada consultório tem uma estrutura de custos diferente — e o preço que funciona para um colega pode significar prejuízo para você.
          </p>

          <h2 className="text-xl font-semibold text-foreground">A fórmula do preço mínimo</h2>
          <p>
            O preço mínimo por consulta é o valor abaixo do qual você está pagando para trabalhar. A fórmula é simples:
          </p>
          <p className="bg-muted/50 p-4 rounded-lg text-foreground font-mono text-sm">
            Preço mínimo = (Custos fixos + Custos variáveis) ÷ Consultas por mês
          </p>

          <h2 className="text-xl font-semibold text-foreground">O que são custos fixos?</h2>
          <p>
            São as despesas que você paga todos os meses, independentemente do número de atendimentos:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Aluguel do consultório ou coworking</li>
            <li>Internet, telefone e energia</li>
            <li>Software de gestão e agenda</li>
            <li>Contabilidade e impostos fixos</li>
            <li>Seguro profissional</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">O que são custos variáveis?</h2>
          <p>
            São despesas que aumentam conforme você atende mais pacientes:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Materiais descartáveis (luvas, EPIs)</li>
            <li>Taxas de plataforma de pagamento</li>
            <li>Deslocamento (se atende em domicílio)</li>
            <li>Material específico por procedimento</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Calcule agora o seu preço mínimo</h2>
          <p>
            Use a calculadora abaixo para descobrir o valor mínimo que cada consulta precisa ter para cobrir seus custos:
          </p>
        </div>

        {/* Embedded calculator */}
        <PrecoMinimoCalculator />

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">Preço mínimo ≠ preço ideal</h2>
          <p>
            O preço mínimo é o piso — o valor que cobre seus custos. O preço ideal inclui sua margem de lucro, sua reserva de emergência e o valor da sua expertise. Uma boa prática é adicionar pelo menos 30% sobre o preço mínimo como margem.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Reduza seus custos fixos com a SalbCare</h2>
          <p>
            Ao unificar agenda, teleconsulta, prontuário, financeiro e contabilidade em uma única plataforma por <strong>R$ 89/mês</strong>, você elimina 3-4 assinaturas separadas e reduz seus custos fixos — o que automaticamente reduz seu preço mínimo.
          </p>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild className="gradient-primary font-semibold gap-2">
            <Link to="/cadastro">
              Teste grátis <ArrowRight className="h-4 w-4" />
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

export default BlogPrecoMinimoConsulta;
