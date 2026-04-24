import { useState } from "react";
import SEOHead from "@/components/SEOHead";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";
import { trackLead, trackRegistration } from "@/hooks/useTracking";

const floatingOrbs = [
  { size: 150, x: "5%", y: "15%", delay: 0.5 },
  { size: 100, x: "75%", y: "8%", delay: 2 },
  { size: 80, x: "65%", y: "80%", delay: 3.5 },
];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const [loading, setLoading] = useState(false);
  const [showRef, setShowRef] = useState(!!refCode);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    professional_type: "medico", // default — usuário troca depois no perfil
    referral_code: refCode,
  });

  const canSubmit = !!form.name.trim() && !!form.email && form.password.length >= 6;

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Falta só o seu nome — qual é?"); return; }
    if (!form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) === false) { toast.error("Esse e-mail não tá certinho. Confere?"); return; }
    if (!form.password || form.password.length < 6) { toast.error("A senha precisa ter pelo menos 6 caracteres."); return; }
    

    setLoading(true);

    try {
      const { data: existingType, error: rpcError } = await supabase.rpc("check_email_user_type", { check_email: form.email });
      if (rpcError) console.error("[Register] RPC error:", rpcError);
      if (existingType) {
        const typeLabel = existingType === "professional" ? "profissional" : "paciente";
        toast.error(`Este e-mail já possui uma conta como ${typeLabel}. Tente entrar ou recupere sua senha.`);
        setLoading(false);
        return;
      }

      const metadata: Record<string, string> = {
        name: form.name,
        user_type: "professional",
        professional_type: form.professional_type,
      };

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: metadata, emailRedirectTo: window.location.origin },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
          toast.error("Este e-mail já possui uma conta. Tente entrar ou recupere sua senha.");
        } else if (msg.includes("password") || msg.includes("senha")) {
          toast.error("A senha precisa ter pelo menos 6 caracteres.");
        } else if (msg.includes("email") && msg.includes("invalid")) {
          toast.error("E-mail inválido. Verifique e tente novamente.");
        } else if (msg.includes("rate") || msg.includes("limit")) {
          toast.error("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
        } else {
          console.error("[Register] Signup error:", error);
          toast.error("Não conseguimos criar sua conta agora. Tente novamente em instantes.");
        }
        setLoading(false);
        return;
      }

      if (!signUpData?.user) {
        toast.error("Erro inesperado ao criar conta. Tente novamente.");
        setLoading(false);
        return;
      }

      const userId = signUpData.user.id;

      // Set verification_status, council_number and referral
      const profileUpdate: Record<string, string> = { verification_status: "approved" };
      if (form.referral_code) {
        profileUpdate.referral_code = form.referral_code;
        profileUpdate.referred_by = form.referral_code.toLowerCase().trim();
      }
      await supabase
        .from("profiles")
        .update(profileUpdate as any)
        .eq("user_id", userId);

      // Insert into professionals table
      const { error: profError } = await supabase
        .from("professionals")
        .insert({
          user_id: userId,
          name: form.name,
          email: form.email,
          specialty: form.professional_type,
          status: "active",
        } as any);

      if (profError) console.error("[Register] Error inserting into professionals:", profError);

      // Notify admin about new signup (fire-and-forget)
      supabase.functions.invoke("notify-admin-signup", {
        body: {
          name: form.name,
          email: form.email,
          professional_type: form.professional_type,
        },
      }).catch((err) => console.error("[Register] Admin notification error:", err));

      // If user came via partner referral, skip trial and go straight to Stripe checkout
      const hasReferral = !!form.referral_code?.trim();

      // Auto-confirm está habilitado: se a sessão não vier, fazemos login imediatamente
      if (!signUpData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInError) {
          toast.success("Conta criada! Faça login para continuar.");
          setLoading(false);
          navigate("/login");
          return;
        }
      }

      trackLead(form.email);
      trackRegistration();

      if (hasReferral) {
        // Partner referral → checkout direto sem trial
        toast.success("Conta criada! Redirecionando para o pagamento...");
        try {
          const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke("create-checkout", {
            body: { skipTrial: true },
          });
          if (checkoutError) throw checkoutError;
          if (checkoutData?.url) {
            sessionStorage.setItem("salbcare_from_checkout", "true");
            window.location.href = checkoutData.url;
            return;
          }
          throw new Error("URL de checkout não retornada");
        } catch (err) {
          console.error("[Register] Checkout error:", err);
          toast.error("Conta criada, mas houve um erro ao iniciar o pagamento. Acesse a página de assinatura.");
          setLoading(false);
          navigate("/subscription");
          return;
        }
      }

      setLoading(false);
      toast.success("Conta criada com sucesso!");
      navigate("/dashboard");
    } catch (err) {
      console.error("[Register] Unexpected signup error:", err);
      setLoading(false);
      toast.error("Não conseguimos criar sua conta agora. Tente novamente em instantes.");
    }
  };

  return (
    <>
    <SEOHead
      title="Cadastro | SalbCare — Plataforma para Profissionais de Saúde"
      description="Crie sua conta gratuita na SalbCare. Agenda, teleconsulta, prontuário, financeiro e mentoria com IA — tudo em um só lugar para profissionais de saúde."
      canonical="/cadastro"
    />
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10 overflow-hidden">
      {floatingOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full opacity-[0.07]"
          style={{
            width: orb.size, height: orb.size, left: orb.x, top: orb.y,
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
            filter: "blur(40px)",
          }}
          animate={{ y: [0, -25, 0, 15, 0], x: [0, 10, -8, 5, 0], scale: [1, 1.12, 0.95, 1.05, 1] }}
          transition={{ duration: 12, repeat: Infinity, delay: orb.delay, ease: "easeInOut" }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm space-y-6"
      >
        <motion.div className="text-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <motion.div className="mx-auto mb-2 h-16 w-16 relative" whileHover={{ scale: 1.05 }}>
            <img src="/pwa-icon-512.png" alt="SALBCARE" className="h-full w-full object-contain" />
          </motion.div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Cadastro Profissional</span>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="glass-card p-5 space-y-3">
              <div className="space-y-1.5">
                <Label>Nome completo *</Label>
                <Input placeholder="Seu nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background/50 border-border/60" />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail *</Label>
                <Input type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-background/50 border-border/60" />
              </div>
              <div className="space-y-1.5">
                <Label>Senha *</Label>
                <Input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-background/50 border-border/60" minLength={6} />
                <p className="text-[10px] text-muted-foreground">Mínimo 6 caracteres</p>
              </div>

              {showRef ? (
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Código de indicação</Label>
                  <Input placeholder="Código opcional" value={form.referral_code} onChange={(e) => setForm({ ...form, referral_code: e.target.value })} className="bg-background/50 border-border/60" />
                </div>
              ) : (
                <button type="button" onClick={() => setShowRef(true)} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Tenho um código de indicação
                </button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
              Ao criar sua conta, você concorda com os{" "}
              <Link to="/terms" className="text-primary hover:underline" target="_blank">Termos de Uso</Link>
              {" "}e a{" "}
              <Link to="/privacy" className="text-primary hover:underline" target="_blank">Política de Privacidade</Link>.
            </p>
            <p className="text-[11px] text-muted-foreground text-center">
              CRM/CRP, especialidade e dados de cobrança você completa depois — leva 30 segundos.
            </p>
          </motion.div>
        </AnimatePresence>

        <Button
          onClick={handleSubmit}
          className="w-full h-12 font-semibold text-sm"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>Abrindo seu consultório...</motion.span>
          ) : "Entrar no SalbCare em 20s"}
        </Button>


        <motion.p className="text-center text-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">Entrar</Link>
        </motion.p>
      </motion.div>
    </div>
    </>
  );
};

export default Register;
