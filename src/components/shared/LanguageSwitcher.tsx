import { useEffect, useState } from "react";

export type HubLang = "pt" | "en" | "es";

const STORAGE_KEY = "salbcare_lang";

export function detectInitialLang(): HubLang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY) as HubLang | null;
  if (stored === "pt" || stored === "en" || stored === "es") return stored;
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("pt")) return "pt";
  if (nav.startsWith("es")) return "es";
  return "en";
}

interface Props {
  value: HubLang;
  onChange: (lang: HubLang) => void;
  className?: string;
}

export default function LanguageSwitcher({ value, onChange, className = "" }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const langs: HubLang[] = ["pt", "en", "es"];
  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-1 ${className}`}
    >
      {langs.map((l) => {
        const active = l === value;
        return (
          <button
            key={l}
            type="button"
            onClick={() => {
              window.localStorage.setItem(STORAGE_KEY, l);
              onChange(l);
            }}
            aria-pressed={active}
            className={`px-2.5 py-1 text-xs font-medium uppercase tracking-wider rounded-full transition-colors ${
              active ? "bg-white text-brand-dark" : "text-white/70 hover:text-white"
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
