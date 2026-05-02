// Botão flutuante WhatsApp — CTA "Agendar demo".
// Reutilizado também via WhatsAppDemoButton para variantes inline (hero, rodapé).
import { motion } from "framer-motion";
import { trackCtaClick, trackUnified } from "@/hooks/useTracking";

const WHATSAPP_NUMBER = "5588996924700";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Olá! Vim pela SalbCare e gostaria de falar com a equipe e agendar uma demonstração da plataforma."
);
const WA_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

const fire = (origem: string) => {
  trackCtaClick("click_whatsapp_demo", origem);
  trackUnified("click_whatsapp_demo", { origem });
};

const WhatsAppFab = () => {
  return (
    <motion.a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a equipe SalbCare e agendar uma demonstração"
      onClick={() => fire("flutuante")}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full pl-3 pr-4 py-3 text-white font-semibold text-sm shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-shadow"
      style={{
        backgroundColor: "#25D366",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
        <svg viewBox="0 0 32 32" className="h-5 w-5 fill-white" aria-hidden="true">
          <path d="M16.004 2.667A13.26 13.26 0 0 0 2.667 15.89a13.16 13.16 0 0 0 1.784 6.628L2.667 29.333l7.048-1.848A13.23 13.23 0 0 0 16.004 29.2 13.27 13.27 0 0 0 29.333 15.89 13.27 13.27 0 0 0 16.004 2.667Zm0 24.266a10.99 10.99 0 0 1-5.587-1.525l-.4-.237-4.16 1.09 1.112-4.06-.262-.416a10.88 10.88 0 0 1-1.688-5.896A11.01 11.01 0 0 1 16.004 4.933 11.01 11.01 0 0 1 27.067 15.89a11.01 11.01 0 0 1-11.063 11.043Zm6.06-8.273c-.332-.166-1.965-.97-2.27-1.08-.306-.111-.528-.166-.75.166s-.862 1.08-1.056 1.302c-.195.222-.389.249-.722.083a9.1 9.1 0 0 1-2.682-1.655 10.07 10.07 0 0 1-1.855-2.312c-.194-.333-.02-.513.147-.678.15-.15.332-.389.5-.583.166-.195.222-.333.333-.555.111-.222.056-.416-.028-.583-.083-.166-.75-1.81-1.028-2.477-.271-.65-.546-.562-.75-.573l-.64-.011a1.226 1.226 0 0 0-.889.417c-.306.333-1.166 1.138-1.166 2.774s1.194 3.218 1.36 3.44c.167.222 2.35 3.59 5.696 5.034.796.344 1.417.55 1.902.703.799.254 1.526.218 2.101.132.641-.096 1.965-.803 2.243-1.578.278-.776.278-1.44.194-1.579-.083-.138-.305-.222-.638-.388Z" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-200 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-300" />
        </span>
      </span>
      <span className="hidden sm:inline">Fale com a nossa equipe e agende uma demonstração</span>
      <span className="inline sm:hidden">Agendar demo</span>
    </motion.a>
  );
};

export default WhatsAppFab;

// Variante inline (hero, rodapé) — botão pleno em pílula verde.
export const WhatsAppDemoButton = ({
  origem,
  className = "",
  fullWidth = false,
}: {
  origem: "hero" | "rodape" | string;
  className?: string;
  fullWidth?: boolean;
}) => {
  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a equipe SalbCare e agendar uma demonstração"
      onClick={() => fire(origem)}
      className={`inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-white font-semibold text-base shadow-md transition-all hover:-translate-y-0.5 ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      style={{
        backgroundColor: "#25D366",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        minHeight: 52,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#128C7E")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#25D366")}
    >
      <svg viewBox="0 0 32 32" className="h-5 w-5 fill-white" aria-hidden="true">
        <path d="M16.004 2.667A13.26 13.26 0 0 0 2.667 15.89a13.16 13.16 0 0 0 1.784 6.628L2.667 29.333l7.048-1.848A13.23 13.23 0 0 0 16.004 29.2 13.27 13.27 0 0 0 29.333 15.89 13.27 13.27 0 0 0 16.004 2.667Zm6.06 16.26c-.332-.167-1.965-.97-2.27-1.082-.306-.11-.528-.166-.75.167s-.862 1.08-1.056 1.302c-.195.222-.389.249-.722.083a9.1 9.1 0 0 1-2.682-1.655 10.07 10.07 0 0 1-1.855-2.312c-.194-.333-.02-.513.147-.678.15-.15.332-.389.5-.583.166-.195.222-.333.333-.555.111-.222.056-.416-.028-.583-.083-.166-.75-1.81-1.028-2.477-.271-.65-.546-.562-.75-.573l-.64-.011a1.226 1.226 0 0 0-.889.417c-.306.333-1.166 1.138-1.166 2.774s1.194 3.218 1.36 3.44c.167.222 2.35 3.59 5.696 5.034.796.344 1.417.55 1.902.703.799.254 1.526.218 2.101.132.641-.096 1.965-.803 2.243-1.578.278-.776.278-1.44.194-1.579-.083-.138-.305-.222-.638-.388Z" />
      </svg>
      Fale com a nossa equipe e agende uma demonstração
    </a>
  );
};
