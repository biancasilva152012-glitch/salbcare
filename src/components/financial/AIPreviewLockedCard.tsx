import { Sparkles, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  /** Disparado ao clicar no card / CTA — abre o modal de upgrade. */
  onUpgrade: () => void;
}

/**
 * Preview bloqueado da análise da Mentora IA. Mostrado quando o usuário
 * já cadastrou ≥3 lançamentos para criar desejo: ele vê o "shape" da
 * análise (gráfico borrado + insight quantificado) mas precisa do
 * Plano Essencial para destravar.
 *
 * Os números são fictícios e estão completamente borrados (filter blur)
 * para evitar parecer um dado real e gerar quebra de expectativa.
 */
const AIPreviewLockedCard = ({ onUpgrade }: Props) => {
  return (
    <section
      className="glass-card relative overflow-hidden p-4 cursor-pointer transition-transform active:scale-[0.99]"
      onClick={onUpgrade}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onUpgrade();
        }
      }}
      data-testid="ai-preview-locked-card"
      aria-label="Análise bloqueada da Mentora IA — abrir upgrade"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Mentora IA
          </p>
          <p className="text-xs text-muted-foreground">Análise prévia do mês</p>
        </div>
      </div>

      {/* Gráfico fictício (puro CSS) — completamente borrado */}
      <div
        className="relative h-28 rounded-lg bg-gradient-to-br from-primary/10 to-success/10 px-3 py-2"
        aria-hidden="true"
      >
        <div className="filter blur-md select-none pointer-events-none flex items-end justify-between h-full gap-1">
          {[60, 78, 45, 90, 72, 84].map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
              <div
                className="w-full rounded-t bg-success/70"
                style={{ height: `${h}%` }}
              />
              <div
                className="w-full rounded-b bg-destructive/70"
                style={{ height: `${100 - h}%` }}
              />
            </div>
          ))}
        </div>

        {/* Overlay escurecido + cadeado central */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 rounded-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 shadow-md">
            <Lock className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-sm font-semibold leading-snug">
          Sua IA mentora identificou{" "}
          <span className="text-primary">2 oportunidades</span> de economia
          este mês.
        </p>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onUpgrade();
          }}
          className="gradient-primary font-semibold text-xs gap-1.5"
          data-testid="ai-preview-upgrade-cta"
        >
          Ver análise completa → Plano Essencial
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </section>
  );
};

export default AIPreviewLockedCard;
