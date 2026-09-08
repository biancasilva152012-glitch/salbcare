import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AcademyPrice = {
  slug: string;
  priceId: string | null;
  amountCents: number | null;
  currency: string | null;
  price: string | null;
  available: boolean;
};

/**
 * Preços e price_ids ativos dos materiais da Academy, buscados no Stripe
 * pela função academy-prices. Cache de 5 minutos no cliente e na função.
 * Se falhar, retorna vazio e a seção mostra "Consulte o preço".
 */
export const useAcademyPrices = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["academy-prices"],
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
    queryFn: async (): Promise<Record<string, AcademyPrice>> => {
      const { data, error } = await supabase.functions.invoke("academy-prices");
      if (error || !data?.items) return {};
      const map: Record<string, AcademyPrice> = {};
      for (const item of data.items as AcademyPrice[]) map[item.slug] = item;
      return map;
    },
  });

  return { prices: data ?? {}, isLoading };
};
