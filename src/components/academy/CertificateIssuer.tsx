/**
 * Emissão do certificado da Academy.
 * Aparece somente para quem tem uma compra confirmada salva neste aparelho e
 * concluiu o idioma com aproveitamento mínimo de 70.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAcademyTokens } from "@/lib/academyAccess";
import { TEAL_DEEP } from "@/components/pro/brand";

const MIN_SCORE = 70;

const CertificateIssuer = ({ language, score }: { language: string; score: number }) => {
  const token = useMemo(
    () => getAcademyTokens().find((t) => (t.langs ?? []).includes(language))?.token ?? null,
    [language],
  );
  const [name, setName] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!token) return null;

  const issue = async () => {
    if (name.trim().length < 3) {
      setError("Escreva seu nome completo, como deve aparecer no certificado.");
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke("academy-certificate", {
      body: { token, name: name.trim(), language, score },
    });
    setBusy(false);
    if (fnError || !data?.issued) {
      setError("Não foi possível emitir o certificado agora. Tente novamente em instantes.");
      return;
    }
    setCode(data.certificate.code as string);
  };

  return (
    <div className="pro-card" style={{ marginTop: 18 }}>
      <div className="pro-mono" style={{ color: TEAL_DEEP }}>
        SEU CERTIFICADO
      </div>

      {score < MIN_SCORE && (
        <p className="pro-body" style={{ marginTop: 10 }}>
          O certificado sai com aproveitamento de {MIN_SCORE} ou mais. Você está em {score}, atenda de novo para subir.
        </p>
      )}

      {score >= MIN_SCORE && !code && (
        <>
          <p className="pro-body" style={{ marginTop: 10 }}>
            Compra confirmada. Informe seu nome completo para emitir o certificado com o seu aproveitamento de {score}%.
          </p>
          <div style={{ marginTop: 14, display: "grid", gap: 10, maxWidth: 380 }}>
            <input
              className="pro-input"
              placeholder="Nome completo"
              aria-label="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="button" className="pro-cta" onClick={issue} disabled={busy}>
              {busy ? "Emitindo..." : "Emitir certificado"}
            </button>
          </div>
          {error && (
            <p className="pro-body" style={{ marginTop: 10 }}>
              {error}
            </p>
          )}
        </>
      )}

      {code && (
        <>
          <p className="pro-body" style={{ marginTop: 10 }}>
            Certificado emitido. Guarde o código {code}.
          </p>
          <Link to={`/certificado/${code}`} className="pro-cta" style={{ marginTop: 14, textDecoration: "none" }}>
            Ver o certificado
          </Link>
        </>
      )}
    </div>
  );
};

export default CertificateIssuer;
