/**
 * Avatares vetoriais simples dos pacientes do jogo da Academy.
 * Traço fino em navy, no mesmo espírito do ícone shield da SalbCare.
 */
import { GOLD, NAVY_INK, TEAL_DEEP } from "@/components/pro/brand";

type Mood = "neutral" | "happy" | "confused" | "uncomfortable";

const MOUTH: Record<Mood, string> = {
  neutral: "M26 42 h12",
  happy: "M25 39 q7 8 14 0",
  confused: "M25 42 q7 -6 14 2",
  uncomfortable: "M25 44 q7 -7 14 0",
};

const PatientAvatar = ({
  variant,
  mood = "neutral",
  size = 64,
}: {
  variant: "sarah" | "mateo";
  mood?: Mood;
  size?: number;
}) => {
  const hair = variant === "sarah" ? GOLD : TEAL_DEEP;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={variant === "sarah" ? "Avatar da paciente Sarah" : "Avatar do paciente Mateo"}
      style={{ display: "block", flex: "none" }}
    >
      <circle cx="32" cy="32" r="31" fill="#FFFFFF" stroke={NAVY_INK} strokeOpacity="0.18" />
      <circle cx="32" cy="30" r="15" fill="none" stroke={NAVY_INK} strokeWidth="1.6" />
      {variant === "sarah" ? (
        <path d="M17 28 q3 -16 15 -16 t15 16 q-4 -8 -15 -8 t-15 8" fill={hair} opacity="0.85" />
      ) : (
        <path d="M18 26 q4 -14 14 -14 t14 14 q-5 -6 -14 -6 t-14 6" fill={hair} opacity="0.85" />
      )}
      <circle cx="26" cy="29" r="1.8" fill={NAVY_INK} />
      <circle cx="38" cy="29" r="1.8" fill={NAVY_INK} />
      <path d={MOUTH[mood]} fill="none" stroke={NAVY_INK} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 58 q18 -14 36 0" fill="none" stroke={NAVY_INK} strokeWidth="1.6" />
    </svg>
  );
};

export default PatientAvatar;
