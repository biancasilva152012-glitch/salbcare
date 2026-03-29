import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { maskPhone, maskCpf } from "@/utils/masks";
import { isValidCpf } from "@/utils/cpfValidator";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { ArrowLeft, Stethoscope } from "lucide-react";

const professionalTypes = [
  { value: "medico", label: "Médico(a)", prefix: "CRM" },
  { value: "dentista", label: "Cirurgião(ã)-Dentista", prefix: "CRO" },
  { value: "enfermeiro", label: "Enfermeiro(a) / Técnico(a) de Enfermagem", prefix: "COREN" },
  { value: "farmaceutico", label: "Farmacêutico(a)", prefix: "CRF" },
  { value: "psicologo", label: "Psicólogo(a)", prefix: "CRP" },
  { value: "fisioterapeuta", label: "Fisioterapeuta / Terapeuta Ocupacional", prefix: "CREFITO" },
  { value: "nutricionista", label: "Nutricionista", prefix: "CRN" },
  { value: "assistente_social", label: "Assistente Social", prefix: "CRAS" },
  { value: "biomedico", label: "Biomédico(a)", prefix: "CRBM" },
  { value: "fonoaudiologo", label: "Fonoaudiólogo(a)", prefix: "CRFono" },
  { value: "outro", label: "Outro", prefix: "Conselho" },
];

const brStates = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const floatingOrbs = [
  { size: 150, x: "5%", y: "15%", delay: 0.5 },
  { size: 100, x: "75%", y: "8%", delay: 2 },
  { size: 80, x: "65%", y: "80%", delay: 3.5 },
];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    cpf: "",
    professional_type: "",
    council_number: "",
    council_state: "",
  });

  const totalSteps = 3;
  const councilPrefix = professionalTypes.find(p => p.value === form.professional_type)?.prefix || "Conselho";

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Preencha seu nome completo."); return; }
    if (!form.cpf || !isValidCpf(form.cpf)) { toast.error("CPF inválido. Verifique os dígitos."); return; }
    if (!form.phone || form.phone.replace(/\D/g, "").length < 10) { toast.error("Telefone inválido."); return; }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error("E-mail inválido."); return; }
    if (!form.password || form.password.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres."); return; }
    if (!form.professional_type) { toast.error("Selecione sua profissão."); return; }
    if (!form.council_number.trim()) { toast.error("Preencha o número do conselho."); return; }
    if (!form.council_state) { toast.error("Selecione o estado do conselho."); return; }

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
        phone: form.phone,
        user_type: "professional",
        professional_type: form.professional_type,
        council_number: form.council_number,
        council_state: form.council_state,
      };

      console.log("[Register] Creating account with signUp...", { email: form.email });

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
      console.log("[Register] User created:", userId);

      // Set verification_status to approved immediately
      await supabase
        .from("profiles")
        .update({ verification_status: "approved" } as any)
        .eq("user_id", userId);

      // Insert into professionals table
      console.log("[Register] Inserting into professionals table...");
      const { error: profError } = await supabase
        .from("professionals")
        .insert({
          user_id: userId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          specialty: form.professional_type,
          crm: `${councilPrefix} ${form.council_number}`,
          status: "active",
        } as any);

      if (profError) {
        console.error("[Register] Error inserting into professionals:", profError);
      } else {
        console.log("[Register] Professional record created successfully");
      }

      setLoading(false);

      if (!signUpData.session) {
        toast.success("Conta criada! Verifique seu e-mail para confirmar o cadastro.", { duration: 6000 });
        navigate("/login");
        return;
      }

      toast.success("Conta criada com sucesso!");
      navigate("/dashboard");
    } catch (err) {
      console.error("[Register] Unexpected signup error:", err);
      setLoading(false);
      toast.error("Não conseguimos criar sua conta agora. Tente novamente em instantes.");
    }
  };

  const canGoNext = () => {
    if (step === 0) return !!form.name.trim() && !!form.email && !!form.phone && form.password.length >= 6 && !!form.cpf && isValidCpf(form.cpf);
    if (step === 1) return !!form.professional_type && !!form.council_number.trim() && !!form.council_state;
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) return;
    if (step === totalSteps - 1) { handleSubmit(); return; }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 0) { navigate("/"); return; }
    setStep(step - 1);
  };

  return (
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

        <div className="flex gap-1.5 px-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-primary" : "bg-border/50"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold">Dados pessoais</h2>
                <p className="text-xs text-muted-foreground">Etapa 1 de {totalSteps}</p>
              </div>
              <div className="glass-card p-5 space-y-3">
                <div className="space-y-1.5">
                  <Label>Nome completo *</Label>
                  <Input placeholder="Seu nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background/50 border-border/60" required />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail *</Label>
                  <Input type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-background/50 border-border/60" required />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp *</Label>
                  <Input placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} className="bg-background/50 border-border/60" />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF *</Label>
                  <Input placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: maskCpf(e.target.value) })} className="bg-background/50 border-border/60" />
                  {form.cpf && form.cpf.replace(/\D/g, "").length === 11 && !isValidCpf(form.cpf) && (
                    <p className="text-[10px] text-destructive">CPF inválido</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Senha *</Label>
                  <Input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-background/50 border-border/60" required minLength={6} />
                  <p className="text-[10px] text-muted-foreground">Mínimo 6 caracteres</p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold">Dados profissionais</h2>
                <p className="text-xs text-muted-foreground">Etapa 2 de {totalSteps}</p>
              </div>
              <div className="glass-card p-5 space-y-3">
                <div className="space-y-1.5">
                  <Label>Conselho profissional *</Label>
                  <Select onValueChange={(v) => setForm({ ...form, professional_type: v })} value={form.professional_type}>
                    <SelectTrigger className="bg-background/50 border-border/60"><SelectValue placeholder="Selecione seu conselho" /></SelectTrigger>
                    <SelectContent>
                      {professionalTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.prefix} — {t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Nº {councilPrefix} *</Label>
                  <Input placeholder={`Ex: ${councilPrefix}/12345`} value={form.council_number} onChange={(e) => setForm({ ...form, council_number: e.target.value })} className="bg-background/50 border-border/60" />
                </div>
                <div className="space-y-1.5">
                  <Label>UF do registro *</Label>
                  <Select onValueChange={(v) => setForm({ ...form, council_state: v })} value={form.council_state}>
                    <SelectTrigger className="bg-background/50 border-border/60"><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                    <SelectContent>
                      {brStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold">Confirme seus dados</h2>
                <p className="text-xs text-muted-foreground">Última etapa</p>
              </div>
              <div className="glass-card p-5 space-y-4">
                <div className="rounded-lg bg-accent/50 border border-border p-3 space-y-1">
                  <p className="text-xs font-medium">Resumo da conta</p>
                  <p className="text-[11px] text-muted-foreground">{form.name} • {form.email}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {professionalTypes.find(p => p.value === form.professional_type)?.label || "Profissional"} • {councilPrefix} {form.council_number} ({form.council_state})
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
                  Ao criar sua conta, você concorda com os{" "}
                  <Link to="/terms" className="text-primary hover:underline" target="_blank">Termos de Uso</Link>
                  {" "}e a{" "}
                  <Link to="/privacy" className="text-primary hover:underline" target="_blank">Política de Privacidade</Link>.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBack} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 h-11 font-semibold"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
            disabled={!canGoNext() || loading}
          >
            {loading ? (
              <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>Criando conta...</motion.span>
            ) : step === totalSteps - 1 ? "Criar minha conta" : "Próximo"}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 text-sm font-medium gap-2 border-border/60 bg-background/50 backdrop-blur-sm hover:bg-accent/80"
          onClick={async () => {
            console.log("[Register] Google OAuth redirect_uri:", window.location.origin);
            const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
            if (error) {
              console.error("[Register] Google OAuth error:", error);
              toast.error("Erro ao cadastrar com Google. Verifique se popups estão habilitados.");
            }
          }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Cadastrar com Google
        </Button>

        <motion.p className="text-center text-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">Entrar</Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Register;
