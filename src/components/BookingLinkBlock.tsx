import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Copy, MessageCircle, RefreshCw, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

// Short, non-sequential token (lowercase alphanumeric, length 12).
const newToken = () => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(12);
  (globalThis.crypto || window.crypto).getRandomValues(arr);
  return Array.from(arr, (b) => alphabet[b % alphabet.length]).join("");
};

interface Props {
  userId: string;
  profileName?: string | null;
  profileSlug?: string | null;
}

const BookingLinkBlock = ({ userId, profileName, profileSlug }: Props) => {
  const qc = useQueryClient();
  const [slug, setSlug] = useState<string | null>(profileSlug ?? null);
  const [busy, setBusy] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://salbcare.com.br";
  const link = useMemo(() => (slug ? `${origin}/agendar/${slug}` : null), [origin, slug]);

  const ensureSlug = async () => {
    if (slug) return slug;
    const token = newToken();
    const { error } = await supabase.from("profiles").update({ profile_slug: token }).eq("user_id", userId);
    if (error) { toast.error("Não foi possível gerar o link."); return null; }
    setSlug(token);
    qc.invalidateQueries({ queryKey: ["profile", userId] });
    return token;
  };

  const handleCopy = async () => {
    const s = await ensureSlug();
    if (!s) return;
    await navigator.clipboard.writeText(`${origin}/agendar/${s}`);
    toast.success("Link copiado!");
  };

  const handleShare = async () => {
    const s = await ensureSlug();
    if (!s) return;
    const name = profileName ? ` com ${profileName}` : "";
    const msg = `Olá! Agende sua consulta${name} por aqui: ${origin}/agendar/${s}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  const handleRegenerate = async () => {
    if (!window.confirm("Gerar um novo link vai invalidar o link atual. Deseja continuar?")) return;
    setBusy(true);
    const token = newToken();
    const { error } = await supabase.from("profiles").update({ profile_slug: token }).eq("user_id", userId);
    setBusy(false);
    if (error) { toast.error("Não foi possível regenerar o link."); return; }
    setSlug(token);
    qc.invalidateQueries({ queryKey: ["profile", userId] });
    toast.success("Novo link gerado. O anterior não funciona mais.");
  };

  return (
    <motion.div variants={item}>
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Link2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Link de agendamento</p>
            <p className="text-[11px] text-muted-foreground">Compartilhe com seus pacientes. Sem perfil público.</p>
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs font-mono break-all">
          {link ?? "Clique em Copiar para gerar seu link"}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" onClick={handleCopy} className="text-xs">
            <Copy className="h-3.5 w-3.5 mr-1" /> Copiar link
          </Button>
          <Button size="sm" onClick={handleShare} className="text-xs">
            <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
          </Button>
        </div>

        {slug && (
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={busy}
            className="w-full text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1 pt-1 disabled:opacity-50"
          >
            <RefreshCw className="h-3 w-3" /> Gerar novo link (invalida o atual)
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default BookingLinkBlock;
