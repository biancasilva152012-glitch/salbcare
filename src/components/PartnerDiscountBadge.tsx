import { Sparkles } from "lucide-react";
import type { PartnerDiscount } from "@/hooks/usePartnerDiscount";

interface Props {
  partner: PartnerDiscount;
  className?: string;
}

export const PartnerDiscountBadge = ({ partner, className = "" }: Props) => (
  <div
    className={`inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-semibold text-primary ${className}`}
  >
    <Sparkles className="h-3 w-3" />
    Desconto exclusivo Parceiro {partner.name} ({partner.discountPercent}% OFF)
  </div>
);
