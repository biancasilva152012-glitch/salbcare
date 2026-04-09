import { motion } from "framer-motion";

const WHATSAPP_NUMBER = "5585999999999"; // Replace with actual number
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Olá! Vim pelo site da SALBCARE e gostaria de saber mais sobre a plataforma."
);

const WhatsAppFab = () => {
  return (
    <motion.a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-green-500/30 transition-shadow hover:shadow-xl hover:shadow-green-500/40"
      style={{ backgroundColor: "#25D366" }}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white" aria-hidden="true">
        <path d="M16.004 2.667A13.26 13.26 0 0 0 2.667 15.89a13.16 13.16 0 0 0 1.784 6.628L2.667 29.333l7.048-1.848A13.23 13.23 0 0 0 16.004 29.2 13.27 13.27 0 0 0 29.333 15.89 13.27 13.27 0 0 0 16.004 2.667Zm0 24.266a10.99 10.99 0 0 1-5.587-1.525l-.4-.237-4.16 1.09 1.112-4.06-.262-.416a10.88 10.88 0 0 1-1.688-5.896A11.01 11.01 0 0 1 16.004 4.933 11.01 11.01 0 0 1 27.067 15.89a11.01 11.01 0 0 1-11.063 11.043Zm6.06-8.273c-.332-.166-1.965-.97-2.27-1.08-.306-.111-.528-.166-.75.166s-.862 1.08-1.056 1.302c-.195.222-.389.249-.722.083a9.1 9.1 0 0 1-2.682-1.655 10.07 10.07 0 0 1-1.855-2.312c-.194-.333-.02-.513.147-.678.15-.15.332-.389.5-.583.166-.195.222-.333.333-.555.111-.222.056-.416-.028-.583-.083-.166-.75-1.81-1.028-2.477-.271-.65-.546-.562-.75-.573l-.64-.011a1.226 1.226 0 0 0-.889.417c-.306.333-1.166 1.138-1.166 2.774s1.194 3.218 1.36 3.44c.167.222 2.35 3.59 5.696 5.034.796.344 1.417.55 1.902.703.799.254 1.526.218 2.101.132.641-.096 1.965-.803 2.243-1.578.278-.776.278-1.44.194-1.579-.083-.138-.305-.222-.638-.388Z" />
      </svg>
      <span className="absolute -top-1 -right-1 flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500" />
      </span>
    </motion.a>
  );
};

export default WhatsAppFab;
