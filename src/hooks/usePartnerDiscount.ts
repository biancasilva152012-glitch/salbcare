import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PartnerDiscount {
  slug: string;
  name: string;
  discountPercent: number;
}

const STORAGE_KEY = "salbcare_partner_ref";

/**
 * Loads the partner discount for the current user (or from URL ?ref=).
 *
 * Priority:
 * 1. URL ?ref= param (if present, persisted to sessionStorage so it survives signup redirects)
 * 2. profiles.referred_by (for already-logged-in users)
 * 3. sessionStorage fallback (for fresh signups before profile is queryable)
 */
export function usePartnerDiscount() {
  const { user } = useAuth();
  const [partner, setPartner] = useState<PartnerDiscount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const resolveSlug = async (): Promise<string | null> => {
      // 1. URL param
      const urlSlug = new URLSearchParams(window.location.search).get("ref");
      if (urlSlug) {
        sessionStorage.setItem(STORAGE_KEY, urlSlug.toLowerCase().trim());
        return urlSlug.toLowerCase().trim();
      }

      // 2. Logged-in user → read referred_by from profile
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("referred_by")
          .eq("user_id", user.id)
          .maybeSingle();
        const refBy = (data as any)?.referred_by;
        if (refBy) return String(refBy).toLowerCase().trim();
      }

      // 3. Session fallback
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? stored.toLowerCase().trim() : null;
    };

    (async () => {
      setLoading(true);
      try {
        const slug = await resolveSlug();
        if (!slug) {
          if (!cancelled) setPartner(null);
          return;
        }

        const { data, error } = await supabase.rpc("get_partner_by_slug", { _slug: slug });
        if (error) {
          console.error("[usePartnerDiscount] RPC error:", error);
          if (!cancelled) setPartner(null);
          return;
        }

        const row = Array.isArray(data) ? data[0] : null;
        if (row && row.status === "active" && Number(row.discount_percent) > 0) {
          if (!cancelled) {
            setPartner({
              slug: row.slug,
              name: row.name,
              discountPercent: Number(row.discount_percent),
            });
          }
        } else {
          if (!cancelled) setPartner(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const applyDiscount = (price: number): number => {
    if (!partner) return price;
    const discounted = price * (1 - partner.discountPercent / 100);
    return Math.round(discounted * 100) / 100;
  };

  return { partner, loading, applyDiscount };
}
