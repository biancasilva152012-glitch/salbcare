import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Check, Copy, Lock, Star } from "lucide-react";
import {
  CREAM_BG,
  GOLD,
  MONO,
  NAVY_INK,
  SANS,
  TEAL_DEEP,
  proStyles,
} from "@/components/pro/brand";
import InstallPrompt from "@/components/pro/InstallPrompt";
import { QUICK_CARD, QUICK_CARD_LANGS, type QuickCardLang } from "@/config/quickCard";

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
  .qc-phrase { border: 1px solid rgba(10,22,40,0.12); border-radius: 12px; background: #FFFFFF; padding: 16px; display: grid; gap: 8px; }
  .qc-target { font-family: ${MONO}; font-size: 15.5px; line-height: 1.5; color: ${NAVY_INK}; }
  .qc-pt { font-family: ${SANS}; font-size: 13.5px; line-height: 1.5; color: #3D4B5C; }
  .qc-act { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; padding: 6px 0; font-family: ${SANS}; font-size: 13px; color: #3D4B5C; cursor: pointer; min-height: 36px; }
  .qc-act:hover { color: ${NAVY_INK}; }
  .qc-locked { border: 1px solid rgba(10,22,40,0.12); border-radius: 14px; background: #FFFFFF; padding: 24px; text-align: center; }
`;

const QuickCard = () => {
  const [lang, setLang] = useState<QuickCardLang>("en");
  const [tab, setTab] = useState<string>(QUICK_CARD[0].id);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

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
  const locked = !!activeCategory && !activeCategory.free;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base =
      tab === FAVORITES_TAB
        ? allPhrases.filter((p) => favorites.includes(p.key))
        : allPhrases.filter((p) => p.category === tab);
    const searchable = q ? base.filter((p) => `${p.pt} ${p.en} ${p.es}`.toLowerCase().includes(q)) : base;
    return searchable.filter((p) => p.free || tab === FAVORITES_TAB);
  }, [allPhrases, favorites, query, tab]);

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
            <h1 style={{ fontFamily: "'Gloock', Georgia, serif", fontSize: 24, margin: 0, fontWeight: 400 }}>
              Quick Card
            </h1>
            <div style={{ display: "flex", gap: 6 }}>
              {QUICK_CARD_LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className="qc-lang"
                  aria-pressed={lang === l.code}
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
                {!cat.free && <Lock size={13} strokeWidth={1.8} aria-hidden />}
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

        {locked && (
          <div className="qc-locked" style={{ marginTop: 20 }}>
            <Lock size={20} strokeWidth={1.6} aria-hidden color={TEAL_DEEP} />
            <h2 style={{ fontFamily: "'Gloock', Georgia, serif", fontSize: 22, margin: "12px 0 0", fontWeight: 400 }}>
              Continue com o Quick Card completo
            </h2>
            <p className="pro-body" style={{ margin: "10px auto 0", maxWidth: 420 }}>
              A categoria Emergência é gratuita. As outras categorias fazem parte da apostila completa, com cerca de 80
              frases, categorias e favoritos.
            </p>
            <div style={{ marginTop: 20, display: "grid", gap: 12, justifyItems: "center" }}>
              <Link to="/academy" className="pro-cta">
                Ver na Academy
              </Link>
              <Link to="/pro" className="pro-link">
                Assinantes do PRO têm tudo incluso
              </Link>
            </div>
          </div>
        )}
      </main>

      <InstallPrompt />
    </div>
  );
};

export default QuickCard;
