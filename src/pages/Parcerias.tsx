import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, FlaskConical, Pill, CheckCircle, Send, ArrowRight, Stethoscope, FileText, TestTube, ShoppingBag, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";

const ECOSYSTEM_STEPS = [
  { icon: Stethoscope, label: "Triagem", desc: "IA indica a especialidade certa" },
  { icon: FileText, label: "Consulta", desc: "Teleconsulta com profissional verificado" },
  { icon: Pill, label: "Receita", desc: "Receita digital emitida no app" },
  { icon: TestTube, label: "Exames", desc: "Agendamento com desconto em labs parceiros" },
  { icon: ShoppingBag, label: "Medicamentos", desc: "Desconto na farmácia parceira" },
  { icon: RotateCcw, label: "Retorno", desc: "Acompanhamento contínuo no ecossistema" },
];

type PartnerType = "farmacia" | "laboratorio";

const Parcerias = () => {
  const [partnerType, setPartnerType] = useState<PartnerType>("farmacia");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    cnpj: "",
    city: "",
    contact_name: "",
    email: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.email || !form.contact_name || !form.city) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("partner_interests" as any).insert({
      ...form,
      partner_type: partnerType,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    }
    setSubmitted(true);
    toast.success("Interesse enviado com sucesso!");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Parcerias B2B | SalbCare"
        description="Faça parte do ecossistema SALBCARE. Farmácias e laboratórios parceiros conectados a profissionais de saúde e pacientes."
        canonical="/parcerias"
      />

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* Hero */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            O ecossistema completo de saúde
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            De A a Z, a saúde do paciente em um único lugar. Conecte sua farmácia ou laboratório a milhares de profissionais e pacientes verificados.
          </p>
        </motion.section>

        {/* Ecosystem Timeline */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-center">Jornada completa do paciente</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {ECOSYSTEM_STEPS.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center text-center p-3 rounded-xl bg-card border border-border space-y-2"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-semibold">{step.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{step.desc}</p>
                {i < ECOSYSTEM_STEPS.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40 hidden md:block absolute -right-3 top-1/2" />
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Partner Cards */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Pharmacies */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-border bg-card p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pill className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Para Farmácias</h3>
                <p className="text-xs text-muted-foreground">Alcance pacientes no momento certo</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Seus produtos nas mãos de quem acabou de receber uma receita médica digital. Alcance pacientes qualificados no momento exato em que precisam dos medicamentos.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Apareça no diretório de farmácias parceiras</li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Receba receitas digitais verificadas</li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Badge "Parceira Oficial SALBCARE"</li>
            </ul>
            <div className="flex gap-3 pt-2">
              <div className="flex-1 rounded-lg border border-border p-3 text-center">
                <p className="text-lg font-bold">R$ 199</p>
                <p className="text-[10px] text-muted-foreground">Plano Básico /mês</p>
              </div>
              <div className="flex-1 rounded-lg border border-primary/50 bg-primary/5 p-3 text-center">
                <p className="text-lg font-bold text-primary">R$ 399</p>
                <p className="text-[10px] text-muted-foreground">Plano Destaque /mês</p>
              </div>
            </div>
            <Button
              className="w-full gradient-primary"
              onClick={() => {
                setPartnerType("farmacia");
                document.getElementById("partner-form")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Quero ser farmácia parceira
            </Button>
          </motion.div>

          {/* Labs */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-border bg-card p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FlaskConical className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Para Laboratórios</h3>
                <p className="text-xs text-muted-foreground">Pedidos de exame direto no app</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Receba pedidos de exame digitais de médicos verificados e agende diretamente pelo app com o paciente. Sem papel, sem intermediários.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Apareça no diretório de laboratórios</li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Receba agendamentos qualificados</li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Envie resultados direto ao paciente</li>
            </ul>
            <div className="flex gap-3 pt-2">
              <div className="flex-1 rounded-lg border border-border p-3 text-center">
                <p className="text-lg font-bold">R$ 299</p>
                <p className="text-[10px] text-muted-foreground">Listagem /mês</p>
              </div>
              <div className="flex-1 rounded-lg border border-primary/50 bg-primary/5 p-3 text-center">
                <p className="text-lg font-bold text-primary">R$ 599</p>
                <p className="text-[10px] text-muted-foreground">Destaque /mês</p>
              </div>
            </div>
            <Button
              className="w-full gradient-primary"
              onClick={() => {
                setPartnerType("laboratorio");
                document.getElementById("partner-form")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Quero ser laboratório parceiro
            </Button>
          </motion.div>
        </section>

        {/* Interest Form */}
        <section id="partner-form" className="scroll-mt-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Envie seu interesse</h2>
            <p className="text-sm text-muted-foreground">
              Preencha o formulário e nossa equipe entrará em contato para fechar a parceria.
            </p>
          </div>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center space-y-3">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Interesse enviado!</h3>
              <p className="text-sm text-muted-foreground">
                Nossa equipe entrará em contato em breve para finalizar a parceria.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
              {/* Type selector */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPartnerType("farmacia")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    partnerType === "farmacia"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Pill className="h-4 w-4" /> Farmácia
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerType("laboratorio")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    partnerType === "laboratorio"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <FlaskConical className="h-4 w-4" /> Laboratório
                </button>
              </div>

              <Input name="company_name" placeholder="Nome da empresa *" value={form.company_name} onChange={handleChange} required className="bg-accent border-border" />
              <Input name="cnpj" placeholder="CNPJ" value={form.cnpj} onChange={handleChange} className="bg-accent border-border" />
              <Input name="city" placeholder="Cidade *" value={form.city} onChange={handleChange} required className="bg-accent border-border" />
              <Input name="contact_name" placeholder="Nome do responsável *" value={form.contact_name} onChange={handleChange} required className="bg-accent border-border" />
              <Input name="email" placeholder="E-mail *" type="email" value={form.email} onChange={handleChange} required className="bg-accent border-border" />
              <Input name="phone" placeholder="Telefone" value={form.phone} onChange={handleChange} className="bg-accent border-border" />

              <Button type="submit" disabled={loading} className="w-full gradient-primary">
                {loading ? "Enviando..." : (
                  <><Send className="h-4 w-4 mr-2" /> Enviar interesse</>
                )}
              </Button>
            </form>
          )}
        </section>

        {/* Footer */}
        <div className="text-center space-y-1 pt-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            A SALBCARE é uma plataforma de gestão e não substitui orientação médica, jurídica ou contábil profissional.
          </p>
          <p className="text-[10px] text-muted-foreground/60">Powered by SALBCARE</p>
        </div>
      </div>
    </div>
  );
};

export default Parcerias;
