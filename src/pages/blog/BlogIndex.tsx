import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import imgPsicologo from "@/assets/blog/consulta-psicologo.jpg";
import imgDentista from "@/assets/blog/prontuario-dentista.jpg";
import imgTeleconsulta from "@/assets/blog/teleconsulta-medica.jpg";
import imgFinanceira from "@/assets/blog/gestao-financeira.jpg";
import imgNutricionista from "@/assets/blog/nutricionista-online.jpg";
import imgAgenda from "@/assets/blog/agenda-medica.jpg";
import imgReceituario from "@/assets/blog/receituario-digital.jpg";
import imgCnpj from "@/assets/blog/cnpj-medico.jpg";

const POSTS = [
  {
    slug: "consulta-online-psicologo",
    category: "Saúde Mental",
    title: "Consulta Online com Psicólogo: Como Funciona, Benefícios e Como Agendar",
    excerpt: "A terapia online é regulamentada pelo CFP e oferece praticidade, sigilo e acesso a profissionais de qualquer lugar do Brasil.",
    date: "14 de abril de 2026",
    image: imgPsicologo,
    alt: "Consulta online com psicólogo via videochamada",
  },
  {
    slug: "prontuario-digital-dentista",
    category: "Odontologia",
    title: "Prontuário Digital para Dentista: Organize Pacientes, HOF e Receituários",
    excerpt: "O prontuário eletrônico é uma obrigação ética e um diferencial competitivo para consultórios odontológicos modernos.",
    date: "14 de abril de 2026",
    image: imgDentista,
    alt: "Prontuário digital odontológico em tablet",
  },
  {
    slug: "teleconsulta-medica",
    category: "Telemedicina",
    title: "Teleconsulta Médica: Como Atender Pacientes Online de Forma Legal e Segura",
    excerpt: "A telemedicina é regulamentada no Brasil desde 2022. Saiba como montar seu consultório virtual.",
    date: "14 de abril de 2026",
    image: imgTeleconsulta,
    alt: "Médico realizando teleconsulta no computador",
  },
  {
    slug: "gestao-financeira-profissional-saude",
    category: "Finanças",
    title: "Gestão Financeira para Profissionais de Saúde: Guia Prático para Autônomos",
    excerpt: "Organizar finanças é tão importante quanto cuidar de pacientes. Carnê-Leão, preço mínimo e reserva de emergência.",
    date: "14 de abril de 2026",
    image: imgFinanceira,
    alt: "Gestão financeira para profissionais de saúde",
  },
  {
    slug: "nutricionista-online",
    category: "Nutrição",
    title: "Nutricionista Online: Como Funciona a Consulta por Vídeo e Como Agendar",
    excerpt: "A consulta nutricional online é autorizada pelo CFN e permite acompanhamento personalizado de qualquer lugar.",
    date: "14 de abril de 2026",
    image: imgNutricionista,
    alt: "Consulta online com nutricionista",
  },
  {
    slug: "agenda-medica-digital",
    category: "Gestão",
    title: "Agenda Médica Digital: Como Organizar seu Consultório e Reduzir Faltas",
    excerpt: "Uma agenda digital inteligente é a base de um consultório organizado. Saiba como implementar.",
    date: "14 de abril de 2026",
    image: imgAgenda,
    alt: "Agenda médica digital em dispositivo móvel",
  },
  {
    slug: "receituario-digital",
    category: "Documentos Clínicos",
    title: "Receituário Digital: Como Emitir Prescrição Eletrônica com Validade Legal",
    excerpt: "A prescrição eletrônica já é realidade no Brasil. Entenda como funciona e o que diz a lei.",
    date: "14 de abril de 2026",
    image: imgReceituario,
    alt: "Receituário digital com prescrição eletrônica",
  },
  {
    slug: "como-abrir-cnpj-medico",
    category: "Contabilidade",
    title: "Como Abrir CNPJ Médico: Guia Completo para Profissionais de Saúde em 2026",
    excerpt: "Atender como pessoa jurídica pode reduzir seus impostos em até 70%. Entenda quando vale a pena.",
    date: "14 de abril de 2026",
    image: imgCnpj,
    alt: "Abertura de CNPJ para médicos e profissionais de saúde",
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
                className="group flex flex-col sm:flex-row gap-4 rounded-xl border border-border/40 bg-card/60 p-4 hover:border-primary/30 transition-all"
              >
                {/* Thumbnail */}
                <img
                  src={post.image}
                  alt={post.alt}
                  width={240}
                  height={135}
                  loading="lazy"
                  className="w-full sm:w-40 h-32 sm:h-24 rounded-lg object-cover shrink-0"
                />

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-xs text-primary font-semibold uppercase tracking-wider">{post.category}</p>
                  <h2 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-2">{post.title}</h2>
                  <p className="text-xs text-muted-foreground line-clamp-2 hidden sm:block">{post.excerpt}</p>
                  <div className="flex items-center justify-between pt-1">
                    <time className="text-[11px] text-muted-foreground">{post.date}</time>
                    <span className="text-xs text-primary flex items-center gap-1">
                      Ler <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
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
