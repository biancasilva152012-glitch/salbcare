import { Link } from "react-router-dom";

interface BrandLogoProps {
  variant?: "default" | "white" | "mono";
  to?: string;
  className?: string;
}

export default function BrandLogo({ variant = "default", to = "/", className = "" }: BrandLogoProps) {
  const textColor =
    variant === "white" ? "text-white" : variant === "mono" ? "text-foreground" : "text-brand-dark";
  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`} aria-label="SalbCare">
      <img
        src="/pwa-icon-192.png"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 rounded-md"
        loading="eager"
      />
      <span className={`font-heading font-semibold tracking-tight text-lg ${textColor}`}>
        SalbCare
      </span>
    </Link>
  );
}
