import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Users } from "lucide-react";

const ReferralCard = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralLink = `salbcare.com.br/register?ref=${user?.id}`;

  const { data: referralCount = 0 } = useQuery({
    queryKey: ["referral-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referral_code" as any, user!.id);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`https://${referralLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Indique um colega</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-background border border-border/60 px-3 py-2 text-xs text-muted-foreground truncate font-mono">
            {referralLink}
          </div>
          <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 gap-1.5">
            {copied ? <><Check className="h-3.5 w-3.5" /> Copiado!</> : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{referralCount} colega{referralCount !== 1 ? "s" : ""} indicado{referralCount !== 1 ? "s" : ""}</p>
          <p className="text-[10px] text-muted-foreground">Cada indicação ajuda a SalbCare a crescer 🙌</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
