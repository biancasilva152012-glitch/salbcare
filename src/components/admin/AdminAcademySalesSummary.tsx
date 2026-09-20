import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, GraduationCap, Wallet } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

type Purchase = { id: string; slug: string; created_at: string };
type Certificate = { id: string; slug: string; code: string; holder_name: string; issued_at: string };
type Product = { slug: string; title: string; price_cents: number | null };

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdminAcademySalesSummary = () => {
  const { data: purchases = [] } = useQuery({
    queryKey: ["admin-academy-purchases"],
    queryFn: async (): Promise<Purchase[]> => {
      const { data, error } = await supabase
        .from("academy_purchases")
        .select("id, slug, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["admin-academy-certificates"],
    queryFn: async (): Promise<Certificate[]> => {
      const { data, error } = await supabase
        .from("academy_certificates")
        .select("id, slug, code, holder_name, issued_at")
        .order("issued_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-academy-products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase.from("academy_products").select("slug, title, price_cents");
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const rows = useMemo(() => {
    const titles = new Map(products.map((product) => [product.slug, product]));
    const bySlug = new Map<string, { title: string; sold: number; certificates: number; revenueCents: number }>();
    purchases.forEach((purchase) => {
      const product = titles.get(purchase.slug);
      const current = bySlug.get(purchase.slug) || {
        title: product?.title || purchase.slug.replace(/-/g, " "),
        sold: 0,
        certificates: 0,
        revenueCents: 0,
      };
      current.sold += 1;
      current.revenueCents += product?.price_cents ?? 0;
      bySlug.set(purchase.slug, current);
    });
    certificates.forEach((certificate) => {
      const product = titles.get(certificate.slug);
      const current = bySlug.get(certificate.slug) || {
        title: product?.title || certificate.slug.replace(/-/g, " "),
        sold: 0,
        certificates: 0,
        revenueCents: 0,
      };
      current.certificates += 1;
      bySlug.set(certificate.slug, current);
    });
    return Array.from(bySlug.values()).sort((a, b) => b.revenueCents - a.revenueCents);
  }, [certificates, products, purchases]);

  const totalRevenue = rows.reduce((sum, row) => sum + row.revenueCents, 0);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Academy</p>
        <h2 className="text-lg font-bold">Apostilas vendidas e certificados</h2>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-3">
          <GraduationCap className="h-4 w-4 text-secondary" />
          <p className="mt-2 font-mono text-xl font-semibold">{purchases.length}</p>
          <p className="text-xs text-muted-foreground">Apostilas vendidas</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <Award className="h-4 w-4 text-secondary" />
          <p className="mt-2 font-mono text-xl font-semibold">{certificates.length}</p>
          <p className="text-xs text-muted-foreground">Certificados gerados</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <Wallet className="h-4 w-4 text-secondary" />
          <p className="mt-2 font-mono text-xl font-semibold">{brl(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">Receita da Academy</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Nenhuma venda registrada ainda.
          </p>
        )}
        {rows.map((row) => (
          <div key={row.title} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background p-3">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold capitalize">{row.title}</p>
            <p className="text-xs text-muted-foreground">
              {row.sold} vendas · {row.certificates} certificados
            </p>
            <p className="font-mono text-sm font-semibold">{brl(row.revenueCents)}</p>
          </div>
        ))}
      </div>

      {certificates.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Últimos certificados</p>
          {certificates.slice(0, 6).map((certificate) => (
            <div key={certificate.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 text-sm last:border-0">
              <span className="font-medium">{certificate.holder_name}</span>
              <a className="font-mono text-secondary underline" href={`/certificado/${certificate.code}`} target="_blank" rel="noreferrer">
                {certificate.code}
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminAcademySalesSummary;
