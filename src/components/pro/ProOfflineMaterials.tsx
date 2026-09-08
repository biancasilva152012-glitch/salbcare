import { useCallback, useEffect, useState } from "react";
import { Download, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { MONO, ProLabel, TEAL_DEEP } from "@/components/pro/brand";
import {
  cacheAcademyPdf,
  isAcademyPdfCached,
  localAcademyDownloads,
  offlineAcademyPdfUrl,
  saveAcademyToken,
  type AcademyDownload,
} from "@/lib/academyAccess";
import { supabase } from "@/integrations/supabase/client";

const muted = "rgba(31,31,31,0.66)";

/**
 * Materiais comprados na Academy, disponíveis dentro do app instalado.
 * O PDF fica guardado no aparelho e abre offline, sem depender do e-mail.
 */
const ProOfflineMaterials = () => {
  const [items, setItems] = useState<(AcademyDownload & { cached: boolean })[]>([]);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const list = localAcademyDownloads();
    const withState = await Promise.all(
      list.map(async (d) => ({ ...d, cached: await isAcademyPdfCached(d.url) })),
    );
    setItems(withState);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveOffline = async (d: AcademyDownload) => {
    const ok = await cacheAcademyPdf(d.url);
    toast[ok ? "success" : "error"](
      ok ? "Material guardado para uso offline." : "Não foi possível guardar agora. Tente com conexão.",
    );
    void load();
  };

  const open = async (d: AcademyDownload) => {
    const offline = await offlineAcademyPdfUrl(d.url);
    window.open(offline ?? d.url, "_blank", "noopener");
  };

  const redeem = async () => {
    setBusy(true);
    try {
      const { data } = await supabase.functions.invoke("academy-unlock", { body: { token: token.trim() } });
      if (data?.access) {
        saveAcademyToken({
          token: data.token,
          slug: data.slug,
          expiresAt: data.expires_at,
          langs: data.langs,
          downloads: data.downloads,
        });
        await Promise.all((data.downloads ?? []).map((d: AcademyDownload) => cacheAcademyPdf(d.url)));
        setToken("");
        toast.success("Material liberado neste aparelho.");
        void load();
      } else {
        toast.error("Não encontramos esse link de acesso.");
      }
    } catch {
      toast.error("Não encontramos esse link de acesso.");
    }
    setBusy(false);
  };

  return (
    <div className="pro-card" style={{ display: "grid", gap: 14 }}>
      <ProLabel>Meus materiais offline</ProLabel>
      {items.length === 0 && (
        <p style={{ margin: 0, fontSize: 13, color: muted }}>
          Nenhum material salvo neste aparelho ainda. Cole abaixo o link de acesso que veio no e-mail da compra.
        </p>
      )}
      {items.map((d) => (
        <div
          key={d.url}
          style={{ borderTop: "1px solid rgba(31,31,31,0.12)", paddingTop: 12, display: "grid", gap: 6 }}
        >
          <div style={{ fontFamily: MONO, fontSize: 13 }}>{d.title}</div>
          <div style={{ fontSize: 12.5, color: muted, display: "flex", alignItems: "center", gap: 6 }}>
            {d.cached ? (
              <>
                <WifiOff size={13} strokeWidth={1.8} aria-hidden color={TEAL_DEEP} />
                Disponível offline
              </>
            ) : (
              "Ainda não guardado no aparelho"
            )}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="pro-ghostbtn" onClick={() => void open(d)}>
              Abrir PDF
            </button>
            {!d.cached && (
              <button className="pro-ghostbtn" onClick={() => void saveOffline(d)}>
                <Download size={13} strokeWidth={1.8} aria-hidden /> Guardar offline
              </button>
            )}
          </div>
        </div>
      ))}

      <div style={{ borderTop: "1px solid rgba(31,31,31,0.12)", paddingTop: 12, display: "grid", gap: 8 }}>
        <label htmlFor="pro-academy-token" className="pro-mono">
          LINK DE ACESSO DO E-MAIL
        </label>
        <input
          id="pro-academy-token"
          className="pro-input"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="https://salbcare.com/academy/obrigado?token=..."
        />
        <button className="pro-cta" onClick={() => void redeem()} disabled={busy || !token.trim()}>
          {busy ? "Verificando" : "Liberar neste aparelho"}
        </button>
      </div>
    </div>
  );
};

export default ProOfflineMaterials;
