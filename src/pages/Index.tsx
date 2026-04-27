import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X, FileText, Search, Video, UserPlus, Globe, LayoutDashboard, Shield } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SEOHead from "@/components/SEOHead";
import { useState } from "react";
import testimonialSarah from "@/assets/testimonial-sarah.jpeg";
import testimonialMayara from "@/assets/testimonial-mayara.jpeg";
import testimonialCinara from "@/assets/testimonial-cinara.jpeg";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <SEOHead
        title="SalbCare | Gestão e Saúde"
        description="Consultório digital para profissionais de saúde autônomos. Agenda, prontuário, teleconsulta e mentoria financeira. Sem comissão. Cancele quando quiser."
        canonical="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "SalbCare",
          url: "https://salbcare.com.br",
          description: "Consultório digital para profissionais de saúde. Sem comissão.",
          applicationCategory: "HealthApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "89", priceCurrency: "BRL" },
        }}
      />

      <style>{`
        .salb-headline { font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
        .salb-sub { font-weight: 500; letter-spacing: -0.01em; }
        .salb-label { font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; }
        .salb-nav-link { position: relative; color: #374151; transition: color 200ms ease; }
        .salb-nav-link:hover { color: #00B4A0; }
        .salb-nav-link::after {
          content: ''; position: absolute; left: 0; bottom: -4px;
          width: 100%; height: 2px; background: #00B4A0;
          transform: scaleX(0); transform-origin: left center;
          transition: transform 250ms ease;
        }
        .salb-nav-link:hover::after { transform: scaleX(1); }
        .salb-cta-primary {
          background: #00B4A0; color: #fff; font-weight: 700;
          border-radius: 12px; padding: 16px 32px;
          box-shadow: 0 8px 24px rgba(0,180,160,0.30);
          transition: all 200ms ease;
        }
        .salb-cta-primary:hover {
          background: #00CDB8; transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0,180,160,0.36);
        }
        .salb-feature-card {
          background: #fff; border-radius: 16px; padding: 28px;
          border: 1px solid #F0F0F0;
          box-shadow: 0 2px 8px rgba(0,180,160,0.06);
          transition: all 250ms ease;
        }
        .salb-feature-card:hover {
          border-color: #00B4A0;
          box-shadow: 0 8px 32px rgba(0,180,160,0.12);
          transform: translateY(-4px);
        }
        .salb-feature-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: #E6F7F6; display: flex; align-items: center; justify-content: center;
        }
        .salb-feature-icon svg { width: 24px; height: 24px; color: #00B4A0; }
        .salb-testimonial-avatar {
          width: 52px; height: 52px; border-radius: 50%;
          border: 2px solid #00B4A0; object-fit: cover;
          box-shadow: 0 2px 8px rgba(0,180,160,0.20);
        }
      `}</style>

      <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
        {/* ── Navbar ── */}
        <nav
          className="sticky top-0 z-50"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid #F0F0F0',
          }}
        >
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="h-5 w-5" style={{ color: '#00B4A0' }} strokeWidth={2.5} />
              <span style={{ fontWeight: 800, color: '#0D1B2A', letterSpacing: '-0.01em' }} className="text-lg">SALBCARE</span>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              <Link to="/para-profissionais" className="salb-nav-link text-sm font-medium">Para Profissionais</Link>
              <Link to="/planos" className="salb-nav-link text-sm font-medium">Planos</Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold rounded-[12px] px-5 py-2 transition-all duration-200"
                style={{ border: '1.5px solid #00B4A0', color: '#00B4A0' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#00B4A0'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#00B4A0'; }}
              >
                Já tenho conta
              </Link>
              <Link
                to="/experimente"
                className="salb-cta-primary text-sm"
                style={{ padding: '10px 22px', display: 'inline-flex', alignItems: 'center' }}
              >
                Testar agora
              </Link>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu" style={{ color: '#0D1B2A' }}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="md:hidden px-4 py-4 space-y-3"
              style={{ borderTop: '1px solid #F0F0F0', background: '#fff' }}
            >
              <Link to="/para-profissionais" onClick={() => setMobileMenuOpen(false)} className="block text-sm" style={{ color: '#374151' }}>Para Profissionais</Link>
              <Link to="/planos" onClick={() => setMobileMenuOpen(false)} className="block text-sm" style={{ color: '#374151' }}>Planos</Link>
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/login"
                  className="text-sm font-semibold rounded-[12px] px-5 py-3 text-center"
                  style={{ border: '1.5px solid #00B4A0', color: '#00B4A0' }}
                >
                  Já tenho conta
                </Link>
                <Link to="/experimente" className="salb-cta-primary text-sm text-center" style={{ padding: '12px 22px' }}>
                  Testar agora
                </Link>
              </div>
            </motion.div>
          )}
        </nav>

        {/* ── Hero Section ── */}
        <section
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #F0FAFA 0%, #FFFFFF 70%)',
          }}
        >
          {/* Decorative blur circle */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '-100px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(0,180,160,0.13), transparent 70%)',
              filter: 'blur(80px)',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />

          <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 pt-16 pb-16 sm:pt-28 sm:pb-24">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="text-center max-w-2xl mx-auto space-y-6"
            >
              <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
                <img src="/pwa-icon-512.png" alt="SalbCare" className="h-14 w-14 object-contain" />
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="salb-headline"
                style={{ fontSize: 'clamp(40px, 6vw, 64px)', color: '#0D1B2A' }}
              >
                Sua <span style={{ color: '#00B4A0' }}>vitrine</span> para pacientes.
                <br />
                Seu <span style={{ color: '#00B4A0' }}>controle</span> para gestão.
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="salb-sub mx-auto"
                style={{ fontSize: '17px', color: '#374151', maxWidth: '480px', lineHeight: 1.6 }}
              >
                Organize seus primeiros 10 pacientes sem custo. Gestão completa, mentoria financeira e visibilidade para pacientes.
              </motion.p>

              {/* Three value props as cards */}
              <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
                {[
                  { icon: FileText, label: "Carnê-Leão preenchido automático" },
                  { icon: Search, label: "Pacientes te encontram sem comissão" },
                  { icon: Video, label: "Teleconsulta legal pelo Google Meet" },
                ].map((f) => (
                  <div key={f.label} className="salb-feature-card flex flex-col gap-3">
                    <div className="salb-feature-icon">
                      <f.icon />
                    </div>
                    <span style={{ fontWeight: 700, color: '#0D1B2A', fontSize: '14px', lineHeight: 1.4 }}>{f.label}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link to="/experimente" className="salb-cta-primary inline-flex items-center gap-2 text-base">
                  Testar agora
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  className="text-sm font-medium px-4 py-3 rounded-[12px] transition-colors"
                  style={{ color: '#374151' }}
                  onClick={() => {
                    document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Como funciona?
                </button>
              </motion.div>
              <motion.p variants={fadeUp} className="text-xs" style={{ color: '#9CA3AF' }}>
                Sem login. Sem cartão. Use a plataforma agora e crie conta quando gostar.
              </motion.p>

              {/* IA Mentora Preview */}
              <motion.div variants={fadeUp} className="pt-6 max-w-xs mx-auto">
                <p className="salb-label mb-3" style={{ color: '#00B4A0' }}>IA Mentora em ação</p>
                <div
                  className="p-4 space-y-3 text-left"
                  style={{
                    background: '#fff',
                    border: '1px solid #F0F0F0',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(13,27,42,0.06)',
                  }}
                >
                  <div className="flex gap-2 items-start">
                    <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E6F7F6' }}>
                      <span className="text-[10px] font-bold" style={{ color: '#00B4A0' }}>IA</span>
                    </div>
                    <p className="text-xs leading-relaxed px-3 py-2 rounded-xl rounded-tl-none" style={{ color: '#374151', background: '#F7F9FA' }}>
                      Você teve mais consultas esse mês! Quer que eu mostre onde investir o dinheiro extra para lucrar ainda mais?
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <p className="text-xs px-3 py-2 rounded-xl rounded-tr-none" style={{ color: '#0D1B2A', background: '#E6F7F6' }}>
                      Sim, me mostre
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        <section style={{ background: '#00B4A0' }} className="py-12">
          <div className="mx-auto max-w-4xl px-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { value: "9+", label: "especialidades" },
              { value: "100%", label: "Você fica com 100% do valor. Sem comissão." },
              { value: "Grátis", label: "para começar, sem cartão" },
            ].map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="space-y-1"
              >
                <p style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{s.value}</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Como Funciona ── */}
        <section id="como-funciona" className="py-16 sm:py-24" style={{ background: '#F7F9FA' }}>
          <div className="mx-auto max-w-5xl px-5 sm:px-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="salb-headline text-center mb-12"
              style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', color: '#0D1B2A' }}
            >
              Como funciona
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  icon: UserPlus,
                  title: "Cadastre seus dados de forma prática",
                  desc: "Tenha todo o seu diagnóstico financeiro na palma da mão",
                },
                {
                  step: "2",
                  icon: Globe,
                  title: "Pacientes te encontram",
                  desc: "Seu perfil aparece no diretório público da SalbCare sem custo por lead",
                },
                {
                  step: "3",
                  icon: LayoutDashboard,
                  title: "Gerencie tudo em um lugar",
                  desc: "Agenda, prontuário, receitas e financeiro na mesma plataforma",
                },
              ].map((item) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Number(item.step) * 0.1, duration: 0.4 }}
                  className="salb-feature-card space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                      style={{ background: '#E6F7F6', color: '#00B4A0', fontWeight: 800 }}
                    >
                      {item.step}
                    </span>
                    <div className="salb-feature-icon" style={{ width: 40, height: 40 }}>
                      <item.icon />
                    </div>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0D1B2A', letterSpacing: '-0.01em' }}>{item.title}</h3>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Prova Social ── */}
        <section className="py-16 sm:py-24" style={{ background: '#FFFFFF' }}>
          <div className="mx-auto max-w-5xl px-5 sm:px-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="salb-headline text-center mb-12"
              style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', color: '#0D1B2A' }}
            >
              O que dizem nossos profissionais
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  photo: testimonialSarah,
                  name: "Dra. Sarah T.",
                  role: "Médica",
                  quote: "Finalmente uma plataforma que não fica com parte das minhas consultas.",
                },
                {
                  photo: testimonialMayara,
                  name: "Vitória F.",
                  role: "Dentista",
                  quote: "Configurei tudo em uma tarde. Já recebi meus primeiros pacientes.",
                },
                {
                  photo: testimonialCinara,
                  name: "Cinara C.",
                  role: "Nutricionista",
                  quote: "O Carnê-Leão sozinho já vale a assinatura inteira.",
                },
              ].map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="salb-feature-card space-y-5"
                >
                  <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.6, fontStyle: 'italic' }}>
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <img src={t.photo} alt={t.name} className="salb-testimonial-avatar" />
                    <div className="flex flex-col">
                      <span style={{ fontWeight: 700, color: '#0D1B2A', fontSize: '14px' }}>{t.name}</span>
                      <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{t.role}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Prova Social Final / CTA ── */}
        <section className="relative overflow-hidden py-20 sm:py-28" style={{ background: '#0D1B2A' }}>
          {/* Decorative teal blurs */}
          <div
            aria-hidden
            style={{
              position: 'absolute', top: '-150px', left: '-150px',
              width: '400px', height: '400px',
              background: 'radial-gradient(circle, rgba(0,180,160,0.45), transparent 70%)',
              opacity: 0.15, filter: 'blur(80px)', pointerEvents: 'none',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute', bottom: '-150px', right: '-150px',
              width: '400px', height: '400px',
              background: 'radial-gradient(circle, rgba(0,180,160,0.45), transparent 70%)',
              opacity: 0.15, filter: 'blur(80px)', pointerEvents: 'none',
            }}
          />
          <div className="relative z-10 mx-auto max-w-3xl px-5 sm:px-6 text-center space-y-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="salb-headline"
              style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#FFFFFF' }}
            >
              Profissionais de saúde autônomos já usam a SalbCare para atender sem pagar comissão
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <Link
                to="/planos"
                className="inline-flex items-center gap-2 text-base"
                style={{
                  background: '#00B4A0', color: '#fff', fontWeight: 700,
                  borderRadius: '12px', padding: '16px 32px',
                  boxShadow: '0 8px 32px rgba(0,180,160,0.40)',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#00CDB8'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#00B4A0'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                Começar grátis por 7 dias
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 sm:py-24" style={{ background: '#FFFFFF' }}>
          <div className="mx-auto max-w-2xl px-5 sm:px-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="salb-headline text-center mb-10"
              style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', color: '#0D1B2A' }}
            >
              Perguntas frequentes
            </motion.h2>
            <Accordion type="single" collapsible className="space-y-3">
              {[
                {
                  q: "O que é a SalbCare?",
                  a: "A SalbCare é uma plataforma de gestão integrada para profissionais de saúde autônomos, unindo prontuário digital, teleconsulta via Google Meet e mentoria financeira.",
                },
                {
                  q: "Preciso pagar para começar?",
                  a: "Não. Você pode cadastrar até 10 pacientes gratuitamente, sem cartão de crédito. O upgrade é opcional e só acontece quando você precisar.",
                },
                {
                  q: "A plataforma cobra comissão por consulta?",
                  a: "Não. Cobramos apenas uma assinatura mensal fixa. 100% do valor das suas consultas vai direto para você.",
                },
                {
                  q: "Preciso instalar algum software?",
                  a: "Não, a SalbCare é 100% baseada na nuvem e pode ser acessada de qualquer navegador ou dispositivo móvel.",
                },
                {
                  q: "Meus dados e dos meus pacientes estão seguros?",
                  a: "Sim, utilizamos criptografia e seguimos rigorosamente as normas da LGPD para garantir a segurança total das informações.",
                },
              ].map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="px-5"
                  style={{ border: '1px solid #F0F0F0', borderRadius: '16px', background: '#fff' }}
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4" style={{ fontSize: '15px', fontWeight: 700, color: '#0D1B2A' }}>
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4" style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="py-10" style={{ background: '#0D1B2A' }}>
          <div className="mx-auto max-w-6xl px-4 text-center space-y-4">
            <p style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>SALBCARE</p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs" style={{ color: '#9CA3AF' }}>
              <Link to="/terms" className="transition-colors hover:text-white">Termos</Link>
              <Link to="/privacy" className="transition-colors hover:text-white">Privacidade</Link>
              <Link to="/planos" className="transition-colors hover:text-white">Planos</Link>
              <Link to="/para-profissionais" className="transition-colors hover:text-white">Para Profissionais</Link>
              <Link to="/blog" className="transition-colors hover:text-white">Blog</Link>
            </div>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>© {new Date().getFullYear()} SalbCare. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
