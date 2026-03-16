import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { maskPhone } from "@/utils/masks";
import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

const professionalTypes = [
  { value: "medico", label: "Médico(a)" },
  { value: "dentista", label: "Dentista" },
  { value: "psicologo", label: "Psicólogo(a)" },
  { value: "fisioterapeuta", label: "Fisioterapeuta" },
  { value: "nutricionista", label: "Nutricionista" },
  { value: "outro", label: "Outro" },
];

const floatingOrbs = [
  { size: 150, x: "5%", y: "15%", delay: 0.5 },
  { size: 100, x: "75%", y: "8%", delay: 2 },
  { size: 80, x: "65%", y: "80%", delay: 3.5 },
];

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", professional_type: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.professional_type) {
      toast.error("Preencha este campo para continuar.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          phone: form.phone,
          professional_type: form.professional_type,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        toast.error("Este e-mail já está cadastrado. Tente fazer login.");
      } else if (msg.includes("network") || msg.includes("fetch")) {
        toast.error("Sem conexão no momento. Verifique sua internet.");
      } else if (msg.includes("password")) {
        toast.error("A senha precisa ter pelo menos 6 caracteres.");
      } else {
        toast.error("Ocorreu um erro. Tente novamente ou fale com o suporte.");
      }
    } else {
      toast.success("Conta criada com sucesso!");
      navigate("/onboarding");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10 overflow-hidden">
      {/* Animated background orbs */}
      {floatingOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full opacity-[0.07]"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
            filter: "blur(40px)",
          }}
          animate={{
            y: [0, -25, 0, 15, 0],
            x: [0, 10, -8, 5, 0],
            scale: [1, 1.12, 0.95, 1.05, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            delay: orb.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm space-y-6"
      >
        {/* Branding */}
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl relative"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
              boxShadow: "0 8px 32px hsl(var(--primary) / 0.3)",
            }}
            whileHover={{ scale: 1.05, rotate: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <HeartPulse className="h-8 w-8 text-primary-foreground" />
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{ border: "2px solid hsl(var(--primary) / 0.4)" }}
              animate={{ scale: [1, 1.3, 1.3], opacity: [0.6, 0, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
            />
          </motion.div>
          <motion.h1
            className="text-2xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            Criar Conta
          </motion.h1>
          <motion.p
            className="mt-1 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            Comece a gerenciar seu consultório
          </motion.p>
        </motion.div>

        {/* Form card */}
        <motion.div
          className="glass-card p-5 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Dr. João Silva" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background/50 border-border/60 backdrop-blur-sm focus:border-primary/50 transition-colors" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-background/50 border-border/60 backdrop-blur-sm focus:border-primary/50 transition-colors" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} className="bg-background/50 border-border/60 backdrop-blur-sm focus:border-primary/50 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo profissional</Label>
              <Select onValueChange={(v) => setForm({ ...form, professional_type: v })}>
                <SelectTrigger className="bg-background/50 border-border/60 backdrop-blur-sm focus:border-primary/50 transition-colors">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {professionalTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-background/50 border-border/60 backdrop-blur-sm focus:border-primary/50 transition-colors" required minLength={6} />
            </div>

            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              Ao se cadastrar, você concorda com os{" "}
              <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link>
              {" "}e a{" "}
              <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.
            </p>

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                className="w-full font-semibold h-11 text-sm relative overflow-hidden mt-1"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
                }}
                disabled={loading}
              >
                {loading ? (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    Cadastrando...
                  </motion.span>
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </motion.div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {/* Google Sign Up */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-sm font-medium gap-2 border-border/60 bg-background/50 backdrop-blur-sm hover:bg-accent/80"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (error) {
                  toast.error("Erro ao cadastrar com Google. Tente novamente.");
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
          </motion.div>
        </motion.div>

        <motion.p
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">Entrar</Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Register;
