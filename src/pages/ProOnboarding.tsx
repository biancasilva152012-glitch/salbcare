import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CREAM, GOLD, MONO, NAVY, PRO_FONTS_HREF, ProLabel, TEAL, proStyles } from "@/components/pro/brand";

const LANGUAGES = ["Portugues", "Ingles", "Espanhol"];

export type ProProfileForm = {
  name: string;
  profession: string;
  registration_number: string;
  city: string;
  languages: string[];
  description: string;
  description_en: string;
  whatsapp: string;
  instagram: string;
  image_url: string;
};

export const emptyProfile: ProProfileForm = {
  name: "",
  profession: "",
  registration_number: "",
  city: "",
  languages: ["Portugues"],
  description: "",
  description_en: "",
  whatsapp: "",
  instagram: "",
  image_url: "",
};

/** Formulário de perfil compartilhado entre onboarding e painel. */
export const ProProfileFields = ({
  form,
  setForm,
  userId,
}: {
  form: ProProfileForm;
  setForm: (f: ProProfileForm) => void;
  userId: string;
}) => {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/pro-profile/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("professional-assets").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Nao foi possivel enviar a foto.");
    } else {
      const { data } = supabase.storage.from("professional-assets").getPublicUrl(path);
      setForm({ ...form, image_url: data.publicUrl });
    }
    setUploading(false);
  };

  const field = (label: string, key: keyof ProProfileForm, placeholder = "") => (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, color: "rgba(244,238,226,0.7)" }}>{label}</span>
      <input
        className="pro-input"
        value={form[key] as string}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </label>
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {field("Nome como aparece na vitrine", "name", "Dra. Maria Silva")}
      <div className="pro-grid2">
        {field("Profissao", "profession", "Fisioterapeuta")}
        {field("Registro profissional", "registration_number", "CREFITO 00000")}
      </div>
      <div className="pro-grid2">
        {field("Cidade de atuacao", "city", "Ilha do Guajiru")}
        {field("WhatsApp de contato", "whatsapp", "5588999999999")}
      </div>
      {field("Instagram", "instagram", "@seuperfil")}

      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, color: "rgba(244,238,226,0.7)" }}>Idiomas atendidos</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LANGUAGES.map((l) => {
            const on = form.languages.includes(l);
            return (
              <button
                key={l}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setForm({
                    ...form,
                    languages: on ? form.languages.filter((x) => x !== l) : [...form.languages, l],
                  })
                }
                style={{
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontFamily: MONO,
                  cursor: "pointer",
                  background: on ? TEAL : "transparent",
                  color: on ? NAVY : CREAM,
                  border: `1px solid ${on ? TEAL : "rgba(244,238,226,0.25)"}`,
                }}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, color: "rgba(244,238,226,0.7)" }}>Apresentacao em portugues</span>
        <textarea
          className="pro-input"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, color: "rgba(244,238,226,0.7)" }}>Apresentacao em ingles</span>
        <textarea
          className="pro-input"
          rows={4}
          value={form.description_en}
          onChange={(e) => setForm({ ...form, description_en: e.target.value })}
        />
      </label>

      <div style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 12, color: "rgba(244,238,226,0.7)" }}>
          Foto de perfil (opcional, voce pode adicionar depois)
        </span>
        {form.image_url && (
          <img
            src={form.image_url}
            alt="Previa da foto de perfil"
            loading="lazy"
            style={{ width: 96, height: 96, borderRadius: 12, objectFit: "cover", objectPosition: "center 25%" }}
          />
        )}
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
          style={{ fontSize: 12, color: "rgba(244,238,226,0.7)" }}
        />
      </div>
    </div>
  );
};

const ProOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProProfileForm>(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("local_partners")
      .select("*")
      .eq("owner_user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
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
      });
  }, [user]);

  const publish = async () => {
    if (!user) return;
    if (!form.name || !form.profession || !form.city) {
      toast.error("Preencha nome, profissao e cidade.");
      return;
    }
    setSaving(true);
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
        is_published: true,
        active: true,
      },
      { onConflict: "owner_user_id" },
    );
    setSaving(false);
    if (error) {
      toast.error("Nao foi possivel publicar o perfil.");
      return;
    }
    toast.success("Perfil publicado na vitrine.");
    navigate("/pro/painel");
  };

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: MONO }}>
      <Helmet>
        <title>Complete seu perfil. SalbCare Pro</title>
        <meta name="robots" content="noindex" />
        <link rel="stylesheet" href={PRO_FONTS_HREF} />
      </Helmet>
      <style>{proStyles}</style>

      <section className="pro-wrap" style={{ paddingTop: 48, paddingBottom: 32 }}>
        <ProLabel>Passo {step} de 2</ProLabel>
        <h1 className="pro-h1" style={{ fontSize: 32 }}>
          {step === 1 ? "Complete seu perfil" : "Revise e publique"}
        </h1>
      </section>

      <section className="pro-wrap" style={{ paddingBottom: 64 }}>
        <div className="pro-card">
          {step === 1 ? (
            <ProProfileFields form={form} setForm={setForm} userId={user?.id ?? ""} />
          ) : (
            <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
              <div style={{ fontFamily: "'Gloock', Georgia, serif", fontSize: 22 }}>{form.name}</div>
              <div style={{ color: "rgba(244,238,226,0.7)" }}>
                {form.profession} {form.registration_number ? `· ${form.registration_number}` : ""}
              </div>
              <div style={{ color: "rgba(244,238,226,0.7)" }}>{form.city}</div>
              <div style={{ color: "rgba(244,238,226,0.7)" }}>{form.languages.join(", ")}</div>
              <p style={{ margin: 0, lineHeight: 1.6, color: "rgba(244,238,226,0.8)" }}>{form.description}</p>
            </div>
          )}

          {step === 1 ? (
            <button className="pro-cta" style={{ background: TEAL, color: NAVY, marginTop: 22 }} onClick={() => setStep(2)}>
              Continuar
            </button>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 22 }}>
              <button className="pro-cta" style={{ background: GOLD, color: NAVY }} disabled={saving} onClick={publish}>
                {saving ? "Publicando" : "Publicar na vitrine"}
              </button>
              <button
                className="pro-cta"
                style={{ background: "transparent", color: CREAM, border: "1px solid rgba(244,238,226,0.25)" }}
                onClick={() => setStep(1)}
              >
                Voltar e editar
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProOnboarding;
