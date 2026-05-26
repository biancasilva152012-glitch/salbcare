
-- ============================================================
-- BLOG TABLES
-- ============================================================

CREATE TABLE public.blog_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  bio_en TEXT,
  bio_pt TEXT,
  bio_es TEXT,
  avatar_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_pt TEXT,
  name_es TEXT,
  description_en TEXT,
  description_pt TEXT,
  description_es TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  author_id UUID REFERENCES public.blog_authors(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  featured_image_url TEXT,
  featured_image_alt_en TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at TIMESTAMPTZ,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  read_time_minutes INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_articles_status_pub ON public.blog_articles (status, published_at DESC NULLS LAST);
CREATE INDEX idx_blog_articles_category ON public.blog_articles (category_id);
CREATE INDEX idx_blog_articles_author ON public.blog_articles (author_id);
CREATE INDEX idx_blog_articles_featured ON public.blog_articles (is_featured) WHERE is_featured = true;

CREATE TABLE public.blog_article_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('en','pt','es')),
  title TEXT NOT NULL,
  subtitle TEXT,
  excerpt TEXT,
  content_markdown TEXT,
  content_html TEXT,
  meta_title TEXT,
  meta_description TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  canonical_url TEXT,
  word_count INTEGER,
  UNIQUE (article_id, language)
);

CREATE INDEX idx_blog_translations_lang ON public.blog_article_translations (language, article_id);

CREATE TABLE public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_pt TEXT,
  name_es TEXT
);

CREATE TABLE public.blog_article_tags (
  article_id UUID NOT NULL REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX idx_blog_article_tags_tag ON public.blog_article_tags (tag_id);

CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  language TEXT DEFAULT 'en' CHECK (language IN ('en','pt','es')),
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER trg_blog_articles_updated_at
  BEFORE UPDATE ON public.blog_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure only one featured article at a time
CREATE OR REPLACE FUNCTION public.blog_enforce_single_featured()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_featured = true THEN
    UPDATE public.blog_articles
       SET is_featured = false
     WHERE id <> NEW.id AND is_featured = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_blog_single_featured
  AFTER INSERT OR UPDATE OF is_featured ON public.blog_articles
  FOR EACH ROW WHEN (NEW.is_featured = true)
  EXECUTE FUNCTION public.blog_enforce_single_featured();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_article_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public reads (anon + authenticated)
CREATE POLICY "Public read active authors"
  ON public.blog_authors FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public read active categories"
  ON public.blog_categories FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public read published articles"
  ON public.blog_articles FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Public read translations of published articles"
  ON public.blog_article_translations FOR SELECT TO anon, authenticated
  USING (article_id IN (SELECT id FROM public.blog_articles WHERE status = 'published'));

CREATE POLICY "Public read tags"
  ON public.blog_tags FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public read article_tags of published"
  ON public.blog_article_tags FOR SELECT TO anon, authenticated
  USING (article_id IN (SELECT id FROM public.blog_articles WHERE status = 'published'));

-- Admin full access
CREATE POLICY "Admins manage authors"
  ON public.blog_authors FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage categories"
  ON public.blog_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage articles"
  ON public.blog_articles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage translations"
  ON public.blog_article_translations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage tags"
  ON public.blog_tags FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage article_tags"
  ON public.blog_article_tags FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Newsletter: public can subscribe (with valid email), admin can read
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

CREATE POLICY "Admins read newsletter subscribers"
  ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete newsletter subscribers"
  ON public.newsletter_subscribers FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- STORAGE BUCKET FOR BLOG IMAGES
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read blog-images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'blog-images');

CREATE POLICY "Admins upload blog-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update blog-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete blog-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images' AND has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO public.blog_authors (slug, name, role, bio_en, bio_pt, bio_es)
VALUES (
  'bianca-albuquerque',
  'Bianca Albuquerque',
  'Founder & CEO',
  'Bianca S. de Albuquerque is the founder of SalbCare and a pioneer of Health Sanctuary Tourism — a new category of premium healthcare combining clinical excellence with the restorative power of place. Based in Ceará, Brazil, she writes about the intersection of healthcare innovation, geography, and human wellbeing.',
  'Bianca S. de Albuquerque é a fundadora da SalbCare e pioneira do Turismo de Santuário de Saúde — uma nova categoria de cuidado premium que combina excelência clínica com o poder restaurador do lugar. Baseada no Ceará, Brasil, escreve sobre a interseção entre inovação em saúde, geografia e bem-estar humano.',
  'Bianca S. de Albuquerque es la fundadora de SalbCare y pionera del Turismo de Santuario de Salud — una nueva categoría de atención premium que combina excelencia clínica con el poder restaurador del lugar. Radicada en Ceará, Brasil, escribe sobre la intersección entre la innovación en salud, la geografía y el bienestar humano.'
);

INSERT INTO public.blog_categories (slug, name_en, name_pt, name_es, description_en, description_pt, description_es, display_order) VALUES
('health-sanctuary-tourism',
 'Health Sanctuary Tourism',
 'Turismo de Santuário de Saúde',
 'Turismo de Santuario de Salud',
 'Essays and research on the emerging category of healthcare experiences set in restorative environments.',
 'Ensaios e pesquisas sobre a categoria emergente de experiências de saúde em ambientes restauradores.',
 'Ensayos e investigación sobre la categoría emergente de experiencias de salud en entornos restauradores.',
 1),
('brazil-healthcare-guide',
 'Brazil Healthcare Guide',
 'Guia de Saúde no Brasil',
 'Guía de Salud en Brasil',
 'Practical guides for international travelers navigating healthcare in Brazil — what to expect, what to bring, how to communicate.',
 'Guias práticos para viajantes internacionais navegando a saúde no Brasil — o que esperar, o que trazer, como se comunicar.',
 'Guías prácticas para viajeros internacionales que navegan la atención médica en Brasil — qué esperar, qué traer, cómo comunicarse.',
 2),
('dental-physio-telehealth',
 'Treatments & Recovery',
 'Tratamentos e Recuperação',
 'Tratamientos y Recuperación',
 'Deep dives into specific treatments offered at SalbCare clinics, recovery timelines, and patient stories.',
 'Aprofundamentos em tratamentos específicos oferecidos nas clínicas SalbCare, prazos de recuperação e histórias de pacientes.',
 'Análisis a fondo de tratamientos específicos ofrecidos en las clínicas SalbCare, plazos de recuperación e historias de pacientes.',
 3);
