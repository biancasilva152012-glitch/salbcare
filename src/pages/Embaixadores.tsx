import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Users, Star, Megaphone, BadgeCheck, ArrowRight, Loader2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";

const MAX_SPOTS = 200;

const benefits = [
  {
    icon: Gift,
    title: "1 mês grátis imediato",
    desc: "Ao ser aprovado como embaixador, você ganha 1 mês grátis na sua assinatura.",
  },
  {
    icon: Users,
    title: "+2 meses por indicação",
    desc: "Para cada colega que assinar com seu cupom, você ganha +2 meses grátis (até 3 conversões = 6 meses extras).",
  },
  {
    icon: Star,
    title: "30% de desconto para seu colega",
    desc: "Quem usar seu cupom ganha 30% de desconto no primeiro mês — fácil de convencer!",
  },
  {
    icon: BadgeCheck,
    title: "Badge de Embaixador Oficial",
    desc: "Destaque exclusivo no seu perfil + materiais prontos para postar nas redes sociais.",
  },
];

export default function Embaixadores() {
  const { user } = useAuth();
  const [spotsTaken, setSpotsTaken] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", social_media: "", motivation: "" });
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  useEffect(() => {
    supabase.rpc("get_ambassador_spots_taken").then(({ data }) => {
      setSpotsTaken(typeof data === "number" ? data : 0);
    });
  }, []);

  const spotsLeft = spotsTaken !== null ? Math.max(0, MAX_SPOTS - spotsTaken) : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Faça login para se candidatar.");
      return;
    }
    if (!form.name || !form.email) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("ambassador_applications").insert({
        user_id: user.id,
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        social_media: form.social_media || null,
        motivation: form.motivation || null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Candidatura enviada com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar candidatura.");
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = async () => {
    if (!waitlistEmail) {
      toast.error("Informe seu e-mail.");
      return;
    }
    setWaitlistLoading(true);
    try {
      const { error } = await supabase.from("ambassador_waitlist").insert({ email: waitlistEmail });
      if (error) {
        if (error.code === "23505") {
          toast.info("Você já está na lista de espera!");
        } else {
          throw error;
        }
      } else {
        toast.success("Você entrou na lista de espera!");
        setWaitlistEmail("");
      }
    } catch {
      toast.error("Erro ao entrar na lista de espera.");
    } finally {
      setWaitlistLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Seja um Embaixador SalbCare"
        description="Indique colegas, ganhe meses grátis e cresça junto com a SalbCare. Programa de embaixadores com benefícios exclusivos."
      />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 pt-16 pb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="relative max-w-2xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Megaphone className="h-4 w-4" />
                Programa de Embaixadores
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Seja um Embaixador SalbCare
              </h1>
              <p className="text-xl md:text-2xl font-semibold text-primary mb-4">
                Indique. Ganhe. Cresça junto.
              </p>
              <p className="text-muted-foreground text-base max-w-md mx-auto mb-8">
                Ajude colegas a conhecer a SalbCare e ganhe até 7 meses grátis de assinatura.
              </p>
            </motion.div>

            {/* Spots Counter */}
            {spotsLeft !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-6 py-3 mb-8 shadow-sm"
              >
                <span className="text-2xl font-bold text-primary">{spotsLeft}</span>
                <span className="text-sm text-muted-foreground">vagas restantes de {MAX_SPOTS}</span>
              </motion.div>
            )}

            {/* CTA Button */}
            {!isFull ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <Button
                  size="lg"
                  className="gradient-primary font-semibold gap-2 px-8"
                  onClick={() => setShowModal(true)}
                >
                  Quero ser Embaixador <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-3">
                <p className="text-sm text-muted-foreground">Todas as vagas foram preenchidas. Entre na lista de espera:</p>
                <div className="flex gap-2 max-w-sm mx-auto">
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                  />
                  <Button onClick={handleWaitlist} disabled={waitlistLoading}>
                    {waitlistLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar na lista"}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Benefits */}
        <section className="px-4 pb-16">
          <div className="max-w-3xl mx-auto grid gap-4 sm:grid-cols-2">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="glass-card p-5 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">{b.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Application Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{submitted ? "Candidatura Enviada!" : "Candidatura de Embaixador"}</DialogTitle>
            </DialogHeader>

            {submitted ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Sua candidatura foi recebida! Analisaremos em até 48h e você receberá um e-mail com o resultado.
                </p>
                <Button variant="outline" onClick={() => setShowModal(false)}>Fechar</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="amb-name">Nome completo *</Label>
                  <Input id="amb-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="amb-email">E-mail *</Label>
                  <Input id="amb-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="amb-phone">WhatsApp</Label>
                  <Input id="amb-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <Label htmlFor="amb-social">Instagram / LinkedIn</Label>
                  <Input id="amb-social" value={form.social_media} onChange={(e) => setForm({ ...form, social_media: e.target.value })} placeholder="@seu_perfil" />
                </div>
                <div>
                  <Label htmlFor="amb-motivation">Por que quer ser embaixador?</Label>
                  <Textarea id="amb-motivation" value={form.motivation} onChange={(e) => setForm({ ...form, motivation: e.target.value })} rows={3} />
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar candidatura"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
