import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, ShieldCheck, ArrowRight } from "lucide-react";

const BRAND = { teal: "#00B4A0", tealDark: "#008C7C", ink: "#0D1B2A", cream: "#F8F9FA" };

type Lang = "en" | "es";

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

const COPY = {
  en: {
    tag: "SALBCARE LOCAL PARTNER NETWORK",
    h2: "SalbCare Local Partner Network",
    sub: "Trusted healthcare and local partners selected by SalbCare.",
    body: "Find reliable healthcare services, accommodations and local experiences recommended by our network.",
    verified: "SalbCare Verified Partner",
    become: "Become a SalbCare Partner",
    empty: "New partners are being added to the network.",
    contact: "Contact",
  },
  es: {
    tag: "RED DE PARCEROS SALBCARE",
    h2: "SalbCare Local Partner Network",
    sub: "Socios de salud y locales confiables, seleccionados por SalbCare.",
    body: "Encuentra servicios de salud, hospedaje y experiencias locales recomendadas por nuestra red.",
    verified: "SalbCare Verified Partner",
    become: "Become a SalbCare Partner",
    empty: "Nuevos socios están siendo añadidos a la red.",
    contact: "Contactar",
  },
} satisfies Record<Lang, Record<string, string>>;

const CATEGORY_LABEL: Record<string, string> = {
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
};

export default function LocalPartnerNetwork({ lang }: { lang: Lang }) {
  const t = COPY[lang];

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

  return (
    <section
      className="px-5 py-20"
      style={{ background: `linear-gradient(180deg, ${BRAND.cream} 0%, #fff 100%)` }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] px-3 py-1.5 rounded-full mb-4"
            style={{ background: `${BRAND.teal}15`, color: BRAND.tealDark }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {t.tag}
          </div>
          <h2 className="kite-h text-3xl md:text-4xl mb-3" style={{ color: BRAND.ink }}>
            {t.h2}
          </h2>
          <p className="text-base md:text-lg font-medium mb-2" style={{ color: BRAND.ink }}>
            {t.sub}
          </p>
          <p className="text-sm md:text-base max-w-2xl mx-auto" style={{ color: BRAND.ink, opacity: 0.7 }}>
            {t.body}
          </p>
        </div>

        {isLoading ? (
          <div className="flex gap-5 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="min-w-[280px] h-[340px] rounded-2xl bg-black/5 animate-pulse" />
            ))}
          </div>
        ) : partners.length === 0 ? (
          <p className="text-center text-sm py-12" style={{ color: BRAND.ink, opacity: 0.5 }}>
            {t.empty}
          </p>
        ) : (
          <div
            className="flex gap-5 overflow-x-auto pb-4 -mx-5 px-5 snap-x snap-mandatory"
            style={{ scrollbarWidth: "thin" }}
          >
            {partners.map((p) => (
              <PartnerCard key={p.id} p={p} verifiedLabel={t.verified} contactLabel={t.contact} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            to="/partnership"
            className="inline-flex items-center gap-2 rounded-full font-semibold transition-all duration-200 hover:brightness-110"
            style={{
              background: BRAND.ink,
              color: "#fff",
              minHeight: 52,
              padding: "0 28px",
              fontSize: 15,
            }}
          >
            {t.become} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PartnerCard({
  p,
  verifiedLabel,
  contactLabel,
}: {
  p: Partner;
  verifiedLabel: string;
  contactLabel: string;
}) {
  const catLabel = CATEGORY_LABEL[p.category] || p.category;
  const contactHref = p.whatsapp
    ? `https://wa.me/${p.whatsapp.replace(/\D/g, "")}`
    : p.website
    ? p.website
    : p.instagram
    ? `https://instagram.com/${p.instagram.replace(/^@/, "")}`
    : null;

  return (
    <article
      className="min-w-[280px] max-w-[280px] md:min-w-[300px] md:max-w-[300px] snap-start rounded-2xl overflow-hidden bg-white border border-black/[0.06] flex flex-col"
      style={{ boxShadow: "0 2px 12px rgba(13,27,42,0.06)" }}
    >
      <div
        className="relative h-40 bg-gradient-to-br"
        style={{ background: `linear-gradient(135deg, ${BRAND.teal}20 0%, ${BRAND.ink}10 100%)` }}
      >
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-4xl font-bold"
            style={{ color: BRAND.tealDark, opacity: 0.4 }}
          >
            {p.name.charAt(0)}
          </div>
        )}
        <div
          className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
          style={{ background: "#fff", color: BRAND.tealDark }}
        >
          <ShieldCheck className="h-3 w-3" />
          {verifiedLabel}
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: BRAND.teal }}>
          {catLabel}
        </div>
        <h3 className="text-base font-bold mb-1" style={{ color: BRAND.ink }}>
          {p.name}
        </h3>
        {p.location && (
          <div className="flex items-center gap-1 text-xs mb-2" style={{ color: BRAND.ink, opacity: 0.6 }}>
            <MapPin className="h-3 w-3" />
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
            className="mt-auto inline-flex items-center justify-center gap-1 rounded-full text-xs font-semibold transition-colors"
            style={{
              background: `${BRAND.teal}15`,
              color: BRAND.tealDark,
              minHeight: 36,
              padding: "0 14px",
            }}
          >
            {contactLabel} <ArrowRight className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  );
}
