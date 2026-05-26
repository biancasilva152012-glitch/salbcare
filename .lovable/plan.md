# SalbCare Journal — Bilingual SEO Blog

Additive build at `/blog`. No existing route (/, /pro, /kite, /login, /dashboard, /admin/*) is modified except adding new entries to `App.tsx` router and a new `/admin/blog` sub-area inside the existing admin shell.

## 1. Database (single migration)

New `blog` schema with: `authors`, `categories`, `articles`, `article_translations`, `tags`, `article_tags`, plus a top-level `newsletter_subscribers` table in `public` (RLS-friendly).

- RLS: public SELECT on published articles + their translations + authors + categories + tags. Admin (`has_role(uid,'admin')`) full ALL on every blog table. `newsletter_subscribers`: public INSERT (with email format check), admin SELECT only.
- Storage bucket `blog-images` (public read, admin write).
- Seed: Bianca Albuquerque author + 3 categories (Health Sanctuary Tourism, Brazil Healthcare Guide, Treatments & Recovery). No seed articles — admin publishes the first one.
- Indexes on `articles(status, published_at desc)`, `article_translations(language, article_id)`, `articles(category_id)`, `article_tags(tag_id)`.
- Trigger `update_updated_at_column` on articles.

## 2. Routes (added to `src/App.tsx`)

Lazy-loaded, public:
- `/blog` → BlogHome
- `/blog/category/:slug` → BlogCategory
- `/blog/tag/:slug` → BlogTag
- `/blog/author/:slug` → BlogAuthor
- `/blog/:articleSlug` → BlogArticle
- Locale prefix variants `/en/blog/*`, `/pt/blog/*`, `/es/blog/*` resolve to the same components — locale parsed from URL.

Admin (gated by existing `isAdminEmail` + `has_role` check used elsewhere):
- `/admin/blog` → list/manage
- `/admin/blog/new` and `/admin/blog/:id` → editor

## 3. Frontend code layout

```
src/
  pages/
    blog/
      BlogHome.tsx
      BlogArticle.tsx
      BlogCategory.tsx
      BlogTag.tsx
      BlogAuthor.tsx
    admin/blog/
      AdminBlogList.tsx
      AdminBlogEditor.tsx
  components/blog/
    BlogHeader.tsx          // reuses existing header + language switcher
    BlogHero.tsx
    BlogCategoryNav.tsx
    BlogArticleCard.tsx
    BlogFeaturedCard.tsx
    BlogPagination.tsx      // reuses ListPagination
    BlogNewsletterCTA.tsx
    BlogInlineNewsletter.tsx
    BlogBreadcrumb.tsx      // already exists, extend
    BlogAuthorByline.tsx
    BlogAuthorCard.tsx
    BlogShareButtons.tsx
    BlogRelated.tsx
    BlogMarkdownContent.tsx // renders markdown -> styled HTML
    BlogSEO.tsx             // Helmet wrapper: title/description/og/twitter/hreflang/JSON-LD
    BlogTagPill.tsx
    admin/
      ArticleForm.tsx
      MarkdownEditor.tsx    // textarea + live preview, autosave hook
      ImageUploader.tsx
  lib/blog/
    queries.ts              // typed supabase queries (list, getBySlug, related, byCategory, byTag, byAuthor)
    locale.ts               // detect + persist 'salbcare_lang'
    markdown.ts             // marked + sanitize-html, computes read time + word count
    types.ts
  hooks/
    useBlogLocale.ts
```

Routing: `App.tsx` gets the 6 public blog routes (×4 locale prefixes via a small `<LocalizedRoutes>` helper that mounts the same elements under `/`, `/en`, `/pt`, `/es`).

## 4. SEO infrastructure

- Install `react-helmet-async` + wrap `main.tsx` with `<HelmetProvider>` (idempotent if already present).
- `BlogSEO` emits `<title>`, description, canonical, full OG set, Twitter card, hreflang triplet (en/pt/es + x-default→en), JSON-LD `Article` (article page), `BreadcrumbList`, `CollectionPage` (homepage), `Person` (author page).
- `scripts/generate-sitemap.ts` (extend existing if present, else create) reads published articles + translations at build time via Supabase REST and writes `public/sitemap.xml` with `<xhtml:link rel="alternate" hreflang>` annotations. Wire `predev`/`prebuild`.
- `public/robots.txt`: ensure `Sitemap:` points to `https://salbcare.com/sitemap.xml`.

## 5. Admin CMS

- Editor: split-pane markdown ↔ live preview (uses `BlogMarkdownContent`). Autosave to `status='draft'` every 30s via debounced upsert.
- Tabs for EN/PT/ES translations (each editable independently, EN required to publish).
- Featured image: upload to `blog-images` bucket, store public URL.
- Word count + read time auto-computed on blur.
- Status toggle: draft / published / archived. "Mark as featured" enforces single featured (server-side trigger unsets others when set true).

## 6. Markdown rendering

Dependencies to add: `marked`, `dompurify`, `react-helmet-async`.
Pull-quote syntax: `> ` blockquote rendered with gold left-border styling. Images get lazy-loading, `loading="lazy"`, responsive `srcset` via Supabase transform query params.

## 7. Design tokens

Add to `src/index.css` (light additions, do not touch existing tokens):
```
--blog-bg: 196 53% 13%;        /* #0F2A33 */
--blog-card: 197 50% 21%;      /* #1A3F50 */
--blog-gold: 43 47% 60%;       /* #C9A961 */
--blog-cream: 39 50% 93%;      /* #F5F0E6 */
--blog-ink: 30 8% 9%;          /* #1A1814 */
--blog-muted-on-dark: 192 16% 58%;
--font-serif-display: 'Fraunces', Georgia, serif;
```
Tailwind config: extend `colors.blog.*`, `fontFamily.serif`. Pull Fraunces via `<link>` in `index.html` (alongside existing Plus Jakarta Sans).

## 8. Newsletter

`newsletter_subscribers (id, email unique, language, source, created_at)`. Public anon INSERT with email regex check; admin SELECT. Form posts via supabase client; toast on success.

## 9. Out of scope (per spec)

No comments, ads, reactions, infinite scroll, AI auto-gen, popups.

## 10. Deliverables / verification

- Build passes, types updated, no edits to existing routes.
- Manual smoke list reported back: `/blog`, `/blog/:slug` (after seeding 1 article via admin), sitemap, robots, hreflang, JSON-LD shape.
- Note: Lighthouse scores can't be measured from inside the sandbox — I'll list the optimizations made (lazy images, code-split routes, preloaded fonts, sanitized HTML, server-rendered meta via Helmet) and leave the actual scoring to the user.

---

**Two confirmations needed before I start (one short reply, multi-select):**

1. **Author bio LinkedIn URL** — spec says `linkedin.com/in/biancapamplona`, but the codebase + memory use **Albuquerque**. Use `linkedin.com/in/biancaalbuquerque` instead? (Yes / No / leave blank)
2. **Language prefix** — keep both un-prefixed (`/blog/...` = EN default) AND `/en/blog/...` working as aliases? Or only `/blog/...` with a `?lang=pt` query? (Spec says subpath — I'll go with subpath + un-prefixed EN unless you say otherwise.)
