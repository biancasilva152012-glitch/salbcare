import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  extra?: React.ReactNode;
}

// Spring orgânico — não é o easing padrão do Framer
const ORGANIC_SPRING = [0.34, 1.56, 0.64, 1] as const;

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction, extra }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.44, ease: ORGANIC_SPRING }}
    className="flex flex-col items-center justify-center py-14 px-6 text-center space-y-5"
  >
    <motion.div
      initial={{ scale: 0.8, rotate: -4 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.52, ease: ORGANIC_SPRING, delay: 0.08 }}
      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent"
    >
      <Icon className="h-8 w-8 text-muted-foreground" />
    </motion.div>
    <div className="space-y-2 max-w-xs">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
    {extra}
    {actionLabel && onAction && (
      <Button onClick={onAction} className="gradient-primary font-semibold">
        {actionLabel}
      </Button>
    )}
  </motion.div>
);

export default EmptyState;
