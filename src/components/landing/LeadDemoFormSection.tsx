// Seção — "Conheça a plataforma na prática"
// Captura de lead → tabela leads_demo + edge function notify-new-lead (CallMeBot).
// Inclui consentimento LGPD obrigatório, validação BR de WhatsApp e status passo a passo.
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2, AlertTriangle, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackCtaClick, trackUnified } from "@/hooks/useTracking";
import {
  buildWhatsAppUrl,
  buildWhatsAppAppUrl,
  buildLeadWhatsAppMessage,
  LEAD_MESSAGE_MAX_CHARS,
  WHATSAPP_DISPLAY,
} from "@/lib/whatsapp";

const NAVY = "#0D1B2A";
const TEAL = "#00B4A0";
const TEAL_DARK = "#009986";
const TEXT_MUTED = "#64748B";
const BORDER = "#E2E8F0";
const SURFACE = "#F8F9FA";

// DDDs válidos no Brasil (ANATEL)
const VALID_DDDS = new Set([
  11,12,13,14,15,16,17,18,19,
  21,22,24,27,28,
  31,32,33,34,35,37,38,
  41,42,43,44,45,46,47,48,49,
  51,53,54,55,
  61,62,63,64,65,66,67,68,69,
  71,73,74,75,77,79,
  81,82,83,84,85,86,87,88,89,
  91,92,93,94,95,96,97,98,99,
]);

const isValidBrazilianMobile = (masked: string) => {
  const digits = masked.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  const ddd = parseInt(digits.slice(0, 2), 10);
  if (!VALID_DDDS.has(ddd)) return false;
  // Celular brasileiro: 9º dígito (após o DDD) deve ser 9
  if (digits[2] !== "9") return false;
  return true;
};

const leadSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  dor_principal: z.string().trim().min(5, "Conte um pouco mais").max(1000),
  whatsapp: z
    .string()
    .trim()
    .refine(isValidBrazilianMobile, "Informe um celular BR válido: (DDD) 9XXXX-XXXX"),
  lgpd_consent: z
    .boolean()
    .refine((v) => v === true, "É necessário aceitar para continuar"),
});

const maskWhatsApp = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

type StepStatus = "idle" | "active" | "ok" | "warn";

const LeadDemoFormSection = () => {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    dor_principal: "",
    whatsapp: "",
    lgpd_consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [saveStatus, setSaveStatus] = useState<StepStatus>("idle");
  const [notifyStatus, setNotifyStatus] = useState<StepStatus>("idle");
  const [waUrl, setWaUrl] = useState<string>(buildWhatsAppUrl());
  const [waAppUrl, setWaAppUrl] = useState<string>(buildWhatsAppAppUrl());

  const onChange = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({
      ...f,
      [k]: k === "whatsapp" && typeof v === "string" ? maskWhatsApp(v) : v,
    }));
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
    setSaveStatus("active");
    setNotifyStatus("idle");

    try {
      const payload = {
        nome: parsed.data.nome,
        email: parsed.data.email,
        dor_principal: parsed.data.dor_principal,
        whatsapp: parsed.data.whatsapp,
        lgpd_consent: true,
        lgpd_consent_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("leads_demo")
        .insert([payload])
        .select("id")
        .single();

      if (error) throw error;
      setSaveStatus("ok");

      // Monta mensagem personalizada via template ÚNICO (com truncamento)
      const personalMessage = buildLeadWhatsAppMessage({
        nome: parsed.data.nome,
        email: parsed.data.email,
        whatsapp: parsed.data.whatsapp,
        dor: parsed.data.dor_principal,
      });
      const personalWaUrl = buildWhatsAppUrl(personalMessage);
      const personalWaAppUrl = buildWhatsAppAppUrl(personalMessage);
      setWaUrl(personalWaUrl);
      setWaAppUrl(personalWaAppUrl);

      // Notificação WhatsApp interna (CallMeBot) — em paralelo, com fallback
      setNotifyStatus("active");
      try {
        const { error: notifyErr } = await supabase.functions.invoke(
          "notify-new-lead",
          { body: { lead_id: data.id } }
        );
        if (notifyErr) throw notifyErr;
        setNotifyStatus("ok");
      } catch (notifyErr) {
        console.warn("notify-new-lead falhou", notifyErr);
        setNotifyStatus("warn");
      }

      trackCtaClick("lead_demo_submit", "landing_lead_form");
      trackUnified("lead_demo_submitted", { source: "landing_lead_form" });
      setDone(true);

      // Abre o WhatsApp em nova aba imediatamente após enviar
      try {
        window.open(personalWaUrl, "_blank", "noopener,noreferrer");
      } catch {
        /* fallback exibido na tela */
      }
    } catch (err) {
      console.error(err);
      setSaveStatus("idle");
      toast.error("Não foi possível enviar agora. Tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = (label: string, status: StepStatus) => {
    const color =
      status === "ok" ? TEAL : status === "warn" ? "#D97706" : status === "active" ? NAVY : TEXT_MUTED;
    const Icon =
      status === "ok" ? CheckCircle2 : status === "warn" ? AlertTriangle : Loader2;
    const spinning = status === "active";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, color, fontSize: 14.5 }}>
        <Icon size={18} className={spinning ? "animate-spin" : ""} />
        <span>{label}</span>
      </div>
    );
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
        .ld-checkbox-row {
          display: flex; align-items: flex-start; gap: 10px;
          background: ${SURFACE}; border: 1px solid ${BORDER};
          padding: 12px 14px; border-radius: 10px;
        }
        .ld-checkbox-row input { margin-top: 3px; width: 18px; height: 18px; accent-color: ${TEAL}; }
        .ld-status-box {
          margin-top: 18px; padding: 14px 16px;
          background: ${SURFACE}; border: 1px solid ${BORDER}; border-radius: 10px;
          display: flex; flex-direction: column; gap: 8px;
        }
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
          Nossa equipe entrará em contato para agendar sua demonstração.
        </p>

        <div className="ld-card">
          {done ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <CheckCircle2 size={56} color={TEAL} style={{ margin: "0 auto 16px" }} />
              <h3 style={{ color: NAVY, fontWeight: 800, fontSize: 22, margin: 0 }}>
                Recebemos seus dados!
              </h3>
              <p style={{ color: TEXT_MUTED, fontSize: 15.5, lineHeight: 1.6, marginTop: 12 }}>
                Abrimos o WhatsApp da Bianca em uma nova aba com sua mensagem já pronta. Se nada abrir, use uma das opções abaixo.
              </p>

              {/* CTA principal — abre wa.me */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCtaClick("whatsapp", "landing_lead_form_done")}
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
                  marginTop: 20, padding: "14px 24px", borderRadius: 12,
                  background: "#25D366", color: "#FFFFFF", fontWeight: 700, fontSize: 15.5,
                  textDecoration: "none", boxShadow: "0 6px 20px rgba(37,211,102,0.28)",
                  minHeight: 52,
                }}
              >
                <MessageCircle size={18} /> Abrir WhatsApp para agendar
              </a>

              {/* Fallback — link alternativo + número visível */}
              <div
                style={{
                  marginTop: 16, padding: "12px 14px",
                  background: SURFACE, border: `1px dashed ${BORDER}`, borderRadius: 10,
                  fontSize: 13.5, color: TEXT_MUTED, lineHeight: 1.55,
                }}
              >
                Não abriu?{" "}
                <a
                  href={waAppUrl}
                  style={{ color: TEAL, fontWeight: 600 }}
                  onClick={() => trackCtaClick("whatsapp_fallback_app", "landing_lead_form_done")}
                >
                  tentar abrir direto no app
                </a>
                {" "}ou copie o número{" "}
                <strong style={{ color: NAVY }}>{WHATSAPP_DISPLAY}</strong>.
              </div>

              <div className="ld-status-box" style={{ marginTop: 22, textAlign: "left" }}>
                {renderStep("Lead salvo no banco", saveStatus)}
                {renderStep(
                  notifyStatus === "warn"
                    ? "Notificação interna não enviada (lead já registrado, nossa equipe será avisada por outro canal)"
                    : "Notificação enviada para nossa equipe",
                  notifyStatus
                )}
              </div>
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

              <div style={{ marginBottom: 18 }}>
                <label htmlFor="ld-wpp" className="ld-label">
                  Qual é o seu WhatsApp? <span style={{ color: TEXT_MUTED, fontWeight: 500 }}>(celular BR com DDD)</span>
                </label>
                <input
                  id="ld-wpp"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="(00) 90000-0000"
                  className={`ld-input ${errors.whatsapp ? "error" : ""}`}
                  value={form.whatsapp}
                  onChange={(e) => onChange("whatsapp", e.target.value)}
                  maxLength={15}
                  required
                />
                {errors.whatsapp && <p className="ld-error">{errors.whatsapp}</p>}
              </div>

              <div style={{ marginBottom: 22 }}>
                <label htmlFor="ld-lgpd" className="ld-checkbox-row" style={{ cursor: "pointer" }}>
                  <input
                    id="ld-lgpd"
                    type="checkbox"
                    checked={form.lgpd_consent}
                    onChange={(e) => onChange("lgpd_consent", e.target.checked)}
                    required
                  />
                  <span style={{ color: NAVY, fontSize: 13.5, lineHeight: 1.55 }}>
                    Autorizo a SalbCare a tratar meus dados pessoais (nome, e-mail e WhatsApp) para entrar em contato sobre a demonstração, conforme a{" "}
                    <Link to="/privacy" style={{ color: TEAL, fontWeight: 600 }}>Política de Privacidade</Link>{" "}
                    e a Lei nº 13.709/2018 (LGPD). Posso revogar este consentimento a qualquer momento.
                  </span>
                </label>
                {errors.lgpd_consent && <p className="ld-error">{errors.lgpd_consent}</p>}
              </div>

              {/* Prévia da mensagem do WhatsApp + contador de caracteres */}
              {(form.nome || form.email || form.whatsapp || form.dor_principal) && (() => {
                const previewMsg = buildLeadWhatsAppMessage({
                  nome: form.nome,
                  email: form.email,
                  whatsapp: form.whatsapp,
                  dor: form.dor_principal,
                });
                const len = previewMsg.length;
                const pct = Math.min(100, Math.round((len / LEAD_MESSAGE_MAX_CHARS) * 100));
                const nearLimit = pct >= 90;
                return (
                  <div
                    style={{
                      marginBottom: 18, padding: "12px 14px", borderRadius: 10,
                      background: SURFACE, border: `1px dashed ${BORDER}`,
                    }}
                    aria-live="polite"
                  >
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      marginBottom: 8, fontSize: 12, color: TEXT_MUTED, fontWeight: 600,
                    }}>
                      <span>Prévia da mensagem que será enviada no WhatsApp</span>
                      <span style={{ color: nearLimit ? "#D97706" : TEAL, fontVariantNumeric: "tabular-nums" }}>
                        {len}/{LEAD_MESSAGE_MAX_CHARS}
                      </span>
                    </div>
                    <pre style={{
                      margin: 0, padding: 10, background: "#FFFFFF",
                      border: `1px solid ${BORDER}`, borderRadius: 8,
                      fontSize: 12.5, color: NAVY, lineHeight: 1.5,
                      fontFamily: "inherit", whiteSpace: "pre-wrap", wordBreak: "break-word",
                      maxHeight: 160, overflowY: "auto",
                    }}>{previewMsg}</pre>
                  </div>
                );
              })()}

              <button
                type="submit"
                className="ld-submit"
                disabled={submitting || !form.lgpd_consent}
              >
                {submitting ? <><Loader2 size={18} className="animate-spin" /> Enviando…</> : "Enviar"}
              </button>

              {(saveStatus !== "idle" || notifyStatus !== "idle") && (
                <div className="ld-status-box">
                  {renderStep(
                    saveStatus === "ok" ? "Lead salvo no banco" : "Salvando lead…",
                    saveStatus
                  )}
                  {(saveStatus === "ok" || notifyStatus !== "idle") &&
                    renderStep(
                      notifyStatus === "ok"
                        ? "Notificação WhatsApp enviada"
                        : notifyStatus === "warn"
                        ? "Notificação WhatsApp falhou — lead já salvo"
                        : "Disparando notificação WhatsApp…",
                      notifyStatus
                    )}
                </div>
              )}

              <p
                style={{
                  marginTop: 14,
                  textAlign: "center",
                  color: TEXT_MUTED,
                  fontSize: 12.5,
                  lineHeight: 1.55,
                }}
              >
                Ao enviar, você concorda com os{" "}
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
