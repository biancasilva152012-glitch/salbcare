
# Blog dual: SalbCare Pro + The SalbCare Journal

## Contexto

O blog atual (criado na rodada anterior) é uma publicação única em `public.blog_*` com 3 categorias seed. Esta refatoração adiciona o conceito de **publicação** (Pro vs Journal) e divide a experiência em duas vozes distintas, mantendo a infraestrutura existente (autores, traduções, tags, newsletter, edge function de sitemap, admin CMS, storage `blog-images`).

Não vou criar um schema `blog` separado — vou estender as tabelas `public.blog_*` que já existem para preservar tipos do Supabase, RLS já aprovada e dados seed.

## O que vou construir

### 1. Schema (migration)
- Nova tabela `public.blog_publications` (slug pro/journal, nomes EN/PT/ES, accent_color, default_language) + GRANT + RLS pública de leitura.
- `blog_categories`: adicionar `publication_id` (nullable inicialmente, depois NOT NULL após backfill) + unique `(publication_id, slug)`.
- `blog_articles`: adicionar `publication_id` + unique `(publication_id, slug)`.
- `blog_article_translations`: adicionar `focus_keyword`.
- `blog_authors`: adicionar `twitter_url` se faltar.
- `newsletter_subscribers`: adicionar `preferred_publication` ('pro'|'journal'|'both').
- Seed das 2 publicações, 4 categorias Pro (gestão-financeira, tecnologia-saude, regulatorio-legal, atracao-pacientes) e 4 categorias Journal (health-sanctuary-tourism, brazil-healthcare-guide, treatments-recovery, patient-stories).
- Backfill: categorias seed atuais migram para Journal (já são em inglês e cobrem os tópicos).
- Atualizar `get_public_professionals`-style? Não necessário — blog não toca PII.

### 2. Rotas (`src/App.tsx`)
- `/blog` — novo Hub apresentando as duas publicações (substitui `BlogHome` atual nessa URL).
- `/blog/pro` e `/blog/pro/:slug`, mais variantes `/pt/blog/pro/...`, `/es/blog/pro/...`
- `/blog/journal` e `/blog/journal/:slug`, mais `/pt/blog/journal/...`, `/es/blog/journal/...`
- `/blog/author/:slug` (página de autor compartilhada).
- Categoria e tag pages: implementar `/blog/:pub/category/:slug` e `/blog/:pub/tag/:slug` reaproveitando a listagem.
- Manter rotas estáticas legadas (`BlogAgendaMedica`, etc.) intactas.

### 3. Componentes & páginas
- `src/pages/blog/BlogHub.tsx` — novo hub (duas cards, gold + teal).
- `src/pages/blog/PublicationHome.tsx` — recebe `publication="pro"|"journal"`, renderiza header, navegação de categorias, featured, grid, newsletter inline com `preferred_publication` correto.
- `BlogArticle.tsx` — atualizar para receber publication via rota; aplicar estilos divergentes (Pro: sans Inter + accent teal; Journal: serif Fraunces + drop cap + pull quotes + accent gold).
- `src/pages/blog/AuthorPage.tsx` — perfil + artigos do autor.
- `src/components/blog/PublicationCard.tsx` (hub).
- `src/components/blog/NewsletterInline.tsx` parametrizada por publicação/idioma.
- `BlogSEO.tsx` — estender hreflang para `/blog/{pub}/...` e adicionar `article:section`, `article:author`, `twitter:creator`.
- `BlogMarkdownContent.tsx` — variante `journal` com drop cap (`:first-letter`) e pull quotes (`>>`).

### 4. Admin (`/admin/blog`)
- `AdminBlogListPage.tsx` — adicionar tabs "Pro Blog" | "The Journal" (filtra por `publication_id`).
- `AdminBlogEditorPage.tsx` — seletor de publicação, dropdown de categoria filtrado pela publicação, campo `focus_keyword`, mantém autosave + upload + tabs EN/PT/ES.

### 5. Sitemap & SEO
- Atualizar `supabase/functions/blog-sitemap/index.ts` para gerar URLs com `/blog/{pub}/{slug}` + hreflang.
- `public/robots.txt` já permite `/blog`; adicionar `Allow: /blog/pro` e `/blog/journal` explicitamente (cosmético).
- Atualizar `index.html` se necessário (mantém atual; per-route via Helmet).

### 6. Design tokens
- Adicionar em `tailwind.config.ts` / `index.css`: `--blog-pro` (teal #2ABFBF → HSL), `--blog-journal` (gold #C9A961 → HSL), `--blog-cream` (#FAF8F5).
- Carregar Fraunces via Google Fonts no `index.html` (com `display=swap`).
- Classes utilitárias: `font-journal` (Fraunces) vs `font-pro` (Inter/Jakarta atual).

### 7. Tipografia Journal
- Drop cap CSS no `.blog-prose.journal :first-of-type:first-letter`.
- Pull quote: parser markdown converte linhas `>> texto` em `<aside class="pull-quote">`.

## Detalhes técnicos

- **Migração de dados existentes**: artigos/categorias atuais (ainda nenhum publicado, apenas categorias seed) serão atribuídos à publicação Journal por padrão (categorias atuais são "Health Sanctuary Tourism", "Brazil Healthcare Guide", "Treatments & Recovery"). Após backfill, torno `publication_id` NOT NULL.
- **RLS**: as policies já existentes em `blog_articles`/translations seguem válidas (leitura pública de `status='published'`). `blog_publications` ganha policy `SELECT TO anon USING (true)`.
- **Sem comentários, sem ads, sem popups** — respeitado.
- **Idiomas**: Pro default `pt`, Journal default `en`. Switcher usa `langFromPath` existente + `persistLang`.
- **Newsletter inline**: passa `source` = pathname e `preferred_publication` = 'pro'|'journal' no insert.
- **Hreflang**: `/blog/{pub}/{slug}` (EN/x-default), `/pt/blog/{pub}/{slug}`, `/es/blog/{pub}/{slug}`.
- **Fonte Fraunces**: incluída via `<link>` em `index.html` para Journal; Pro mantém Plus Jakarta Sans (Core memory).
- **Performance**: imagens `loading="lazy"` + `decoding="async"`; LCP image `fetchpriority="high"`; markdown render mantém `marked` + `DOMPurify`.

## Fora de escopo (não tocar)
- `/pro`, `/kite`, `/login`, `/dashboard`, `/admin/*` (exceto `/admin/blog`), auth, Stripe, header/footer globais.

## Ordem de execução
1. Migration (schema + seed + backfill).
2. Aguardar aprovação.
3. Design tokens + Fraunces.
4. Hub, PublicationHome, AuthorPage, NewsletterInline, PublicationCard.
5. Atualizar BlogArticle (variantes Pro vs Journal) + BlogSEO + BlogMarkdownContent (drop cap + pull quote).
6. Atualizar rotas em `App.tsx`.
7. Atualizar AdminBlogListPage (tabs) + AdminBlogEditorPage (publication selector + focus_keyword).
8. Atualizar edge function `blog-sitemap`.
9. Validar com `code--exec` (typecheck via harness automático) e revisar via browser tools.

Confirme para eu rodar a migration e seguir.
