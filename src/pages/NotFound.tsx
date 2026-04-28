import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <>
  <SEOHead title="Página Não Encontrada | SalbCare" description="A página que você procura não existe ou foi movida." />
  <div className="flex min-h-screen flex-col items-center justify-center px-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm space-y-6 text-center"
    >
      <div className="mx-auto mb-4 h-14 w-14">
        <img loading="lazy" decoding="async" src="/pwa-icon-512.png" alt="SALBCARE" className="h-full w-full object-contain" />
      </div>
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>
      <Link to="/dashboard">
        <Button className="gradient-primary font-semibold gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel
        </Button>
      </Link>
    </motion.div>
  </div>
  </>
);

export default NotFound;
