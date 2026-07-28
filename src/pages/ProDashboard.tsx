import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProSubscription } from "@/hooks/useProSubscription";
import { CREAM, GOLD, MONO, NAVY, PRO_FONTS_HREF, ProLabel, TEAL, proStyles } from "@/components/pro/brand";
import { ProProfileFields, ProProfileForm, emptyProfile } from "./ProOnboarding";

type TabKey = "perfil" | "agenda" | "materiais" | "assinatura";

const TABS: { key: TabKey; label: string }[] = [
  { key: "perfil", label: "Meu perfil" },
  { key: "agenda", label: "Agenda" },
  { key: "materiais", label: "Materiais" },
  { key: "assinatura", label: "Assinatura" },
];

type Appointment = {
  id: string;
  patient_name: string;
  scheduled_at: string;
  service: string | null;
  status: string;
};

const ProDashboard = () => {
  const { user } = useAuth();
  const { subscription } = useProSubscription();
  const [tab, setTab] = useState<TabKey>("perfil");

  const [form, setForm] = useState<ProProfileForm>(emptyProfile);
  const [published, setPublished] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [newAppt, setNewAppt] = useState({ patient_name: "", scheduled_at: "", service: "" });

  const [materials, setMaterials] = useState<{ name: string }[]>([]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("local_partners").select("*").eq("owner_user_id", user.id).maybeSingle();
    if (data) {
      setPublished(!!data.is_published);
      setForm({
        name: data.name ?? "",
        profession: data.profession ?? "",
        registration_number: data.registration_number ?? "",
        city: data.city ?? "",
        languages: data.languages?.length ? data.languages : ["Portugues"],
        description: data.description ?? "",
        description_en: data.description_en ?? "",
        whatsapp: data.whatsapp ?? "",
        instagram: data.instagram ?? "",
        image_url: data.image_url ?? "",
      });
    }
  }, [user]);

  const loadAppointments = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("pro_appointments")
      .select("id, patient_name, scheduled_at, service, status")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: true });
    setAppointments((data as Appointment[]) ?? []);
  }, [user]);

  const loadMaterials = useCallback(async () => {
    const { data } = await supabase.storage.from("pro-materials").list("", { limit: 50 });
    setMaterials((data ?? []).filter((f) => f.name && !f.name.startsWith(".")).map((f) => ({ name: f.name })));
  }, []);

  useEffect(() => {
    loadProfile();
    loadAppointments();
    loadMaterials();
  }, [loadProfile, loadAppointments, loadMaterials]);

  const saveProfile = async (publish: boolean) => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("local_partners").upsert(
      {
        owner_user_id: user.id,
        name: form.name,
        category: "health",
        profession: form.profession,
        registration_number: form.registration_number || null,
        city: form.city,
        location: form.city,
        languages: form.languages,
        description: form.description || null,
        description_en: form.description_en || null,
        whatsapp: form.whatsapp || null,
        instagram: form.instagram || null,
        image_url: form.image_url || null,
        is_published: publish,
        active: true,
      },
      { onConflict: "owner_user_id" },
    );
    setSavingProfile(false);
    if (error) {
      toast.error("Nao foi possivel salvar.");
      return;
    }
    setPublished(publish);
    toast.success(publish ? "Perfil publicado." : "Perfil salvo e despublicado.");
  };

  const addAppointment = async () => {
    if (!user) return;
    if (!newAppt.patient_name || !newAppt.scheduled_at) {
      toast.error("Informe paciente e data.");
      return;
    }
    const { error } = await supabase.from("pro_appointments").insert({
      user_id: user.id,
      patient_name: newAppt.patient_name,
      scheduled_at: new Date(newAppt.scheduled_at).toISOString(),
      service: newAppt.service || null,
    });
    if (error) {
      toast.error("Nao foi possivel salvar o atendimento.");
      return;
    }
    setNewAppt({ patient_name: "", scheduled_at: "", service: "" });
    loadAppointments();
  };

  const removeAppointment = async (id: string) => {
    await supabase.from("pro_appointments").delete().eq("id", id);
    loadAppointments();
  };

  const downloadMaterial = async (name: string) => {
    const { data, error } = await supabase.storage.from("pro-materials").createSignedUrl(name, 120);
    if (error || !data?.signedUrl) {
      toast.error("Material indisponivel.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke("pro-portal");
    if (error || !data?.url) {
      toast.error("Nao foi possivel abrir a gestao da assinatura.");
      return;
    }
    window.location.href = data.url;
  };

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: MONO }}>
      <Helmet>
        <title>Painel. SalbCare Pro</title>
        <meta name="robots" content="noindex" />
        <link rel="stylesheet" href={PRO_FONTS_HREF} />
      </Helmet>
      <style>{proStyles}</style>

      <header
        className="pro-wrap"
        style={{ paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <Link to="/" style={{ color: "rgba(244,238,226,0.7)", fontSize: 12, textDecoration: "none" }}>
          Voltar ao site
        </Link>
        <span style={{ fontSize: 12, color: published ? TEAL : "rgba(244,238,226,0.6)" }}>
          {published ? "Perfil publicado" : "Perfil nao publicado"}
        </span>
      </header>

      <section className="pro-wrap" style={{ paddingTop: 40, paddingBottom: 20 }}>
        <ProLabel>SalbCare Pro</ProLabel>
        <h1 className="pro-h1" style={{ fontSize: 32 }}>Painel</h1>
      </section>

      <nav className="pro-wrap" style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 20 }}>
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-current={on ? "page" : undefined}
              style={{
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 12,
                fontFamily: MONO,
                cursor: "pointer",
                background: on ? CREAM : "transparent",
                color: on ? NAVY : CREAM,
                border: `1px solid ${on ? CREAM : "rgba(244,238,226,0.25)"}`,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      <section className="pro-wrap" style={{ paddingBottom: 72 }}>
        {tab === "perfil" && (
          <div className="pro-card">
            <ProProfileFields form={form} setForm={setForm} userId={user?.id ?? ""} />
            <div style={{ display: "grid", gap: 10, marginTop: 22 }}>
              <button
                className="pro-cta"
                style={{ background: GOLD, color: NAVY }}
                disabled={savingProfile}
                onClick={() => saveProfile(true)}
              >
                {savingProfile ? "Salvando" : "Salvar e publicar"}
              </button>
              {published && (
                <button
                  className="pro-cta"
                  style={{ background: "transparent", color: CREAM, border: "1px solid rgba(244,238,226,0.25)" }}
                  onClick={() => saveProfile(false)}
                >
                  Despublicar da vitrine
                </button>
              )}
            </div>
          </div>
        )}

        {tab === "agenda" && (
          <div style={{ display: "grid", gap: 18 }}>
            <div className="pro-card" style={{ display: "grid", gap: 12 }}>
              <ProLabel>Novo atendimento</ProLabel>
              <input
                className="pro-input"
                placeholder="Nome do paciente"
                value={newAppt.patient_name}
                onChange={(e) => setNewAppt({ ...newAppt, patient_name: e.target.value })}
              />
              <input
                className="pro-input"
                type="datetime-local"
                value={newAppt.scheduled_at}
                onChange={(e) => setNewAppt({ ...newAppt, scheduled_at: e.target.value })}
              />
              <input
                className="pro-input"
                placeholder="Servico (opcional)"
                value={newAppt.service}
                onChange={(e) => setNewAppt({ ...newAppt, service: e.target.value })}
              />
              <button className="pro-cta" style={{ background: TEAL, color: NAVY }} onClick={addAppointment}>
                Adicionar
              </button>
            </div>

            <div className="pro-card" style={{ display: "grid", gap: 12 }}>
              <ProLabel>Proximos atendimentos</ProLabel>
              {appointments.length === 0 && (
                <p style={{ margin: 0, fontSize: 13, color: "rgba(244,238,226,0.6)" }}>Nenhum atendimento agendado.</p>
              )}
              {appointments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    borderTop: "1px solid rgba(244,238,226,0.12)",
                    paddingTop: 10,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.patient_name}</div>
                    <div style={{ color: "rgba(244,238,226,0.65)" }}>
                      {new Date(a.scheduled_at).toLocaleString("pt-BR")} {a.service ? `· ${a.service}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => removeAppointment(a.id)}
                    style={{ background: "none", border: "none", color: "rgba(244,238,226,0.6)", cursor: "pointer", fontSize: 12 }}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "materiais" && (
          <div className="pro-card" style={{ display: "grid", gap: 12 }}>
            <ProLabel>Materiais de atendimento</ProLabel>
            {materials.length === 0 && (
              <p style={{ margin: 0, fontSize: 13, color: "rgba(244,238,226,0.6)" }}>
                Os materiais aparecem aqui assim que forem publicados pela equipe.
              </p>
            )}
            {materials.map((m) => (
              <button
                key={m.name}
                onClick={() => downloadMaterial(m.name)}
                style={{
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  borderTop: "1px solid rgba(244,238,226,0.12)",
                  paddingTop: 10,
                  color: CREAM,
                  fontFamily: MONO,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}

        {tab === "assinatura" && (
          <div className="pro-card" style={{ display: "grid", gap: 12 }}>
            <ProLabel>Assinatura</ProLabel>
            <div style={{ fontSize: 14 }}>
              Plano {subscription?.plan === "annual" ? "Anual Fundador" : "Mensal"} · status {subscription?.status}
            </div>
            {subscription?.current_period_end && (
              <div style={{ fontSize: 13, color: "rgba(244,238,226,0.65)" }}>
                Proxima renovacao em {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
              </div>
            )}
            <button className="pro-cta" style={{ background: GOLD, color: NAVY }} onClick={openPortal}>
              Gerenciar pagamento
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProDashboard;
