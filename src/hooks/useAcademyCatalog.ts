import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ACADEMY_PRODUCTS, type AcademyProduct } from "@/config/academy";

const formatPrice = (cents: number | null) =>
  cents == null ? undefined : `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

/**
 * Catálogo da Academy vindo do banco (itens publicados na administração).
 * Se o banco não responder, o site continua com o catálogo estático.
 */
export const useAcademyCatalog = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["academy-catalog"],
    staleTime: 60_000,
    queryFn: async (): Promise<AcademyProduct[]> => {
      const { data, error } = await supabase
        .from("academy_products")
        .select("*")
        .eq("published", true)
        .order("sort_order");
      if (error || !data?.length) return ACADEMY_PRODUCTS;
      return data.map((row) => ({
        slug: row.slug,
        title: row.title,
        format: "apostila",
        formatLabel: row.format_label,
        status: row.status === "available" ? "available" : "soon",
        statusLabel: row.status_label,
        price: formatPrice(row.price_cents),
        summary: row.summary,
        description: row.description ?? [],
        contents: row.contents ?? [],
        audience: row.audience,
      }));
    },
  });

  const products = data ?? ACADEMY_PRODUCTS;
  return { products, isLoading };
};

export const useAcademyProduct = (slug?: string) => {
  const { products, isLoading } = useAcademyCatalog();
  return { product: products.find((p) => p.slug === slug), isLoading };
};
