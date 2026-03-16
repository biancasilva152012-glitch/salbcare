import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, HeartPulse, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const bullets = [
  "Agenda, prontuário e teleconsulta",
  "Assessoria contábil integrada",
  "Menor preço do mercado",
  "7 dias grátis — sem cartão",
];

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("password")) {
        toast.error("E-mail ou senha incorretos. Esqueceu sua senha?");
      } else if (msg.includes("network") || msg.includes("fetch")) {
        toast.error("Sem conexão no momento. Verifique sua internet.");
      } else {
        toast.error("Ocorreu um erro. Tente novamente ou fale com o suporte.");
      }
    } else if (authData.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("trial_start_date, payment_status")
        .eq("user_id", authData.user.id)
        .single();

      const needsOnboarding = !profile?.trial_start_date && (profile as any)?.payment_status === "none";
      navigate(needsOnboarding ? "/onboarding" : "/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Branding */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/20">
            <HeartPulse className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">SALBCARE</h1>
          <p className="mt-1 text-sm text-muted-foreground">Você cuida dos pacientes.</p>
          <p className="text-sm text-primary font-semibold">A gente cuida do seu negócio.</p>
        </div>

        {/* Value props */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {bullets.map((text) => (
            <div key={text} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-[11px] text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-accent border-border"
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
                className="bg-accent border-border pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

          <Button type="submit" className="w-full gradient-primary font-semibold" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Comece grátis por 7 dias
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
