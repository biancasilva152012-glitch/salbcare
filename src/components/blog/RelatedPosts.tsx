import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export interface RelatedPost {
  slug: string;
  title: string;
  category: string;
}

/**
 * Centralised registry of blog posts so any post can pull "related"
 * recommendations without re-importing data. Keep slugs in sync with
 * src/pages/blog/BlogIndex.tsx.
 */
export const ALL_POSTS: RelatedPost[] = [
  { slug: "preco-minimo-consulta", category: "Finanças", title: "Como Calcular o Preço Mínimo da Sua Consulta" },
  { slug: "consulta-online-psicologo", category: "Saúde Mental", title: "Consulta Online com Psicólogo: Como Funciona, Benefícios e Como Agendar" },
  { slug: "prontuario-digital-dentista", category: "Odontologia", title: "Prontuário Digital para Dentista: Organize Pacientes, HOF e Receituários" },
  { slug: "teleconsulta-medica", category: "Telemedicina", title: "Teleconsulta Médica: Como Atender Pacientes Online de Forma Legal e Segura" },
  { slug: "gestao-financeira-profissional-saude", category: "Finanças", title: "Gestão Financeira para Profissionais de Saúde: Guia Prático para Autônomos" },
  { slug: "nutricionista-online", category: "Nutrição", title: "Nutricionista Online: Como Funciona a Consulta por Vídeo e Como Agendar" },
  { slug: "agenda-medica-digital", category: "Gestão", title: "Agenda Médica Digital: Como Organizar seu Consultório e Reduzir Faltas" },
  { slug: "receituario-digital", category: "Documentos Clínicos", title: "Receituário Digital: Como Emitir Prescrição Eletrônica com Validade Legal" },
  { slug: "como-abrir-cnpj-medico", category: "Contabilidade", title: "Como Abrir CNPJ Médico: Guia Completo para Profissionais de Saúde em 2026" },
];

interface RelatedPostsProps {
  /** Slug of the current post — excluded from the related list. */
  currentSlug: string;
  /** How many related cards to show. Defaults to 3. */
  limit?: number;
  /** Optional explicit slugs to prioritise (in order). */
  preferSlugs?: string[];
}

/**
 * Renders 3-5 internal links to other posts (boosts internal link graph for SEO).
 * Prefers explicit slugs first, then fills with the next posts from the registry.
 */
const RelatedPosts = ({ currentSlug, limit = 3, preferSlugs = [] }: RelatedPostsProps) => {
  const others = ALL_POSTS.filter((p) => p.slug !== currentSlug);
  const preferred = preferSlugs
    .map((s) => others.find((p) => p.slug === s))
    .filter((p): p is RelatedPost => Boolean(p));
  const rest = others.filter((p) => !preferred.some((q) => q.slug === p.slug));
  const items = [...preferred, ...rest].slice(0, limit);

  if (!items.length) return null;

  return (
    <aside aria-label="Posts relacionados" className="not-prose border-t border-border pt-8 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Continue lendo</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((p) => (
          <li key={p.slug}>
            <Link
              to={`/blog/${p.slug}`}
              className="group block rounded-lg border border-border/40 bg-card/60 p-4 hover:border-primary/30 transition-colors"
            >
              <p className="text-[11px] text-primary font-semibold uppercase tracking-wider">{p.category}</p>
              <p className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {p.title}
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
                Ler artigo <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default RelatedPosts;
