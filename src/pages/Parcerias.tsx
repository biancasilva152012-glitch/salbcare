import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, FlaskConical, CheckCircle, Send, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import WhatsAppFab from "@/components/WhatsAppFab";

type PartnerType = "farmacia" | "laboratorio";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const UNIT_OPTIONS = ["1 unidade", "2 a 5 unidades", "Mais de 5 unidades"];

const Parcerias = () => {
  const [showForm, setShowForm] = useState(false);
  const [partnerType, setPartnerType] = useState<PartnerType>("farmacia");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    nome_empresa: "",
    cnpj: "",
    cidade: "",
    estado: "",
    nome_responsavel: "",
    whatsapp: "",
    email: "",
    quantidade_unidades: "1 unidade",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const openForm = (type: PartnerType) => {
    setPartnerType(type);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("partner-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome_empresa || !form.email || !form.nome_responsavel || !form.cidade || !form.whatsapp) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setLoading(true);

    // Save to leads_b2b
    await supabase.from("leads_b2b" as any).insert({
      tipo: partnerType,
      nome_empresa: form.nome_empresa,
      cnpj: form.cnpj || null,
      cidade: form.cidade,
      estado: form.estado || null,
      nome_responsavel: form.nome_responsavel,
      whatsapp: form.whatsapp,
      email: form.email,
      quantidade_unidades: form.quantidade_unidades,
    });

    // Also save to partner_interests for backward compat
    await supabase.from("partner_interests" as any).insert({
      company_name: form.nome_empresa,
      cnpj: form.cnpj || null,
      city: form.cidade,
      contact_name: form.nome_responsavel,
      email: form.email,
      phone: form.whatsapp,
      partner_type: partnerType,
    });

    setLoading(false);
    setSubmitted(true);
    toast.success("Interesse enviado com sucesso!");

    // Open WhatsApp notification to admin
    const waMsg = encodeURIComponent(
      `🏪 Novo lead B2B!\n\n` +
      `Tipo: ${partnerType === "farmacia" ? "Farmácia" : "Laboratório"}\n` +
      `Empresa: ${form.nome_empresa}\n` +
      `Cidade: ${form.cidade}\n` +
      `Responsável: ${form.nome_responsavel}\n` +
      `WhatsApp: ${form.whatsapp}\n` +
      `Unidades: ${form.quantidade_unidades}`
    );
    window.open(`https://wa.me/5588996924700?text=${waMsg}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Parcerias para Farmácias e Laboratórios | SALBCARE"
        description="Conecte sua farmácia ou laboratório ao ecossistema SALBCARE. Receba receitas digitais e pedidos de exame de médicos verificados. 60 dias grátis."
        canonical="/parcerias"
      />

      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/pwa-icon-512.png" alt="SALBCARE" className="h-7 w-7" />
            <span className="text-base font-bold text-foreground">SALBCARE</span>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-12">
        {/* Hero */}
        <motion.section variants={stagger} initial="hidden" animate="show" className="text-center space-y-4">
          <motion.h1 variants={fadeUp} className="text-2xl sm:text-3xl font-bold leading-tight">
            Conecte seu negócio ao<br />ecossistema <span className="gradient-text">SALBCARE</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-lg mx-auto">
            Primeiros 60 dias sem custo. Sem contrato de fidelidade.
          </motion.p>
        </motion.section>

        {/* Two Cards */}
        <motion.section variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-2 gap-4">
          {/* Pharmacy */}
          <motion.div
            variants={fadeUp}
            onClick={() => openForm("farmacia")}
            className="cursor-pointer rounded-2xl border border-border bg-card p-6 space-y-4 hover:ring-2 hover:ring-primary/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-3xl">💊</div>
              <div>
                <h3 className="font-semibold text-lg">Para Farmácias</h3>
                <p className="text-[11px] text-muted-foreground">Receitas digitais direto no app</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Sua farmácia conectada a pacientes que acabaram de receber receita médica digital.
            </p>
            <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
              Quero conectar minha farmácia <ArrowRight className="h-4 w-4" />
            </div>
          </motion.div>

          {/* Lab */}
          <motion.div
            variants={fadeUp}
            onClick={() => openForm("laboratorio")}
            className="cursor-pointer rounded-2xl border border-border bg-card p-6 space-y-4 hover:ring-2 hover:ring-primary/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl bg-secondary/10 flex items-center justify-center text-3xl">🧪</div>
              <div>
                <h3 className="font-semibold text-lg">Para Laboratórios</h3>
                <p className="text-[11px] text-muted-foreground">Pedidos de exame digitais</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Receba pedidos de exame digitais de médicos verificados. Direto no app.
            </p>
            <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
              Quero conectar meu laboratório <ArrowRight className="h-4 w-4" />
            </div>
          </motion.div>
        </motion.section>

        {/* Form */}
        <AnimatePresence>
          {showForm && !submitted && (
            <motion.section
              id="partner-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="scroll-mt-8 space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">
                  {partnerType === "farmacia" ? "Conectar Farmácia" : "Conectar Laboratório"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Preencha o formulário e a Bianca vai entrar em contato pessoalmente em até 24h.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                {/* Type toggle */}
                <div className="flex gap-2">
                  {(["farmacia", "laboratorio"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPartnerType(t)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        partnerType === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {t === "farmacia" ? <Pill className="h-4 w-4" /> : <FlaskConical className="h-4 w-4" />}
                      {t === "farmacia" ? "Farmácia" : "Laboratório"}
                    </button>
                  ))}
                </div>

                <Input name="nome_empresa" placeholder="Nome da empresa *" value={form.nome_empresa} onChange={handleChange} required className="bg-accent border-border" />
                <Input name="cnpj" placeholder="CNPJ" value={form.cnpj} onChange={handleChange} className="bg-accent border-border" />
                <div className="grid grid-cols-2 gap-3">
                  <Input name="cidade" placeholder="Cidade *" value={form.cidade} onChange={handleChange} required className="bg-accent border-border" />
                  <Input name="estado" placeholder="Estado" value={form.estado} onChange={handleChange} className="bg-accent border-border" />
                </div>
                <Input name="nome_responsavel" placeholder="Nome do responsável *" value={form.nome_responsavel} onChange={handleChange} required className="bg-accent border-border" />
                <Input name="whatsapp" placeholder="WhatsApp (com DDD) *" value={form.whatsapp} onChange={handleChange} required className="bg-accent border-border" />
                <Input name="email" placeholder="E-mail *" type="email" value={form.email} onChange={handleChange} required className="bg-accent border-border" />

                {/* Units */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Quantas unidades você tem?</p>
                  <div className="flex gap-2 flex-wrap">
                    {UNIT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, quantidade_unidades: opt }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          form.quantidade_unidades === opt
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 gradient-primary text-base font-semibold">
                  {loading ? "Enviando..." : (
                    <><Send className="h-4 w-4 mr-2" /> Quero ser parceiro</>
                  )}
                </Button>
              </form>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Success */}
        {submitted && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center space-y-3">
            <CheckCircle className="h-12 w-12 text-primary mx-auto" />
            <h3 className="text-lg font-semibold">✅ Recebemos seu interesse!</h3>
            <p className="text-sm text-muted-foreground">
              A Bianca vai entrar em contato pessoalmente em até 24h pelo WhatsApp informado.
            </p>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center space-y-1 pt-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            A SALBCARE é uma plataforma de gestão e não substitui orientação médica, jurídica ou contábil profissional.
          </p>
          <p className="text-[10px] text-muted-foreground/60">Powered by SALBCARE</p>
        </div>
      </div>

      <WhatsAppFab />
    </div>
  );
};

export default Parcerias;
