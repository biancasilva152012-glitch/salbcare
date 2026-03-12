import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HeartPulse, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
            <HeartPulse className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Recuperar Senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sent ? "Verifique seu email para redefinir a senha." : "Insira seu email para receber o link de recuperação."}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-accent border-border" />
            </div>
            <Button type="submit" className="w-full gradient-primary font-semibold">Enviar link</Button>
          </form>
        ) : (
          <div className="glass-card p-4 text-center text-sm text-muted-foreground">
            Um email foi enviado para <span className="text-foreground font-medium">{email}</span> com instruções para redefinir sua senha.
          </div>
        )}

        <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
