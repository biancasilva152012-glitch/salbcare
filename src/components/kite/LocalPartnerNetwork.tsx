import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, ShieldCheck, ArrowRight, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";

const BRAND = { teal: "#00B4A0", tealDark: "#008C7C", ink: "#0D1B2A", cream: "#F8F9FA" };

type Lang = "en" | "es" | "pt";

interface Partner {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  location: string | null;
  description: string | null;
  image_url: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  featured: boolean;
}

const HEALTHCARE_CATEGORIES = new Set(["dental", "doctor", "physio", "rehab"]);

const COPY: Record<Lang, {
  tag: string;
  h2: string;
  sub: string;
  body: string;
  verified: string;
  trust: string;
  healthcareDisclaimer: string;
  ctaLead: string;
  ctaSub: string;
  become: string;
  empty: string;
  contact: string;
  waMsg: (name: string) => string;
  scrollLeft: string;
  scrollRight: string;
  carouselLabel: string;
}> = {
  en: {
    tag: "SALBCARE LOCAL NETWORK",
    h2: "Everything you need, connected locally",
    sub: "SalbCare connects you with trusted local partners for healthcare, accommodation, food and experiences around Ilha do Guajiru.",
    body: "From healthcare support to local experiences, discover trusted partners selected by SalbCare.",
    verified: "SalbCare Verified Partner",
    trust:
      "All partners are carefully selected by SalbCare to provide a safer and better experience for our community.",
    healthcareDisclaimer:
      "Consultation prices are set by each professional. SalbCare only curates the network — we do not set fees.",
    ctaLead: "Are you a local business or healthcare professional?",
    ctaSub: "Join the SalbCare Partner Network",
    become: "Become a Partner",
    empty: "New partners are being added to the network.",
    contact: "Contact Partner",
    waMsg: (name) =>
      `Hello! I found ${name} through SalbCare Local Network and I'd like more information.`,
    scrollLeft: "Scroll partners left",
    scrollRight: "Scroll partners right",
    carouselLabel: "SalbCare Local Network partners",
  },
  es: {
    tag: "SALBCARE LOCAL NETWORK",
    h2: "Todo lo que necesitas, conectado localmente",
    sub: "SalbCare te conecta con socios locales de confianza para salud, hospedaje, gastronomía y experiencias en la Ilha do Guajiru.",
    body: "Desde apoyo en salud hasta experiencias locales, descubre socios seleccionados por SalbCare.",
    verified: "SalbCare Verified Partner",
    trust:
      "Todos los socios son cuidadosamente seleccionados por SalbCare para brindar una experiencia más segura y mejor a nuestra comunidad.",
    healthcareDisclaimer:
      "Los precios de la consulta los define cada profesional. SalbCare solo hace la curaduría de la red — no fijamos tarifas.",
    ctaLead: "¿Eres un negocio local o profesional de la salud?",
    ctaSub: "Únete a la red de socios SalbCare",
    become: "Become a Partner",
    empty: "Nuevos socios están siendo añadidos a la red.",
    contact: "Contactar socio",
    waMsg: (name) =>
      `¡Hola! Encontré a ${name} por medio de SalbCare Local Network y quisiera más información.`,
    scrollLeft: "Desplazar socios a la izquierda",
    scrollRight: "Desplazar socios a la derecha",
    carouselLabel: "Socios de SalbCare Local Network",
  },
  pt: {
    tag: "SALBCARE LOCAL NETWORK",
    h2: "Tudo que você precisa, conectado localmente",
    sub: "A SalbCare conecta você com parceiros locais de confiança para saúde, hospedagem, gastronomia e experiências na Ilha do Guajiru.",
    body: "De apoio em saúde a experiências locais, descubra parceiros selecionados pela SalbCare.",
    verified: "SalbCare Verified Partner",
    trust:
      "Todos os parceiros são cuidadosamente selecionados pela SalbCare para oferecer uma experiência mais segura e melhor para nossa comunidade.",
    healthcareDisclaimer:
      "Os valores das consultas são definidos por cada profissional. A SalbCare apenas faz a curadoria da rede — nós não definimos os preços.",
    ctaLead: "Você é um negócio local ou profissional de saúde?",
    ctaSub: "Junte-se à rede de parceiros da SalbCare",
    become: "Become a Partner",
    empty: "Novos parceiros estão sendo adicionados à rede.",
    contact: "Falar com parceiro",
    waMsg: (name) =>
      `Olá! Encontrei ${name} pela SalbCare Local Network e gostaria de mais informações.`,
    scrollLeft: "Rolar parceiros para a esquerda",
    scrollRight: "Rolar parceiros para a direita",
    carouselLabel: "Parceiros da SalbCare Local Network",
  },
};

const CATEGORY_LABEL: Record<Lang, Record<string, string>> = {
  en: {
    dental: "Dental Clinic",
    doctor: "Doctor",
    physio: "Physiotherapist",
    rehab: "Rehabilitation",
    hotel: "Hotel",
    pousada: "Pousada",
    restaurant: "Restaurant",
    transfer: "Transfer",
    kite_school: "Kite School",
    local_service: "Local Service",
  },
  es: {
    dental: "Clínica dental",
    doctor: "Médico",
    physio: "Fisioterapeuta",
    rehab: "Rehabilitación",
    hotel: "Hotel",
    pousada: "Pousada",
    restaurant: "Restaurante",
    transfer: "Transfer",
    kite_school: "Escuela de kite",
    local_service: "Servicio local",
  },
  pt: {
    dental: "Clínica odontológica",
    doctor: "Médico",
    physio: "Fisioterapeuta",
    rehab: "Reabilitação",
    hotel: "Hotel",
    pousada: "Pousada",
    restaurant: "Restaurante",
    transfer: "Transfer",
    kite_school: "Escola de kite",
    local_service: "Serviço local",
  },
};

export default function LocalPartnerNetwork({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const catLabels = CATEGORY_LABEL[lang];
  const scrollerRef = useRef<HTMLDivElement>(null);

  const { data: partners = [], isLoading } = useQuery<Partner[]>({
    queryKey: ["local-partners-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("local_partners" as any)
        .select("id,name,category,subcategory,location,description,image_url,whatsapp,instagram,website,featured")
        .eq("active", true)
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Partner[]) || [];
    },
  });

  const hasHealthcare = useMemo(
    () => partners.some((p) => HEALTHCARE_CATEGORIES.has(p.category)),
    [partners],
  );

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    // Card width (~280) + gap (20). Scroll by ~1 card on mobile, more on desktop.
    const step = Math.max(el.clientWidth * 0.85, 300);
    el.scrollBy({ left: step * dir, behavior: "smooth" });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollBy(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollBy(-1);
    }
  };

  return (
    <section
      className="px-4 sm:px-5 py-16 sm:py-20"
      style={{ background: `linear-gradient(180deg, ${BRAND.cream} 0%, #fff 100%)` }}
      aria-labelledby="local-network-heading"
    >
      <style>{`
        .lpn-scroller { scrollbar-width: thin; }
        .lpn-scroller::-webkit-scrollbar { height: 6px; }
        .lpn-scroller::-webkit-scrollbar-thumb { background: rgba(13,27,42,0.15); border-radius: 3px; }
        .lpn-card {
          transition: transform 220ms cubic-bezier(0.2,0,0,1), box-shadow 220ms cubic-bezier(0.2,0,0,1), border-color 220ms;
        }
        @media (hover: hover) {
          .lpn-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 18px rgba(13,27,42,0.10), 0 2px 6px rgba(13,27,42,0.06);
            border-color: rgba(0,180,160,0.35);
          }
        }
        .lpn-focus:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(0,180,160,0.45);
          border-radius: 12px;
        }
        .lpn-btn-focus:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(0,180,160,0.45);
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <div
            className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] px-3 py-1.5 rounded-full mb-4"
            style={{ background: `${BRAND.teal}15`, color: BRAND.tealDark }}
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {t.tag}
          </div>
          <h2
            id="local-network-heading"
            className="kite-h text-2xl sm:text-3xl md:text-4xl mb-3"
            style={{ color: BRAND.ink }}
          >
            {t.h2}
          </h2>
          <p className="text-sm sm:text-base md:text-lg font-medium mb-2 max-w-3xl mx-auto" style={{ color: BRAND.ink }}>
            {t.sub}
          </p>
          <p className="text-xs sm:text-sm md:text-base max-w-2xl mx-auto" style={{ color: BRAND.ink, opacity: 0.7 }}>
            {t.body}
          </p>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="min-w-[260px] h-[340px] rounded-2xl bg-black/5 animate-pulse" />
            ))}
          </div>
        ) : partners.length === 0 ? (
          <p className="text-center text-sm py-12" style={{ color: BRAND.ink, opacity: 0.5 }} role="status">
            {t.empty}
          </p>
        ) : (
          <div className="relative">
            {/* Desktop nav arrows */}
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label={t.scrollLeft}
              className="lpn-btn-focus hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-white shadow-md border border-black/[0.06] hover:brightness-95 transition"
              style={{ color: BRAND.ink }}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label={t.scrollRight}
              className="lpn-btn-focus hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-white shadow-md border border-black/[0.06] hover:brightness-95 transition"
              style={{ color: BRAND.ink }}
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>

            <div
              ref={scrollerRef}
              role="region"
              aria-roledescription="carousel"
              aria-label={t.carouselLabel}
              tabIndex={0}
              onKeyDown={onKeyDown}
              className="lpn-scroller lpn-focus flex gap-4 sm:gap-5 overflow-x-auto pb-4 -mx-4 sm:-mx-5 px-4 sm:px-5 snap-x snap-mandatory scroll-smooth"
            >
              {partners.map((p, i) => (
                <PartnerCard
                  key={p.id}
                  p={p}
                  index={i}
                  total={partners.length}
                  verifiedLabel={t.verified}
                  contactLabel={t.contact}
                  categoryLabel={catLabels[p.category] || p.category}
                  waMsgBuilder={t.waMsg}
                />
              ))}
            </div>
          </div>
        )}

        {/* Trust message + badge */}
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <div
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
            style={{ background: `${BRAND.teal}15`, color: BRAND.tealDark }}
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {t.verified}
          </div>
          <p className="text-sm max-w-2xl leading-relaxed" style={{ color: BRAND.ink, opacity: 0.7 }}>
            {t.trust}
          </p>
          {hasHealthcare && (
            <p
              className="text-[11px] sm:text-xs max-w-xl leading-relaxed italic"
              style={{ color: BRAND.ink, opacity: 0.55 }}
            >
              {t.healthcareDisclaimer}
            </p>
          )}
        </div>

        {/* Become a Partner CTA */}
        <div
          className="mt-10 sm:mt-12 rounded-2xl p-5 sm:p-6 md:p-8 border border-black/[0.06] flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-5 text-center md:text-left"
          style={{ background: "#fff", boxShadow: "0 2px 12px rgba(13,27,42,0.04)" }}
        >
          <div>
            <div className="text-sm font-semibold" style={{ color: BRAND.ink }}>
              {t.ctaLead}
            </div>
            <div className="text-xs mt-1" style={{ color: BRAND.ink, opacity: 0.6 }}>
              {t.ctaSub}
            </div>
          </div>
          <Link
            to="/partnership"
            className="lpn-btn-focus inline-flex items-center gap-2 rounded-full font-semibold transition-all duration-200 hover:brightness-110 whitespace-nowrap w-full md:w-auto justify-center"
            style={{
              background: BRAND.ink,
              color: "#fff",
              minHeight: 48,
              padding: "0 24px",
              fontSize: 14,
            }}
          >
            {t.become} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PartnerCard({
  p,
  index,
  total,
  verifiedLabel,
  contactLabel,
  categoryLabel,
  waMsgBuilder,
}: {
  p: Partner;
  index: number;
  total: number;
  verifiedLabel: string;
  contactLabel: string;
  categoryLabel: string;
  waMsgBuilder: (name: string) => string;
}) {
  const waHref = p.whatsapp
    ? `https://wa.me/${p.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(waMsgBuilder(p.name))}`
    : null;
  const fallbackHref = !waHref
    ? p.website
      ? p.website
      : p.instagram
      ? `https://instagram.com/${p.instagram.replace(/^@/, "")}`
      : null
    : null;
  const contactHref = waHref || fallbackHref;

  return (
    <article
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} / ${total}: ${p.name}`}
      className="lpn-card min-w-[85%] xs:min-w-[75%] sm:min-w-[280px] sm:max-w-[280px] md:min-w-[300px] md:max-w-[300px] snap-start rounded-2xl overflow-hidden bg-white border border-black/[0.06] flex flex-col"
      style={{ boxShadow: "0 2px 12px rgba(13,27,42,0.06)" }}
    >
      <div
        className="relative h-40"
        style={{ background: `linear-gradient(135deg, ${BRAND.teal}20 0%, ${BRAND.ink}10 100%)` }}
      >
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={`${p.name} — ${categoryLabel}`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-4xl font-bold"
            style={{ color: BRAND.tealDark, opacity: 0.4 }}
            aria-hidden
          >
            {p.name.charAt(0)}
          </div>
        )}
        <div
          className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
          style={{ background: "#fff", color: BRAND.tealDark }}
        >
          <ShieldCheck className="h-3 w-3" aria-hidden />
          {verifiedLabel}
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: BRAND.teal }}>
          {categoryLabel}
        </div>
        <h3 className="text-base font-bold mb-1" style={{ color: BRAND.ink }}>
          {p.name}
        </h3>
        {p.location && (
          <div className="flex items-center gap-1 text-xs mb-2" style={{ color: BRAND.ink, opacity: 0.6 }}>
            <MapPin className="h-3 w-3" aria-hidden />
            {p.location}
          </div>
        )}
        {p.description && (
          <p className="text-xs leading-relaxed flex-1 mb-3" style={{ color: BRAND.ink, opacity: 0.75 }}>
            {p.description}
          </p>
        )}
        {contactHref && (
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${contactLabel}: ${p.name}`}
            className="lpn-btn-focus mt-auto inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-colors hover:brightness-95"
            style={{
              background: waHref ? "#25D366" : `${BRAND.teal}15`,
              color: waHref ? "#fff" : BRAND.tealDark,
              minHeight: 44,
              padding: "0 16px",
            }}
          >
            {waHref && <MessageCircle className="h-3.5 w-3.5" aria-hidden />}
            {contactLabel}
          </a>
        )}
      </div>
    </article>
  );
}
