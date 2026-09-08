import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteFooter, SiteHeader } from "@/components/pro/SiteChrome";
import { CREAM, GOLD, MONO, NAVY, SANS, TEAL, proStyles } from "@/components/pro/brand";

type Certificate = {
  code: string;
  holder_name: string;
  language: string;
  score: number;
  slug: string;
  issued_at: string;
};

const LANG_LABEL: Record<string, string> = {
  en: "Inglês para Atendimento em Saúde",
  es: "Espanhol para Atendimento em Saúde",
};

const AcademyCertificate = () => {
  const { codigo } = useParams<{ codigo: string }>();
  const [state, setState] = useState<"loading" | "ok" | "invalid">("loading");
  const [cert, setCert] = useState<Certificate | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!codigo) {
        setState("invalid");
        return;
      }
      const { data, error } = await supabase.functions.invoke("academy-certificate", {
        body: { code: codigo },
      });
      if (!alive) return;
      if (error || !data?.valid) {
        setState("invalid");
        return;
      }
      setCert(data.certificate as Certificate);
      setState("ok");
    })();
    return () => {
      alive = false;
    };
  }, [codigo]);

  const issued = cert ? new Date(cert.issued_at).toLocaleDateString("pt-BR") : "";

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: SANS }}>
      <Helmet>
        <title>{`Certificado ${codigo ?? ""} | SalbCare Academy`}</title>
        <meta
          name="description"
          content="Verificação de certificado da SalbCare Academy: nome do profissional, idioma e aproveitamento."
        />
        <meta name="robots" content="noindex" />
      </Helmet>
      <style>{proStyles}</style>

      <SiteHeader />

      <section className="pro-wrap pro-section" style={{ maxWidth: 760 }}>
        {state === "loading" && <p className="pro-body">Conferindo o certificado...</p>}

        {state === "invalid" && (
          <>
            <h1 className="pro-h2">Certificado não encontrado</h1>
            <p className="pro-body" style={{ marginTop: 14 }}>
              O código informado não corresponde a nenhum certificado emitido. Confira se digitou corretamente.
            </p>
            <div style={{ marginTop: 24 }}>
              <Link to="/academy" className="pro-cta" style={{ textDecoration: "none" }}>
                Ir para a Academy
              </Link>
            </div>
          </>
        )}

        {state === "ok" && cert && (
          <div className="pro-card" style={{ padding: 28 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", color: TEAL, textTransform: "uppercase" }}>
              Certificado SalbCare Academy
            </div>
            <h1 className="pro-h2" style={{ marginTop: 16 }}>
              {cert.holder_name}
            </h1>
            <p className="pro-body" style={{ marginTop: 12 }}>
              Concluiu a trilha de atendimento em {LANG_LABEL[cert.language] ?? cert.language} com aproveitamento de{" "}
              <strong>{cert.score}%</strong>.
            </p>

            <div style={{ marginTop: 24, display: "grid", gap: 10, fontFamily: MONO, fontSize: 12.5 }}>
              <div>Idioma: {LANG_LABEL[cert.language] ?? cert.language}</div>
              <div>Aproveitamento: {cert.score}%</div>
              <div>Emitido em: {issued}</div>
              <div style={{ color: GOLD }}>Código: {cert.code}</div>
            </div>

            <p className="pro-note" style={{ marginTop: 22 }}>
              Certificado emitido após compra confirmada do material e conclusão de todos os casos do idioma.
            </p>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
};

export default AcademyCertificate;
