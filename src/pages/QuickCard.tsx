import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Check, Copy, Lock, Star } from "lucide-react";
import {
  CREAM_BG,
  DISPLAY,
  GOLD,
  MONO,
  NAVY_INK,
  SANS,
  TEAL_DEEP,
  proStyles,
} from "@/components/pro/brand";
import InstallPrompt from "@/components/pro/InstallPrompt";
import { useAcademyAccess } from "@/hooks/useAcademyAccess";
import { cacheAcademyPdf, saveAcademyToken } from "@/lib/academyAccess";
import { supabase } from "@/integrations/supabase/client";
import {
  ALL_LANGS,
  QUICK_CARD,
  QUICK_CARD_LANGS,
  QUICK_CARD_PRODUCTS,
  type QuickCardLang,
} from "@/config/quickCard";

const FAV_KEY = "salbcare_quickcard_favorites";
const FAVORITES_TAB = "favoritas";

const QUICK_CARD_STYLES = `
  .qc-head { position: sticky; top: 0; z-index: 30; background: ${CREAM_BG}; border-bottom: 1px solid rgba(10,22,40,0.12); }
  .qc-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: none; }
  .qc-tabs::-webkit-scrollbar { display: none; }
  .qc-tab { flex: none; border: 1px solid rgba(10,22,40,0.18); background: #FFFFFF; color: ${NAVY_INK}; border-radius: 999px; padding: 9px 14px; font-family: ${SANS}; font-size: 13.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; }
  .qc-tab[aria-selected="true"] { background: ${NAVY_INK}; color: #FFFFFF; border-color: ${NAVY_INK}; }
  .qc-lang { border: 1px solid rgba(10,22,40,0.18); background: #FFFFFF; color: ${NAVY_INK}; border-radius: 999px; padding: 7px 13px; font-family: ${MONO}; font-size: 12.5px; cursor: pointer; min-height: 38px; }
  .qc-lang[aria-pressed="true"] { background: ${NAVY_INK}; color: #FFFFFF; border-color: ${NAVY_INK}; }
  .qc-lang:disabled { opacity: 0.42; cursor: not-allowed; }
  .qc-phrase { border: 1px solid rgba(10,22,40,0.12); border-radius: 12px; background: #FFFFFF; padding: 16px; display: grid; gap: 8px; }
  .qc-target { font-family: ${MONO}; font-size: 15.5px; line-height: 1.5; color: ${NAVY_INK}; }
  .qc-pt { font-family: ${SANS}; font-size: 13.5px; line-height: 1.5; color: #3D4B5C; }
  .qc-act { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; padding: 6px 0; font-family: ${SANS}; font-size: 13px; color: #3D4B5C; cursor: pointer; min-height: 36px; }
  .qc-act:hover { color: ${NAVY_INK}; }
  .qc-locked { border: 1px solid rgba(10,22,40,0.12); border-radius: 14px; background: #FFFFFF; padding: 24px; text-align: center; }
  .qc-buy { border: 1px solid rgba(10,22,40,0.16); border-radius: 12px; padding: 14px; display: grid; gap: 6px; text-align: left; background: ${CREAM_BG}; width: 100%; cursor: pointer; font-family: ${SANS}; color: ${NAVY_INK}; }
  .qc-vocab { border-top: 1px solid rgba(10,22,40,0.12); margin-top: 26px; padding-top: 18px; display: grid; gap: 10px; }
  .qc-vocab-row { display: flex; justify-content: space-between; gap: 14px; font-size: 13.5px; }
`;

const PRODUCTS: { slug: string; title: string; price: string; note: string }[] = [
  {
    slug: "ingles-para-atendimento-em-saude",
    title: "Apostila de Inglês",
    price: "R$ 29,90",
    note: "Libera as categorias em português e inglês",
  },
  {
    slug: "espanhol-para-atendimento-em-saude",
    title: "Apostila de Espanhol",
    price: "R$ 29,90",
    note: "Libera as categorias em português e espanhol",
  },
  {
    slug: "international-healthcare-kit",
    title: "International Healthcare Kit",
    price: "R$ 49,90",
    note: "As duas apostilas e o seletor de idioma nos três idiomas",
  },
];

const QuickCard = () => {
  const [lang, setLang] = useState<QuickCardLang>("en");
  const [tab, setTab] = useState<string>(QUICK_CARD[0].id);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const { access, langs, loading: accessLoading, refresh } = useAcademyAccess();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) setFavorites(JSON.parse(raw) as string[]);
    } catch {
      setFavorites([]);
    }
  }, []);

  const toggleFavorite = (key: string) => {
    setFavorites((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {
        /* armazenamento indisponível */
      }
      return next;
    });
  };

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard bloqueado */
    }
  };

  const allPhrases = useMemo(
    () =>
      QUICK_CARD.flatMap((cat) =>
        cat.phrases.map((p, i) => ({ ...p, key: `${cat.id}-${i}`, category: cat.id, free: cat.free })),
      ),
    [],
  );

  const activeCategory = QUICK_CARD.find((c) => c.id === tab);
  const locked = !!activeCategory && !activeCategory.free && !access;

  /** Na categoria gratuita todos os idiomas ficam abertos. Nas pagas, só o que a compra liberou. */
  const allowedLangs: QuickCardLang[] = useMemo(() => {
    if (activeCategory?.free) return ALL_LANGS;
    if (!access) return ALL_LANGS;
    return langs.length ? langs : ALL_LANGS;
  }, [access, activeCategory, langs]);

  useEffect(() => {
    if (!allowedLangs.includes(lang)) setLang(allowedLangs[allowedLangs.length - 1] ?? "pt");
  }, [allowedLangs, lang]);

  const buy = async (slug: string) => {
    setBuying(slug);
    try {
      const { data } = await supabase.functions.invoke("academy-checkout", { body: { slug } });
      if (data?.url) window.location.href = data.url as string;
    } catch {
      /* sem checkout */
    }
    setBuying(null);
  };

  const redeem = async () => {
    setRedeeming(true);
    setTokenError(null);
    try {
      const { data } = await supabase.functions.invoke("academy-unlock", {
        body: { token: token.trim() },
      });
      if (data?.access) {
        saveAcademyToken({
          token: data.token,
          slug: data.slug,
          expiresAt: data.expires_at,
          langs: data.langs,
          downloads: data.downloads,
        });
        await Promise.all(
          (data.downloads ?? []).map((d: { url: string }) => cacheAcademyPdf(d.url)),
        );
        await refresh();
        setShowToken(false);
      } else {
        setTokenError("Não encontramos esse link. Confira o e-mail da compra.");
      }
    } catch {
      setTokenError("Não encontramos esse link. Confira o e-mail da compra.");
    }
    setRedeeming(false);
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base =
      tab === FAVORITES_TAB
        ? allPhrases.filter((p) => favorites.includes(p.key))
        : allPhrases.filter((p) => p.category === tab);
    const searchable = q ? base.filter((p) => `${p.pt} ${p.en} ${p.es}`.toLowerCase().includes(q)) : base;
    return searchable.filter((p) => p.free || access);
  }, [access, allPhrases, favorites, query, tab]);

  const vocabulary = activeCategory && !locked ? activeCategory.vocabulary : [];

  return (
    <div style={{ background: CREAM_BG, minHeight: "100vh", color: NAVY_INK, fontFamily: SANS }}>
      <Helmet>
        <title>SalbCare Quick Card. Frases de atendimento em PT, EN e ES</title>
        <meta
          name="description"
          content="Frases essenciais de atendimento em saúde em português, inglês e espanhol. Funciona offline, sem login."
        />
      </Helmet>
      <style>{proStyles + QUICK_CARD_STYLES}</style>

      <header className="qc-head">
        <div className="pro-wrap" style={{ paddingTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 24, margin: 0, fontWeight: 400 }}>Quick Card</h1>
            <div style={{ display: "flex", gap: 6 }}>
              {QUICK_CARD_LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className="qc-lang"
                  aria-pressed={lang === l.code}
                  disabled={!allowedLangs.includes(l.code)}
                  onClick={() => setLang(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <label htmlFor="qc-search" className="pro-mono" style={{ display: "block", marginTop: 12 }}>
            BUSCAR FRASE
          </label>
          <input
            id="qc-search"
            className="pro-input"
            style={{ marginTop: 6 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dor, alergia, pagamento"
            inputMode="search"
          />

          <div className="qc-tabs" role="tablist" aria-label="Categorias" style={{ marginTop: 12 }}>
            {QUICK_CARD.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={tab === cat.id}
                className="qc-tab"
                onClick={() => setTab(cat.id)}
              >
                {!cat.free && !access && <Lock size={13} strokeWidth={1.8} aria-hidden />}
                {cat.label}
              </button>
            ))}
            <button
              type="button"
              role="tab"
              aria-selected={tab === FAVORITES_TAB}
              className="qc-tab"
              onClick={() => setTab(FAVORITES_TAB)}
            >
              <Star size={13} strokeWidth={1.8} aria-hidden />
              Favoritas
            </button>
          </div>
        </div>
      </header>

      <main className="pro-wrap" style={{ paddingTop: 20, paddingBottom: 120 }}>
        {activeCategory && !locked && (
          <p className="pro-body" style={{ marginTop: 0, marginBottom: 16 }}>
            {activeCategory.description}
          </p>
        )}

        {tab === FAVORITES_TAB && list.length === 0 && (
          <p className="pro-body">Toque na estrela de uma frase para guardá-la aqui.</p>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {list.map((p) => {
            const target = lang === "pt" ? p.pt : lang === "en" ? p.en : p.es;
            const isFav = favorites.includes(p.key);
            return (
              <div key={p.key} className="qc-phrase">
                <div className="qc-target">{target}</div>
                {lang !== "pt" && <div className="qc-pt">{p.pt}</div>}
                <div style={{ display: "flex", gap: 18 }}>
                  <button type="button" className="qc-act" onClick={() => toggleFavorite(p.key)}>
                    <Star
                      size={15}
                      strokeWidth={1.8}
                      aria-hidden
                      color={isFav ? GOLD : "currentColor"}
                      fill={isFav ? GOLD : "none"}
                    />
                    {isFav ? "Favorita" : "Favoritar"}
                  </button>
                  <button type="button" className="qc-act" onClick={() => void copy(target, p.key)}>
                    {copied === p.key ? (
                      <Check size={15} strokeWidth={1.8} aria-hidden color={TEAL_DEEP} />
                    ) : (
                      <Copy size={15} strokeWidth={1.8} aria-hidden />
                    )}
                    {copied === p.key ? "Copiada" : "Copiar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {vocabulary.length > 0 && (
          <div className="qc-vocab">
            <p className="pro-mono" style={{ margin: 0 }}>
              VOCABULÁRIO DE APOIO
            </p>
            {vocabulary.map((v) => (
              <div key={v.pt} className="qc-vocab-row">
                <span style={{ color: "#3D4B5C" }}>{v.pt}</span>
                <span style={{ fontFamily: MONO, textAlign: "right" }}>
                  {lang === "pt" ? v.pt : lang === "en" ? v.en : v.es}
                </span>
              </div>
            ))}
          </div>
        )}

        {locked && !accessLoading && (
          <div className="qc-locked" style={{ marginTop: 20 }}>
            <Lock size={20} strokeWidth={1.6} aria-hidden color={TEAL_DEEP} />
            <h2 style={{ fontFamily: DISPLAY, fontSize: 22, margin: "12px 0 0", fontWeight: 400 }}>
              Continue com o Quick Card completo
            </h2>
            <p className="pro-body" style={{ margin: "10px auto 0", maxWidth: 440 }}>
              A categoria Emergência é gratuita. As outras quatro categorias fazem parte das apostilas da Academy, com
              frases e vocabulário de apoio. A compra é feita sem criar conta: só e-mail e pagamento.
            </p>
            <div style={{ marginTop: 20, display: "grid", gap: 12, maxWidth: 460, marginInline: "auto" }}>
              {PRODUCTS.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  className="qc-buy"
                  onClick={() => void buy(p.slug)}
                  disabled={buying === p.slug}
                >
                  <span style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14.5 }}>
                    <span>{QUICK_CARD_PRODUCTS[p.slug]?.title ?? p.title}</span>
                    <span style={{ fontFamily: MONO }}>{p.price}</span>
                  </span>
                  <span style={{ fontSize: 12.5, color: "#3D4B5C" }}>
                    {buying === p.slug ? "Abrindo o pagamento" : p.note}
                  </span>
                </button>
              ))}
              <Link to="/pro" className="pro-link">
                Assinantes do plano Completo têm tudo incluso
              </Link>
              <button type="button" className="pro-link" onClick={() => setShowToken((v) => !v)}>
                Já comprei. Colar meu link de acesso
              </button>
              {showToken && (
                <div style={{ display: "grid", gap: 8, textAlign: "left" }}>
                  <label htmlFor="qc-token" className="pro-mono">
                    COLE O LINK OU O CÓDIGO DO E-MAIL
                  </label>
                  <input
                    id="qc-token"
                    className="pro-input"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="https://salbcare.com/academy/obrigado?token=..."
                  />
                  <button type="button" className="pro-cta" onClick={() => void redeem()} disabled={redeeming}>
                    {redeeming ? "Verificando" : "Liberar as categorias"}
                  </button>
                  {tokenError && (
                    <p className="pro-body" style={{ margin: 0 }}>
                      {tokenError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <InstallPrompt />
    </div>
  );
};

export default QuickCard;
