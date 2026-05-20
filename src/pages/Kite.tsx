import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import KiteBookingModal, { type KiteProcedure } from "@/components/kite/KiteBookingModal";

const BOOKING_FEE = 50;

const DENTAL: (KiteProcedure & { eu: number })[] = [
  { id: "dental-cleaning",  label: "Cleaning & Check-up",   type: "presencial", amountCharged: BOOKING_FEE, totalPrice: 180, eu: 120 },
  { id: "dental-whitening", label: "Teeth Whitening",       type: "presencial", amountCharged: BOOKING_FEE, totalPrice: 480, eu: 350 },
  { id: "dental-exam",      label: "Complete Oral Exam",    type: "presencial", amountCharged: BOOKING_FEE, totalPrice: 120, eu: 90 },
];

const PHYSIO: (KiteProcedure & { eu: number })[] = [
  { id: "physio-kite-recovery", label: "Kite Recovery Session",            type: "presencial", amountCharged: BOOKING_FEE, totalPrice: 200, eu: 90 },
  { id: "physio-massage",       label: "Sports Massage (60 min)",          type: "presencial", amountCharged: BOOKING_FEE, totalPrice: 180, eu: 80 },
  { id: "physio-postural",      label: "Postural Assessment",              type: "presencial", amountCharged: BOOKING_FEE, totalPrice: 160, eu: 70 },
  { id: "physio-package",       label: "Full Recovery Package (3 sessions)", type: "presencial", amountCharged: BOOKING_FEE, totalPrice: 480, eu: 240 },
];

const ONLINE: KiteProcedure[] = [
  { id: "telehealth-psychology",    label: "Psychology",                  type: "online", amountCharged: 280, totalPrice: 280 },
  { id: "telehealth-nutrition",     label: "Nutrition",                   type: "online", amountCharged: 220, totalPrice: 220 },
  { id: "telehealth-physio-online", label: "Physiotherapy (online)",      type: "online", amountCharged: 240, totalPrice: 240 },
  { id: "telehealth-medicine",      label: "General Medicine",            type: "online", amountCharged: 200, totalPrice: 200 },
];

export default function Kite() {
  const [scrolled, setScrolled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<KiteProcedure | null>(null);

  useEffect(() => {
    // Capture pousada ref
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      const safe = ref.slice(0, 64);
      try { localStorage.setItem("pousada_ref", safe); } catch {}
      // Track scan once per session
      try {
        const flag = `qr_scan_tracked_${safe}`;
        if (!sessionStorage.getItem(flag)) {
          sessionStorage.setItem(flag, "1");
          import("@/integrations/supabase/client").then(({ supabase }) => {
            supabase.rpc("increment_qr_scan" as any, { _slug: safe }).then(() => {});
          });
        }
      } catch {}
    }
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openBooking = (p: KiteProcedure) => {
    setSelected(p);
    setModalOpen(true);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f7f3ee", color: "#1a1612" }}>
      <Helmet>
        <html lang="en" />
        <title>SalbDental — World-class care while you kite | Ilha do Guajiru</title>
        <meta name="description" content="Dental, physiotherapy and online consultations in English for kitesurfers and expats in Ilha do Guajiru, Ceará. Fraction of European prices." />
        <link rel="canonical" href="https://salbcare.com/kite" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
        <meta property="og:title" content="SalbDental — World-class care while you kite" />
        <meta property="og:description" content="Dental, physio and telehealth in English. Ilha do Guajiru, Ceará." />
        <meta property="og:url" content="https://salbcare.com/kite" />
      </Helmet>

      <style>{`
        .kite-card { transition: transform .2s ease, box-shadow .2s ease; }
        .kite-card:hover { transform: translateY(-4px); box-shadow: 0 14px 30px -12px rgba(26,22,18,0.18); }
        .kite-h { font-family: 'Playfair Display', Georgia, serif; }
      `}</style>

      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all ${
          scrolled ? "bg-white/90 backdrop-blur border-b border-black/5 shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <a href="#top" className="text-xl font-bold tracking-tight" style={{ color: scrolled ? "#1a1612" : "#fff" }}>
            Salb<span style={{ color: "#2c6e49" }}>Dental</span>
          </a>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium" style={{ color: scrolled ? "#1a1612" : "#fff" }}>
            <button onClick={() => scrollTo("dental")} className="hover:opacity-70">Dental</button>
            <button onClick={() => scrollTo("physio")} className="hover:opacity-70">Physio</button>
            <button onClick={() => scrollTo("online")} className="hover:opacity-70">Telehealth</button>
            <button
              onClick={() => scrollTo("services")}
              className="px-4 py-2 rounded-full bg-[#2c6e49] text-white hover:bg-[#1a3a2a]"
            >
              Book Now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        id="top"
        className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-5"
        style={{ background: "linear-gradient(135deg, #1a3a2a 0%, #2c6e49 100%)", color: "#fff" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-medium mb-6">
            📍 Ilha do Guajiru, Ceará — Brazil
          </span>
          <h1 className="kite-h text-4xl md:text-6xl font-bold leading-tight mb-5">
            World-class care.<br />While you kite.
          </h1>
          <p className="text-base md:text-lg text-white/85 max-w-2xl mx-auto mb-8">
            Dental, physiotherapy and telehealth — in English, at a fraction of European prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => scrollTo("dental")}
              className="px-7 py-3 rounded-full bg-white text-[#1a3a2a] font-semibold hover:bg-white/90"
            >
              Book In-Person →
            </button>
            <button
              onClick={() => scrollTo("online")}
              className="px-7 py-3 rounded-full bg-transparent border border-white/60 text-white font-semibold hover:bg-white/10"
            >
              Online Consultation
            </button>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/75">
            <span>European patients</span>
            <span>·</span>
            <span>English & Spanish</span>
            <span>·</span>
            <span>International cards</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section id="services" className="px-5 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="dental">
            <TabsList className="grid grid-cols-3 w-full max-w-2xl mx-auto mb-10 bg-white border border-black/5 p-1 rounded-full h-auto">
              <TabsTrigger value="dental" className="rounded-full data-[state=active]:bg-[#2c6e49] data-[state=active]:text-white py-2.5 text-sm md:text-base">🦷 Dental</TabsTrigger>
              <TabsTrigger value="physio" className="rounded-full data-[state=active]:bg-[#2c6e49] data-[state=active]:text-white py-2.5 text-sm md:text-base">💆 Physio</TabsTrigger>
              <TabsTrigger value="online" className="rounded-full data-[state=active]:bg-[#2c6e49] data-[state=active]:text-white py-2.5 text-sm md:text-base">💻 Online</TabsTrigger>
            </TabsList>

            {/* DENTAL */}
            <TabsContent value="dental" id="dental">
              <div className="grid md:grid-cols-3 gap-5">
                {DENTAL.map((p) => (
                  <ProcedureCard key={p.id} p={p} onBook={openBooking} euPrice={p.eu} />
                ))}
              </div>
              <InfoBanner kind="presencial" />
            </TabsContent>

            {/* PHYSIO */}
            <TabsContent value="physio" id="physio">
              <p className="text-center max-w-2xl mx-auto text-[#5a564f] mb-8">
                Sore shoulders? Tired back? Our physiotherapist specializes in kite-related recovery and sports massage.
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                {PHYSIO.map((p) => (
                  <ProcedureCard key={p.id} p={p} onBook={openBooking} euPrice={p.eu} />
                ))}
              </div>
              <InfoBanner kind="presencial" />
            </TabsContent>

            {/* ONLINE */}
            <TabsContent value="online" id="online">
              <p className="text-center max-w-2xl mx-auto text-[#5a564f] mb-8">
                Full payment now · Google Meet link sent within 2 hours · From your room.
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                {ONLINE.map((p) => (
                  <ProcedureCard key={p.id} p={p} onBook={openBooking} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: "#1a1612", color: "#f7f3ee" }} className="px-5 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="kite-h text-3xl md:text-4xl text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-white/10 rounded-2xl p-8">
              <p className="text-xs uppercase tracking-widest text-[#2c6e49] mb-3 font-semibold">In-person</p>
              <ol className="space-y-3 text-white/85">
                <li>1. Choose your procedure</li>
                <li>2. Pay R$ 50 booking fee</li>
                <li>3. Show up at the clinic</li>
                <li>4. Pay the remaining balance</li>
              </ol>
            </div>
            <div className="border border-white/10 rounded-2xl p-8">
              <p className="text-xs uppercase tracking-widest text-[#2c6e49] mb-3 font-semibold">Online</p>
              <ol className="space-y-3 text-white/85">
                <li>1. Choose your consultation</li>
                <li>2. Pay in full</li>
                <li>3. Receive your Google Meet link</li>
                <li>4. Join from anywhere</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-5 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="kite-h text-3xl md:text-4xl text-center mb-12">What kitesurfers say</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Lars M.", flag: "🇩🇪", text: "Quick cleaning between sessions. English-speaking dentist, super clean clinic, paid €30 instead of €120 back home." },
              { name: "Sophie T.", flag: "🇫🇷", text: "Booked an online consultation from my pousada. Got the Meet link in less than an hour. Felt heard." },
              { name: "Pieter V.", flag: "🇳🇱", text: "Crashed hard, shoulder was wrecked. Three physio sessions later I was back on the water." },
            ].map((t) => (
              <div key={t.name} className="bg-white border border-black/5 rounded-2xl p-6">
                <p className="text-[#1a1612]/85 mb-4 leading-relaxed">"{t.text}"</p>
                <p className="text-sm font-semibold">{t.name} <span className="ml-1">{t.flag}</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-20" style={{ background: "linear-gradient(135deg, #1a3a2a 0%, #2c6e49 100%)" }}>
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="kite-h text-3xl md:text-5xl mb-8">Book your appointment today.</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => scrollTo("dental")} className="px-6 py-3 rounded-full bg-white text-[#1a3a2a] font-semibold hover:bg-white/90">🦷 Dental</button>
            <button onClick={() => scrollTo("physio")} className="px-6 py-3 rounded-full bg-white text-[#1a3a2a] font-semibold hover:bg-white/90">💆 Physio</button>
            <button onClick={() => scrollTo("online")} className="px-6 py-3 rounded-full bg-white text-[#1a3a2a] font-semibold hover:bg-white/90">💻 Online</button>
          </div>
        </div>
      </section>

      <footer style={{ background: "#1a1612", color: "#f7f3ee" }} className="px-5 py-10 text-center text-sm">
        SalbDental by SalbCare · Ilha do Guajiru · salbcare.com
      </footer>

      <KiteBookingModal open={modalOpen} onOpenChange={setModalOpen} procedure={selected} />
    </div>
  );
}

function ProcedureCard({
  p,
  onBook,
  euPrice,
}: {
  p: KiteProcedure;
  onBook: (p: KiteProcedure) => void;
  euPrice?: number;
}) {
  const isOnline = p.type === "online";
  return (
    <div className="kite-card bg-white border border-black/5 rounded-2xl p-6 flex flex-col">
      <h3 className="kite-h text-xl mb-3 text-[#1a1612]">{p.label}</h3>
      <div className="mb-4">
        <p className="text-2xl font-bold text-[#1a1612]">
          R$ {p.totalPrice}
          <span className="text-sm font-normal text-[#5a564f] ml-1">total</span>
        </p>
        {euPrice && (
          <p className="text-sm text-gray-400 line-through mt-0.5">€{euPrice} in Europe</p>
        )}
      </div>
      <div className="mb-5">
        {isOnline ? (
          <span className="inline-block px-2 py-1 rounded bg-[#2c6e49]/10 text-[#2c6e49] text-xs font-semibold">
            Full payment
          </span>
        ) : (
          <span className="inline-block px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-semibold">
            R$50 now + rest at clinic
          </span>
        )}
      </div>
      <button
        onClick={() => onBook(p)}
        className="mt-auto w-full px-4 py-3 rounded-full bg-[#2c6e49] text-white font-semibold hover:bg-[#1a3a2a] transition"
      >
        {isOnline ? `Book & Pay R$ ${p.amountCharged} →` : `Reserve for R$ ${p.amountCharged} →`}
      </button>
    </div>
  );
}

function InfoBanner({ kind }: { kind: "presencial" }) {
  return (
    <div className="mt-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 px-5 py-4 text-sm text-center">
      Your R$ 50 secures the appointment. Pay the remaining balance at the clinic on the day of your visit.
    </div>
  );
}
