
-- 1) Publications table
CREATE TABLE public.blog_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_pt TEXT NOT NULL,
  name_es TEXT,
  description_en TEXT,
  description_pt TEXT,
  description_es TEXT,
  accent_color TEXT,
  default_language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_publications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_publications TO authenticated;
GRANT ALL ON public.blog_publications TO service_role;

ALTER TABLE public.blog_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read publications"
  ON public.blog_publications FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage publications"
  ON public.blog_publications FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) Seed publications
INSERT INTO public.blog_publications (slug, name_en, name_pt, name_es, description_en, description_pt, accent_color, default_language)
VALUES
  ('pro', 'SalbCare Pro Blog', 'Blog SalbCare Pro', 'Blog SalbCare Pro',
   'Practical guides on management, finance, marketing and technology for autonomous health professionals in Brazil.',
   'Guias práticos sobre gestão, finanças, atração de pacientes e tecnologia para profissionais de saúde autônomos no Brasil.',
   '#2ABFBF', 'pt'),
  ('journal', 'The SalbCare Journal', 'O Diário SalbCare', 'El Diario SalbCare',
   'Essays and research on Health Sanctuary Tourism — the emerging category of healthcare in restorative environments.',
   'Ensaios e pesquisa sobre Turismo de Santuário em Saúde — a categoria emergente de saúde em ambientes restauradores.',
   '#C9A961', 'en');

-- 3) Extend categories & articles with publication_id
ALTER TABLE public.blog_categories ADD COLUMN publication_id UUID REFERENCES public.blog_publications(id) ON DELETE RESTRICT;
ALTER TABLE public.blog_articles  ADD COLUMN publication_id UUID REFERENCES public.blog_publications(id) ON DELETE RESTRICT;

-- 4) Backfill existing categories/articles into Journal
UPDATE public.blog_categories
   SET publication_id = (SELECT id FROM public.blog_publications WHERE slug = 'journal')
 WHERE publication_id IS NULL;
UPDATE public.blog_articles
   SET publication_id = (SELECT id FROM public.blog_publications WHERE slug = 'journal')
 WHERE publication_id IS NULL;

-- 5) Make NOT NULL + add scoped uniques
ALTER TABLE public.blog_categories ALTER COLUMN publication_id SET NOT NULL;
ALTER TABLE public.blog_articles   ALTER COLUMN publication_id SET NOT NULL;

-- Drop any global unique on slug if existed and replace with composite
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blog_categories_slug_key') THEN
    ALTER TABLE public.blog_categories DROP CONSTRAINT blog_categories_slug_key;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blog_articles_slug_key') THEN
    ALTER TABLE public.blog_articles DROP CONSTRAINT blog_articles_slug_key;
  END IF;
END $$;

ALTER TABLE public.blog_categories ADD CONSTRAINT blog_categories_pub_slug_unique UNIQUE (publication_id, slug);
ALTER TABLE public.blog_articles   ADD CONSTRAINT blog_articles_pub_slug_unique   UNIQUE (publication_id, slug);

CREATE INDEX IF NOT EXISTS idx_blog_articles_publication   ON public.blog_articles(publication_id, status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_categories_publication ON public.blog_categories(publication_id, display_order);

-- 6) Translations: focus_keyword
ALTER TABLE public.blog_article_translations ADD COLUMN IF NOT EXISTS focus_keyword TEXT;

-- 7) Newsletter: preferred_publication
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS preferred_publication TEXT;
ALTER TABLE public.newsletter_subscribers
  ADD CONSTRAINT newsletter_pref_pub_check CHECK (preferred_publication IS NULL OR preferred_publication IN ('pro','journal','both'));

-- 8) Seed Pro categories
WITH pub AS (SELECT id FROM public.blog_publications WHERE slug = 'pro')
INSERT INTO public.blog_categories (publication_id, slug, name_pt, name_en, name_es, display_order)
SELECT pub.id, v.slug, v.name_pt, v.name_en, v.name_es, v.ord FROM pub,
(VALUES
  ('gestao-financeira', 'Gestão Financeira', 'Financial Management', 'Gestión Financiera', 1),
  ('tecnologia-saude',  'Tecnologia em Saúde', 'Healthcare Technology', 'Tecnología en Salud', 2),
  ('regulatorio-legal', 'Regulatório e Legal', 'Regulatory & Legal', 'Regulatorio y Legal', 3),
  ('atracao-pacientes', 'Atração de Pacientes', 'Patient Acquisition', 'Atracción de Pacientes', 4)
) AS v(slug, name_pt, name_en, name_es, ord)
ON CONFLICT (publication_id, slug) DO NOTHING;

-- 9) Seed Journal categories (in case the seeded ones used different slugs)
WITH pub AS (SELECT id FROM public.blog_publications WHERE slug = 'journal')
INSERT INTO public.blog_categories (publication_id, slug, name_en, name_pt, name_es, display_order)
SELECT pub.id, v.slug, v.name_en, v.name_pt, v.name_es, v.ord FROM pub,
(VALUES
  ('health-sanctuary-tourism', 'Health Sanctuary Tourism', 'Turismo de Santuário em Saúde', 'Turismo de Santuario en Salud', 1),
  ('brazil-healthcare-guide',  'Brazil Healthcare Guide', 'Guia de Saúde no Brasil', 'Guía de Salud en Brasil', 2),
  ('treatments-recovery',      'Treatments & Recovery', 'Tratamentos e Recuperação', 'Tratamientos y Recuperación', 3),
  ('patient-stories',          'Patient Stories', 'Histórias de Pacientes', 'Historias de Pacientes', 4)
) AS v(slug, name_en, name_pt, name_es, ord)
ON CONFLICT (publication_id, slug) DO NOTHING;
