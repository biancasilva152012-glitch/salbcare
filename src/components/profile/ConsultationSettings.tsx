import { Video, CheckCircle, HelpCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const MeetHelpModal = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button type="button" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Ajuda sobre o link do Google Meet">
        <HelpCircle className="h-4 w-4" />
      </button>
    </DialogTrigger>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="text-base">Como criar seu link fixo do Google Meet</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-3">
          {[
            { step: "1", text: "Acesse meet.google.com no seu navegador" },
            { step: "2", text: "Clique em \"Novo Encontro\" (botão azul)" },
            { step: "3", text: "Escolha \"Criar um link para uso posterior\"" },
            { step: "4", text: "Cole o link gerado aqui na SALBCARE e salve" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {item.step}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Importante</p>
          </div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
            Ative a <strong>Sala de Espera</strong> no Google Meet para que nenhum paciente entre antes de você admiti-lo.
          </p>
        </div>
        <a
          href="https://support.google.com/meet/answer/10364location"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Como ativar a Sala de Espera
        </a>
      </div>
    </DialogContent>
  </Dialog>
);

interface ConsultationSettingsProps {
  /** Valor atual do campo, controlado pela tela de perfil. */
  value: string;
  onChange: (value: string) => void;
  /** Link já salvo no banco, usado para mostrar a confirmação. */
  savedLink: string;
}

/** Campo de link de teleconsulta. O salvamento acontece na ação única do perfil. */
const ConsultationSettings = ({ value, onChange, savedLink }: ConsultationSettingsProps) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 px-1">
      <Video className="h-4 w-4 text-primary" />
      <h2 className="text-sm font-semibold">Link de teleconsulta (Google Meet)</h2>
      <MeetHelpModal />
    </div>
    <div className="glass-card p-3 space-y-3">
      <Input
        placeholder="https://meet.google.com/seu-link"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-accent border-border"
      />
      {!!savedLink.trim() && savedLink.trim() === value.trim() && (
        <div className="flex items-center gap-2 text-xs text-success">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Link salvo com sucesso.</span>
        </div>
      )}
    </div>
  </div>
);

export default ConsultationSettings;
