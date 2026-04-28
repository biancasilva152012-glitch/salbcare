import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, CheckCircle2, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import { trackCtaClick } from "@/hooks/useTracking";

const bullets = [
  { icon: Zap, text: "Agenda, prontuário e teleconsulta" },
  { icon: Shield, text: "Assessoria contábil integrada" },
  { icon: CheckCircle2, text: "Você fica com 100% das consultas" },
  { icon: CheckCircle2, text: "Sem comissão sobre consultas" },
];

const floatingOrbs = [
  { size: 180, x: "-10%", y: "10%", delay: 0 },
  { size: 120, x: "80%", y: "5%", delay: 1.5 },
  { size: 90, x: "70%", y: "75%", delay: 3 },
];

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Preserve `next=/...` through the entire login flow so users land back
  // on the page they came from (e.g. /profile) after authenticating.
  const rawNext = searchParams.get("next") || "";
  const safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";
  const nextQs = safeNext ? `?next=${encodeURIComponent(safeNext)}` : "";
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("password")) {
        toast.error("E-mail ou senha incorretos. Esqueceu sua senha?");
      } else if (msg.includes("network") || msg.includes("fetch")) {
        toast.error("Sem conexão no momento. Verifique sua internet.");
      } else {
        toast.error("Ocorreu um erro. Tente novamente ou fale com o suporte.");
      }
      return;
    }
    if (authData.user) {
      // Single profile query — no duplicate
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, council_number")
        .eq("user_id", authData.user.id)
        .single();

      setLoading(false);
      const userType = (profile as any)?.user_type || "professional";

      if (userType === "patient") {
        navigate("/patient-dashboard/perfil");
      } else if (safeNext) {
        // Honor the `next` redirect after login (e.g. back to /profile)
        navigate(safeNext);
      } else if (!(profile as any)?.council_number) {
        navigate("/complete-profile");
      } else {
        navigate("/dashboard");
      }
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 overflow-hidden">
      <SEOHead
        title="Entrar | SalbCare"
        description="Acesse sua conta SalbCare para gerenciar sua agenda, pacientes, teleconsultas e financeiro."
        canonical="/login"
        noindex
      />
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
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            scale: [1, 1.15, 0.95, 1.05, 1],
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
        className="relative z-10 w-full max-w-sm space-y-7"
      >
        {/* Branding */}
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="mx-auto mb-5 h-[72px] w-[72px] relative"
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
          >
            <img loading="lazy" decoding="async" src="/pwa-icon-512.png" alt="SALBCARE" className="h-full w-full object-contain" />
          </motion.div>

          <motion.h1
            className="text-[1.75rem] font-extrabold tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            SALBCARE
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="mt-1.5 text-sm text-muted-foreground">Você cuida dos pacientes.</p>
            <p className="text-sm font-semibold gradient-text">A gente cuida do seu negócio.</p>
          </motion.div>
        </motion.div>

        {/* Value props */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {bullets.map((item, i) => (
            <motion.div
              key={item.text}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.1, duration: 0.4 }}
            >
              <item.icon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Plans banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5"
        >
          <p className="text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link to={`/planos${nextQs}`} onClick={() => trackCtaClick("conheca_planos", "login_banner")} className="text-primary font-semibold hover:underline">
              Conheça os planos →
            </Link>
          </p>
        </motion.div>

        {/* Login form card */}
        <motion.div
          className="glass-card p-5 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-border/60 backdrop-blur-sm focus:border-primary/50 transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 border-border/60 backdrop-blur-sm pr-10 focus:border-primary/50 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Esqueceu a senha?
              </Link>
            </div>

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                className="w-full font-semibold h-11 text-sm relative overflow-hidden"
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
                    Entrando...
                  </motion.span>
                ) : (
                  "Entrar"
                )}
              </Button>
            </motion.div>
          </form>

        </motion.div>

        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to={`/register${nextQs}`} className="text-primary hover:underline font-medium">
              Comece grátis por 7 dias
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            ou{" "}
            <Link
              to="/guest"
              className="underline underline-offset-2 hover:text-foreground"
              data-testid="login-guest-cta"
            >
              entrar como visitante (sem login)
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
