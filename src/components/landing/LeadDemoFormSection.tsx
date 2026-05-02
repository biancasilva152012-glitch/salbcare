// Seção — "Conheça a plataforma na prática"
// Captura de lead → tabela leads_demo + edge function notify-new-lead (CallMeBot).
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackCtaClick, trackUnified } from "@/hooks/useTracking";

const NAVY = "#0D1B2A";
const TEAL = "#00B4A0";
const TEAL_DARK = "#009986";
const TEXT_MUTED = "#64748B";
const BORDER = "#E2E8F0";
const SURFACE = "#F8F9FA";

const leadSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  dor_principal: z.string().trim().min(5, "Conte um pouco mais").max(1000),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\(\d{2}\) \d{5}-\d{4}$/, "WhatsApp deve estar no formato (XX) XXXXX-XXXX"),
});

const maskWhatsApp = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const LeadDemoFormSection = () => {
  const [form, setForm] = useState({ nome: "", email: "", dor_principal: "", whatsapp: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onChange = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: k === "whatsapp" ? maskWhatsApp(v) : v }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0]?.toString();
        if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const payload = parsed.data as {
        nome: string; email: string; dor_principal: string; whatsapp: string;
      };
      const { data, error } = await supabase
        .from("leads_demo")
        .insert([payload])
        .select("id")
        .single();

      if (error) throw error;

      // Notificação WhatsApp — fire & forget (não bloqueia confirmação)
      supabase.functions
        .invoke("notify-new-lead", { body: { lead_id: data.id } })
        .catch((err) => console.warn("notify-new-lead falhou", err));

      trackCtaClick("lead_demo_submit", "landing_lead_form");
      trackUnified("lead_demo_submitted", { source: "landing_lead_form" });
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível enviar agora. Tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="lead-demo-title"
      style={{
        background: SURFACE,
        padding: "96px 0",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        .ld-card {
          background: #FFFFFF;
          border: 1px solid ${BORDER};
          border-radius: 20px;
          padding: 36px;
          box-shadow: 0 14px 40px rgba(13,27,42,0.06);
        }
        .ld-label { color: ${NAVY}; font-weight: 600; font-size: 14.5px; margin-bottom: 8px; display: block; }
        .ld-input {
          width: 100%; background: #FFFFFF; color: ${NAVY};
          border: 1.5px solid ${BORDER}; border-radius: 10px;
          padding: 13px 14px; font-size: 15.5px; font-family: inherit;
          transition: border-color 150ms ease, box-shadow 150ms ease;
          min-height: 48px;
        }
        .ld-input:focus { outline: none; border-color: ${TEAL}; box-shadow: 0 0 0 3px rgba(0,180,160,0.15); }
        .ld-input.error { border-color: #DC2626; }
        .ld-error { color: #DC2626; font-size: 13px; margin-top: 6px; }
        .ld-submit {
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          background: ${TEAL}; color: #FFFFFF;
          font-weight: 700; font-size: 16px;
          padding: 16px 28px; border-radius: 12px; border: none; cursor: pointer;
          box-shadow: 0 6px 20px rgba(0,180,160,0.28);
          transition: background 180ms ease, transform 180ms ease;
          min-height: 56px; width: 100%;
        }
        .ld-submit:hover:not(:disabled) { background: ${TEAL_DARK}; transform: translateY(-1px); }
        .ld-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        @media (max-width: 540px) { .ld-card { padding: 24px 20px; } }
      `}</style>

      <div className="mx-auto max-w-2xl px-5 sm:px-6">
        <p
          style={{
            textAlign: "center",
            color: TEAL,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Demonstração guiada
        </p>
        <h2
          id="lead-demo-title"
          style={{
            textAlign: "center",
            color: NAVY,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            fontSize: "clamp(28px, 4.5vw, 42px)",
            margin: 0,
          }}
        >
          Conheça a plataforma <span style={{ color: TEAL }}>na prática</span>
        </h2>
        <p
          style={{
            textAlign: "center",
            color: TEXT_MUTED,
            fontSize: 17,
            lineHeight: 1.55,
            marginTop: 14,
            marginBottom: 40,
          }}
        >
          Entraremos em contato para agendar sua demonstração.
        </p>

        <div className="ld-card">
          {done ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <CheckCircle2 size={56} color={TEAL} style={{ margin: "0 auto 16px" }} />
              <h3 style={{ color: NAVY, fontWeight: 800, fontSize: 22, margin: 0 }}>
                Recebemos seus dados!
              </h3>
              <p style={{ color: TEXT_MUTED, fontSize: 15.5, lineHeight: 1.6, marginTop: 12 }}>
                Em breve entraremos em contato pelo WhatsApp para agendar sua demonstração.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="ld-nome" className="ld-label">Qual é o seu nome completo?</label>
                <input
                  id="ld-nome"
                  type="text"
                  autoComplete="name"
                  className={`ld-input ${errors.nome ? "error" : ""}`}
                  value={form.nome}
                  onChange={(e) => onChange("nome", e.target.value)}
                  required
                />
                {errors.nome && <p className="ld-error">{errors.nome}</p>}
              </div>

              <div style={{ marginBottom: 18 }}>
                <label htmlFor="ld-email" className="ld-label">Qual é o seu e-mail profissional?</label>
                <input
                  id="ld-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  className={`ld-input ${errors.email ? "error" : ""}`}
                  value={form.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  required
                />
                {errors.email && <p className="ld-error">{errors.email}</p>}
              </div>

              <div style={{ marginBottom: 18 }}>
                <label htmlFor="ld-dor" className="ld-label">
                  Qual é a sua maior dor como profissional de saúde autônomo hoje?
                </label>
                <textarea
                  id="ld-dor"
                  rows={4}
                  className={`ld-input ${errors.dor_principal ? "error" : ""}`}
                  placeholder="Ex: gestão financeira, organização de prontuários, controle de agenda..."
                  value={form.dor_principal}
                  onChange={(e) => onChange("dor_principal", e.target.value)}
                  required
                />
                {errors.dor_principal && <p className="ld-error">{errors.dor_principal}</p>}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label htmlFor="ld-wpp" className="ld-label">Qual é o seu WhatsApp?</label>
                <input
                  id="ld-wpp"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  className={`ld-input ${errors.whatsapp ? "error" : ""}`}
                  value={form.whatsapp}
                  onChange={(e) => onChange("whatsapp", e.target.value)}
                  maxLength={15}
                  required
                />
                {errors.whatsapp && <p className="ld-error">{errors.whatsapp}</p>}
              </div>

              <button type="submit" className="ld-submit" disabled={submitting}>
                {submitting ? <><Loader2 size={18} className="animate-spin" /> Enviando…</> : "Enviar"}
              </button>

              <p
                style={{
                  marginTop: 14,
                  textAlign: "center",
                  color: TEXT_MUTED,
                  fontSize: 12.5,
                  lineHeight: 1.55,
                }}
              >
                Ao informar meus dados, eu concordo com os{" "}
                <Link to="/terms" style={{ color: TEAL, fontWeight: 600 }}>Termos de Uso</Link>
                {" "}e{" "}
                <Link to="/privacy" style={{ color: TEAL, fontWeight: 600 }}>Política de Privacidade</Link>
                {" "}da SalbCare.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default LeadDemoFormSection;
