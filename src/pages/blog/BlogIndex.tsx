import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const POSTS = [
  {
    slug: "consulta-online-psicologo",
    category: "Saúde Mental",
    title: "Consulta Online com Psicólogo: Como Funciona, Benefícios e Como Agendar",
    excerpt: "A terapia online é regulamentada pelo CFP e oferece praticidade, sigilo e acesso a profissionais de qualquer lugar do Brasil.",
    date: "14 de abril de 2026",
  },
  {
    slug: "prontuario-digital-dentista",
    category: "Odontologia",
    title: "Prontuário Digital para Dentista: Organize Pacientes, HOF e Receituários",
    excerpt: "O prontuário eletrônico é uma obrigação ética e um diferencial competitivo para consultórios odontológicos modernos.",
    date: "14 de abril de 2026",
  },
  {
    slug: "teleconsulta-medica",
    category: "Telemedicina",
    title: "Teleconsulta Médica: Como Atender Pacientes Online de Forma Legal e Segura",
    excerpt: "A telemedicina é regulamentada no Brasil desde 2022. Saiba como montar seu consultório virtual.",
    date: "14 de abril de 2026",
  },
  {
    slug: "gestao-financeira-profissional-saude",
    category: "Finanças",
    title: "Gestão Financeira para Profissionais de Saúde: Guia Prático para Autônomos",
    excerpt: "Organizar finanças é tão importante quanto cuidar de pacientes. Carnê-Leão, preço mínimo e reserva de emergência.",
    date: "14 de abril de 2026",
  },
];

const BlogIndex = () => (
  <>
    <SEOHead
      title="Blog SalbCare | Conteúdo para Profissionais de Saúde"
      description="Artigos sobre teleconsulta, prontuário digital, gestão financeira e regulamentação para profissionais de saúde autônomos. Conteúdo educativo e prático."
      canonical="/blog"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Blog SalbCare",
        description: "Conteúdo educativo para profissionais de saúde autônomos.",
        url: "https://salbcare.com.br/blog",
        publisher: { "@type": "Organization", name: "SalbCare", url: "https://salbcare.com.br" },
      }}
    />

    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-10">
        <header className="space-y-3">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Voltar ao site</Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Blog SalbCare</h1>
          <p className="text-muted-foreground text-base">
            Artigos sobre teleconsulta, prontuário digital, gestão financeira e regulamentação para profissionais de saúde.
          </p>
        </header>

        <div className="grid gap-6">
          {POSTS.map((post, i) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={`/blog/${post.slug}`}
                className="group block rounded-xl border border-border/40 bg-card/60 p-6 hover:border-primary/30 transition-all space-y-2"
              >
                <p className="text-xs text-primary font-semibold uppercase tracking-wider">{post.category}</p>
                <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">{post.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between pt-2">
                  <time className="text-xs text-muted-foreground">{post.date}</time>
                  <span className="text-xs text-primary flex items-center gap-1">
                    Ler artigo <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default BlogIndex;
