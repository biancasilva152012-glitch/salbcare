import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Mail, Phone, Award } from "lucide-react";
import PageSkeleton from "@/components/PageSkeleton";

const professionalLabels: Record<string, string> = {
  medico: "Médico(a)",
  psicologo: "Psicólogo(a)",
  nutricionista: "Nutricionista",
  fisioterapeuta: "Fisioterapeuta",
  fonoaudiologo: "Fonoaudiólogo(a)",
  dentista: "Cirurgião(ã)-Dentista",
  outro: "Profissional de Saúde",
};

const PublicProfile = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, professional_type, bio, phone, email, profile_slug, council_number, council_state")
        .eq("profile_slug", slug!)
        .eq("user_type", "professional")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="min-h-screen bg-background p-6"><PageSkeleton variant="list" /></div>;

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Profissional não encontrado</h1>
          <p className="text-muted-foreground">Este perfil não existe ou foi removido.</p>
          <Button asChild><Link to="/">Voltar ao início</Link></Button>
        </div>
      </div>
    );
  }

  const specialtyLabel = professionalLabels[profile.professional_type] || profile.professional_type;
  const whatsappNumber = profile.phone?.replace(/\D/g, "");
  const councilDisplay = profile.council_number
    ? `${profile.council_number}${profile.council_state ? ` / ${profile.council_state}` : ""}`
    : null;

  return (
    <>
      <SEOHead
        title={`${profile.name} — ${specialtyLabel} | SalbCare`}
        description={`Entre em contato com ${profile.name} pela SalbCare, a clínica digital popular do Brasil.`}
        canonical={`/p/${slug}`}
      />
      <div className="min-h-screen bg-background font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
          <div className="text-center space-y-4">
            <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
              {profile.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{profile.name}</h1>
              <Badge variant="secondary" className="mt-2">{specialtyLabel}</Badge>
            </div>
            {profile.bio && (
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">{profile.bio}</p>
            )}
          </div>

          {/* Info section */}
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            {councilDisplay && (
              <div className="flex items-center justify-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <span>{councilDisplay}</span>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center justify-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>{profile.email}</span>
              </div>
            )}
          </div>

          {/* CTA buttons */}
          <div className="mt-8 space-y-3">
            {whatsappNumber && (
              <Button asChild size="lg" className="w-full py-6 rounded-xl font-bold text-base gap-2">
                <a
                  href={`https://wa.me/${whatsappNumber.startsWith("55") ? whatsappNumber : `55${whatsappNumber}`}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-5 w-5" /> Contato via WhatsApp
                </a>
              </Button>
            )}
            {profile.email && (
              <Button asChild variant="outline" size="lg" className="w-full py-6 rounded-xl font-bold text-base gap-2">
                <a href={`mailto:${profile.email}`}>
                  <Mail className="h-5 w-5" /> Enviar e-mail
                </a>
              </Button>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Powered by SalbCare
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicProfile;
