import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Check, Copy, GraduationCap, Wallet } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Purchase = { id: string; slug: string; created_at: string };
type Certificate = { id: string; slug: string; code: string; holder_name: string; issued_at: string };
type Product = { slug: string; title: string; price_cents: number | null };

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdminAcademySalesSummary = () => {
  const [copied, setCopied] = useState<string | null>(null);

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

  const monthDelta = useMemo(() => {
    const now = new Date();
    const inMonth = (date: string, offset: number) => {
      const reference = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const parsed = new Date(date);
      return parsed.getFullYear() === reference.getFullYear() && parsed.getMonth() === reference.getMonth();
    };
    const current = purchases.filter((purchase) => inMonth(purchase.created_at, 0)).length;
    const previous = purchases.filter((purchase) => inMonth(purchase.created_at, 1)).length;
    if (!previous) return null;
    return Math.round(((current - previous) / previous) * 100);
  }, [purchases]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      toast.success("Código copiado.");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Não conseguimos copiar o código.");
    }
  };

  const kpis = [
    { icon: GraduationCap, value: String(purchases.length), label: "Apostilas vendidas", tint: "bg-accent text-secondary", delta: monthDelta },
    { icon: Award, value: String(certificates.length), label: "Certificados gerados", tint: "bg-accent text-secondary", delta: null },
    { icon: Wallet, value: brl(totalRevenue), label: "Receita da Academy", tint: "bg-gold/10 text-gold", delta: null },
  ];

  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <p className="admin-eyebrow">Academy</p>
        <h2 className="text-lg leading-snug sm:text-xl">Apostilas vendidas e certificados</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="admin-card p-4">
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", kpi.tint)}>
              <kpi.icon className="h-4 w-4" />
            </span>
            <p className="admin-num mt-3 text-2xl font-semibold leading-none">{kpi.value}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">{kpi.label}</p>
            {typeof kpi.delta === "number" && (
              <p className={cn("admin-num mt-2 text-[11px] font-semibold", kpi.delta >= 0 ? "text-secondary" : "text-destructive")}>
                {kpi.delta >= 0 ? "+" : ""}{kpi.delta}% vs mês anterior
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-semibold">Nenhuma venda registrada ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">As compras aparecem aqui assim que o pagamento é confirmado.</p>
          </div>
        ) : (
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="admin-eyebrow px-4 py-3 font-semibold sm:px-5">Produto</th>
                <th className="admin-eyebrow w-24 px-2 py-3 text-right font-semibold sm:w-32 sm:px-5">Vendas</th>
                <th className="admin-eyebrow w-28 px-4 py-3 text-right font-semibold sm:w-36 sm:px-5">Receita</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.title} className="border-b border-border transition-colors last:border-0 hover:bg-muted/60">
                  <td className="px-4 py-3.5 sm:px-5">
                    <p className="truncate text-sm font-semibold capitalize">{row.title}</p>
                    <p className="admin-num text-xs text-muted-foreground">{row.certificates} certificados</p>
                  </td>
                  <td className="admin-num px-2 py-3.5 text-right text-sm text-muted-foreground sm:px-5">{row.sold}</td>
                  <td className="admin-num px-4 py-3.5 text-right text-sm font-semibold text-gold sm:px-5">{brl(row.revenueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {certificates.length > 0 && (
        <div className="admin-card overflow-hidden">
          <p className="admin-eyebrow border-b border-border px-4 py-3 sm:px-5">Últimos certificados</p>
          <div className="divide-y divide-border">
            {certificates.slice(0, 6).map((certificate) => (
              <div key={certificate.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 sm:px-5">
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{certificate.holder_name}</p>
                <a
                  className="admin-num shrink-0 text-xs font-semibold text-secondary hover:underline"
                  href={`/certificado/${certificate.code}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {certificate.code}
                </a>
                <button
                  type="button"
                  aria-label={`Copiar código ${certificate.code}`}
                  onClick={() => copyCode(certificate.code)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {copied === certificate.code ? <Check className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminAcademySalesSummary;
