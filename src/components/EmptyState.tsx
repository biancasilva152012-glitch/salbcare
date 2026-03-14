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

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction, extra }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4"
  >
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
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
