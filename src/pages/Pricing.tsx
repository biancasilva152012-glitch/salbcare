import { useState } from "react";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

const FREE_FEATURES = [
  { text: "Até 3 pacientes cadastrados", included: true },
  { text: "Até 10 lançamentos financeiros/mês", included: true },
  { text: "5 mensagens de mentoria IA/mês", included: true },
  { text: "Perfil público no diretório", included: true },
  { text: "Pacientes ilimitados", included: false },
  { text: "Teleconsulta integrada", included: false },
  { text: "Receita e Atestado Digital", included: false },
  { text: "Controle financeiro completo", included: false },
];

const ESSENTIAL_FEATURES = [
  { text: "Cadastro ilimitado de pacientes", included: true },
  { text: "Controle financeiro completo", included: true },
  { text: "Mentoria financeira com IA ilimitada", included: true, highlight: true },
  { text: "Perfil público no diretório", included: true },
  { text: "Teleconsulta integrada", included: true },
  { text: "Receita e Atestado Digital (PDF)", included: true },
  { text: "Agenda inteligente de consultas", included: true },
  { text: "100% do valor das consultas é seu", included: true },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);

  return (
    <>
      <SEOHead
        title="Planos e Preços | SalbCare"
        description="Compare os planos Grátis e Essencial da SalbCare. Gerencie sua prática de saúde a partir de R$0/mês."
        canonical="/planos"
      />
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Escolha o plano ideal para você
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Comece grátis e faça upgrade quando quiser.
            </p>

            {/* Annual toggle */}
            <div className="inline-flex items-center gap-3 rounded-full bg-muted/50 p-1 border border-border/40">
              <button
                onClick={() => setAnnual(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!annual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${annual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Anual <span className="text-xs opacity-80">(-22%)</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <Card className="border-border">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Grátis</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-foreground">R$0</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Para quem está começando</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {FREE_FEATURES.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                      )}
                      <span className={f.included ? "text-foreground" : "text-muted-foreground/50 line-through"}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/register")}
                >
                  Criar conta grátis
                </Button>
              </CardContent>
            </Card>

            {/* Essential Plan */}
            <Card className="border-primary ring-2 ring-primary/20 relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Mais popular
              </Badge>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Essencial</CardTitle>
                <div className="mt-2">
                  {annual ? (
                    <>
                      <span className="text-lg text-muted-foreground line-through mr-2">R$89</span>
                      <span className="text-4xl font-bold text-foreground">R$69</span>
                      <span className="text-muted-foreground">/mês</span>
                      <p className="text-xs text-primary font-semibold mt-1">R$828/ano • Economia de R$240</p>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-foreground">R$89</span>
                      <span className="text-muted-foreground">/mês</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Tudo que você precisa</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {ESSENTIAL_FEATURES.map((f) => (
                    <li key={f.text} className={`flex items-start gap-2 text-sm ${f.highlight ? "bg-primary/5 -mx-2 px-2 py-1.5 rounded-lg" : ""}`}>
                      {f.highlight ? (
                        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      ) : (
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      )}
                      <span className={`text-foreground ${f.highlight ? "font-semibold text-primary" : ""}`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() => navigate("/register")}
                >
                  Começar agora <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Cancele a qualquer momento. Sem contratos de fidelidade.
          </p>
        </div>
      </div>
    </>
  );
}
