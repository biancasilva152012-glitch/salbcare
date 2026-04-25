import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Sugestões dinâmicas para o formulário financeiro.
 *
 * Combina dois sinais:
 *  1. O tipo profissional do usuário (ex: psicologo, dentista, nutricionista)
 *     → vocabulário inicial mais natural ("Sessão de psicoterapia",
 *       "Limpeza dental", "Plano alimentar"…).
 *  2. As descrições/categorias mais usadas pelo próprio usuário no mês
 *     corrente → reforçamos primeiro o que ele já registrou (autonomia
 *     editorial >  template).
 *
 * Também expomos `nextBusinessDay()`: profissionais autônomos costumam
 * cobrar/pagar em dia útil, então quando o wizard sugere "agora" preferimos
 * pular sábado/domingo.
 */

export type FinancialType = "income" | "expense";

interface RawTx {
  description: string | null;
  category: string | null;
  type: string;
  date: string;
}

const PROFESSION_DEFAULTS: Record<
  string,
  { income: { description: string; category: string }; expense: { description: string; category: string } }
> = {
  medico: {
    income: { description: "Consulta particular", category: "consulta" },
    expense: { description: "Aluguel do consultório", category: "aluguel" },
  },
  psicologo: {
    income: { description: "Sessão de psicoterapia", category: "consulta" },
    expense: { description: "Aluguel da sala", category: "aluguel" },
  },
  dentista: {
    income: { description: "Procedimento odontológico", category: "consulta" },
    expense: { description: "Material clínico", category: "material" },
  },
  nutricionista: {
    income: { description: "Consulta + plano alimentar", category: "consulta" },
    expense: { description: "Marketing digital", category: "marketing" },
  },
  fisioterapeuta: {
    income: { description: "Sessão de fisioterapia", category: "consulta" },
    expense: { description: "Equipamento", category: "equipamento" },
  },
  esteticista: {
    income: { description: "Procedimento estético", category: "consulta" },
    expense: { description: "Insumos e produtos", category: "material" },
  },
};

const FALLBACK = PROFESSION_DEFAULTS.medico;

const SUGGESTION_POOL: Record<FinancialType, string[]> = {
  income: [
    "Consulta particular",
    "Pacote de sessões",
    "Retorno",
    "Atendimento online",
    "Procedimento",
  ],
  expense: [
    "Aluguel do consultório",
    "Marketing digital",
    "Material clínico",
    "Plano de saúde profissional",
    "Imposto / contador",
    "Equipamento",
  ],
};

export interface FinancialSuggestions {
  isLoading: boolean;
  professionalType: string;
  /** Sugestão padrão para o wizard (descrição + categoria por tipo). */
  defaultFor: (type: FinancialType) => { description: string; category: string };
  /** Lista combinada (histórico do mês primeiro, depois pool padrão). */
  suggestionsFor: (type: FinancialType) => string[];
  /** Próximo dia útil (yyyy-MM-dd). */
  nextBusinessDay: () => string;
}

function nextBusinessDay(from: Date = new Date()): string {
  const d = new Date(from);
  // Se hoje for sex/sáb/dom, pula para segunda. Caso contrário, usa hoje.
  const day = d.getDay();
  if (day === 6) d.setDate(d.getDate() + 2); // sábado → segunda
  else if (day === 0) d.setDate(d.getDate() + 1); // domingo → segunda
  return format(d, "yyyy-MM-dd");
}

export function useFinancialSuggestions(): FinancialSuggestions {
  const { user } = useAuth();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile-professional-type", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("professional_type")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: recent = [], isLoading: loadingRecent } = useQuery({
    queryKey: ["financial-recent-suggestions", user?.id],
    queryFn: async () => {
      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
      const { data } = await supabase
        .from("financial_transactions")
        .select("description, category, type, date")
        .eq("user_id", user!.id)
        .gte("date", monthStart)
        .order("date", { ascending: false })
        .limit(50);
      return (data || []) as RawTx[];
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  return useMemo<FinancialSuggestions>(() => {
    const professionalType = profile?.professional_type || "medico";
    const defaults = PROFESSION_DEFAULTS[professionalType] || FALLBACK;

    const defaultFor = (type: FinancialType) => defaults[type];

    const suggestionsFor = (type: FinancialType) => {
      const recentDescriptions = recent
        .filter((t) => t.type === type)
        .map((t) => (t.description || "").trim())
        .filter(Boolean);
      // dedupe preservando ordem (mais recente primeiro)
      const seen = new Set<string>();
      const merged: string[] = [];
      const addAll = (arr: string[]) => {
        for (const item of arr) {
          const key = item.toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            merged.push(item);
          }
        }
      };
      addAll(recentDescriptions);
      addAll(SUGGESTION_POOL[type]);
      return merged.slice(0, 8);
    };

    return {
      isLoading: loadingProfile || loadingRecent,
      professionalType,
      defaultFor,
      suggestionsFor,
      nextBusinessDay: () => nextBusinessDay(),
    };
  }, [profile, recent, loadingProfile, loadingRecent]);
}
