import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Download } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/pro/SiteChrome";
import { CREAM, NAVY, ProLabel, SANS, TEAL, proStyles } from "@/components/pro/brand";
import { supabase } from "@/integrations/supabase/client";
import { saveAcademyToken } from "@/lib/academyAccess";

const AcademyObrigado = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "pending">("loading");

  useEffect(() => {
    if (!sessionId) {
      setState("pending");
      return;
    }
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("academy-unlock", {
          body: { session_id: sessionId },
        });
        if (data?.access) {
          saveAcademyToken({ token: data.token, slug: data.slug, expiresAt: data.expires_at });
          setDownloadUrl(data.download_url ?? null);
          setState("ready");
          return;
        }
      } catch {
        /* segue com o aviso de e-mail */
      }
      setState("pending");
    })();
  }, [sessionId]);

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: SANS }}>
      <Helmet>
        <title>Compra confirmada | SalbCare Academy</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <style>{proStyles}</style>
      <SiteHeader />

      <section className="pro-wrap pro-section">
        <Check size={26} strokeWidth={1.6} color={TEAL} aria-hidden />
        <ProLabel>SalbCare Academy</ProLabel>
        <h1 className="pro-h1" style={{ maxWidth: 620 }}>
          Sua compra foi confirmada.
        </h1>

        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          {downloadUrl ? (
            <a href={downloadUrl} className="pro-cta" style={{ textDecoration: "none", display: "inline-flex", gap: 8, alignItems: "center" }}>
              <Download size={16} strokeWidth={1.8} aria-hidden />
              Baixar o material em PDF
            </a>
          ) : (
            <span className="pro-body">
              {state === "loading" ? "Preparando o seu material." : "Preparando o seu material. O link chega no seu e-mail."}
            </span>
          )}
        </div>

        <p className="pro-body" style={{ marginTop: 18, maxWidth: 560 }}>
          Enviamos também o link para o seu e-mail, caso precise depois.
        </p>

        <div
          style={{
            marginTop: 32,
            padding: 20,
            border: "1px solid rgba(244,238,226,0.16)",
            borderRadius: 14,
            maxWidth: 560,
          }}
        >
          <p className="pro-body" style={{ margin: 0 }}>
            Teste o plano Completo grátis por 7 dias e tenha isso e muito mais incluso.
          </p>
          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 14 }}>
            <Link to="/pro" className="pro-cta" style={{ textDecoration: "none" }}>
              Conhecer o plano Completo
            </Link>
            <Link to="/quick-card" className="pro-link">
              Abrir o Quick Card completo
            </Link>
          </div>
        </div>

        <p className="pro-body" style={{ marginTop: 28, maxWidth: 560, opacity: 0.8 }}>
          Quer salvar seus materiais numa conta para acessar depois em qualquer aparelho?{" "}
          <Link to="/register" className="pro-link">
            Criar conta grátis
          </Link>
          . É opcional.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
};

export default AcademyObrigado;
