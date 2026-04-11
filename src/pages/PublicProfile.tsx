import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Video } from "lucide-react";
import PageSkeleton from "@/components/PageSkeleton";

const professionalLabels: Record<string, string> = {
  medico: "Médico(a)",
  psicologo: "Psicólogo(a)",
  nutricionista: "Nutricionista",
  fisioterapeuta: "Fisioterapeuta",
  fonoaudiologo: "Fonoaudiólogo(a)",
  dentista: "Cirurgião(ã)-Dentista",
  enfermeiro: "Enfermeiro(a)",
  outro: "Profissional de Saúde",
};

const dayLabels: Record<string, string> = {
  mon: "Segunda", tue: "Terça", wed: "Quarta", thu: "Quinta",
  fri: "Sexta", sat: "Sábado", sun: "Domingo",
};

const PublicProfile = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, professional_type, bio, avatar_url, consultation_price, available_hours, office_address, meet_link, user_id, profile_slug, slot_duration")
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
  const hours = profile.available_hours as Record<string, string[]> | null;
  const hasSlots = hours && Object.values(hours).some((slots) => (slots as string[]).length > 0);

  return (
    <>
      <SEOHead
        title={`${profile.name} — ${specialtyLabel} | SalbCare`}
        description={`Agende uma consulta com ${profile.name} pela SalbCare, a clínica digital popular do Brasil.`}
        canonical={`/p/${slug}`}
      />
      <div className="min-h-screen bg-background font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="mx-auto h-24 w-24 rounded-full object-cover border-2 border-primary/20" />
            ) : (
              <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                {profile.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{profile.name}</h1>
              <Badge variant="secondary" className="mt-2">{specialtyLabel}</Badge>
            </div>
            {profile.bio && <p className="text-muted-foreground text-sm max-w-md mx-auto">{profile.bio}</p>}
            {profile.office_address && (
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <MapPin className="h-3 w-3" /> {profile.office_address}
              </p>
            )}
          </div>

          {/* Price */}
          {profile.consultation_price && (
            <Card className="mb-6 border-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium">Valor da consulta</span>
                <span className="text-lg font-bold text-primary">
                  R$ {Number(profile.consultation_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </CardContent>
            </Card>
          )}

          {/* Available slots */}
          <Card className="mb-6">
            <CardContent className="p-4 space-y-3">
              <h2 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Horários disponíveis</h2>
              {hasSlots ? (
                <div className="space-y-2">
                  {Object.entries(hours!).map(([day, slots]) => {
                    const s = slots as string[];
                    if (s.length === 0) return null;
                    return (
                      <div key={day} className="flex items-start gap-3">
                        <span className="text-xs font-medium text-muted-foreground w-16 shrink-0 pt-0.5">{dayLabels[day] || day}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {s.map((slot) => (
                            <Badge key={slot} variant="outline" className="text-xs">{slot}</Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">Sem horários disponíveis no momento</p>
              )}
            </CardContent>
          </Card>

          {/* CTA */}
          {hasSlots && (
            <Button asChild size="lg" className="w-full text-base py-6 rounded-xl font-bold">
              <Link to={`/booking?professional=${profile.user_id}`}>
                <Video className="mr-2 h-5 w-5" /> Agendar consulta
              </Link>
            </Button>
          )}

          <div className="mt-8 text-center">
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
