import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Flame,
  HeartPulse,
  Lock,
  Pill,
  Receipt,
  Star,
  Stethoscope,
  Thermometer,
} from "lucide-react";
import {
  CREAM_BG,
  DISPLAY,
  GOLD,
  MONO,
  NAVY_INK,
  SANS,
  TEAL,
  TEAL_DEEP,
  proStyles,
} from "@/components/pro/brand";
import InstallPrompt from "@/components/pro/InstallPrompt";
import { useAcademyAccess } from "@/hooks/useAcademyAccess";
import { cacheAcademyPdf, saveAcademyToken } from "@/lib/academyAccess";
import { supabase } from "@/integrations/supabase/client";
import { QUICK_CARD, QUICK_CARD_PRODUCTS, type QuickCardLang } from "@/config/quickCard";

const FAV_KEY = "salbcare_quickcard_favorites";
const SEEN_KEY = "salbcare_quickcard_seen";
const STREAK_KEY = "salbcare_quickcard_streak";

const ICONS = [HeartPulse, Thermometer, Pill, Stethoscope, Receipt];

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
    note: "As duas apostilas e as frases nos três idiomas",
  },
];

const STYLES = `
  .qc-shell { max-width: 560px; margin: 0 auto; padding: 22px 18px 64px; }
  .qc-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .qc-streak { display: inline-flex; align-items: center; gap: 6px; font-family: ${MONO}; font-size: 12.5px; color: ${NAVY_INK}; }
  .qc-trail { margin-top: 30px; display: grid; justify-items: center; gap: 0; }
  .qc-node { width: 88px; height: 88px; border-radius: 999px; border: none; cursor: pointer; display: grid; place-items: center; background: ${TEAL}; color: ${NAVY_INK}; box-shadow: 0 6px 0 rgba(15,118,110,0.35); transition: transform 160ms ease; }
  .qc-node.locked { background: rgba(10,22,40,0.14); color: rgba(10,22,40,0.5); box-shadow: none; cursor: pointer; }
  .qc-node:hover { transform: translateY(-2px); }
  .qc-node.pop { animation: qc-pop 420ms ease; }
  @keyframes qc-pop { 0% { transform: scale(1); } 45% { transform: scale(1.14); } 100% { transform: scale(1); } }
  .qc-node-label { font-family: ${MONO}; font-size: 12px; color: ${NAVY_INK}; margin-top: 10px; text-align: center; }
  .qc-node-sub { font-family: ${SANS}; font-size: 12px; color: rgba(10,22,40,0.55); margin-top: 2px; text-align: center; }
  .qc-link-line { width: 0; height: 34px; border-left: 3px dotted rgba(10,22,40,0.22); margin: 12px 0; }
  .qc-bar { height: 10px; border-radius: 999px; background: rgba(10,22,40,0.12); overflow: hidden; }
  .qc-bar > span { display: block; height: 100%; background: ${TEAL}; border-radius: 999px; transition: width 220ms ease; }
  .qc-card { margin-top: 24px; background: #FFFFFF; border: 1px solid rgba(10,22,40,0.12); border-radius: 12px; padding: 26px 20px; min-height: 300px; display: grid; align-content: center; gap: 16px; text-align: center; }
  .qc-target { font-family: ${MONO}; font-size: 20px; line-height: 1.45; color: ${NAVY_INK}; }
  .qc-pt { font-family: ${SANS}; font-size: 14px; color: #3D4B5C; }
  .qc-round { border-radius: 999px; min-height: 52px; padding: 15px 26px; border: none; background: ${NAVY_INK}; color: ${CREAM_BG}; font-family: ${MONO}; font-size: 13px; letter-spacing: 0.06em; cursor: pointer; width: 100%; }
  .qc-ghost { border-radius: 999px; min-height: 46px; padding: 12px 22px; border: 1px solid rgba(10,22,40,0.2); background: transparent; color: ${NAVY_INK}; font-family: ${MONO}; font-size: 12.5px; cursor: pointer; }
  .qc-langs { display: flex; gap: 8px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }
  .qc-lang { border: 1px solid rgba(10,22,40,0.18); background: #FFFFFF; color: ${NAVY_INK}; border-radius: 999px; padding: 8px 14px; font-family: ${MONO}; font-size: 12.5px; cursor: pointer; }
  .qc-lang[aria-pressed="true"] { background: ${NAVY_INK}; color: #FFFFFF; }
  .qc-lang:disabled { opacity: 0.4; cursor: not-allowed; }
  .qc-buy { border: 1px solid rgba(10,22,40,0.16); border-radius: 12px; padding: 14px; display: grid; gap: 4px; text-align: left; background: #FFFFFF; width: 100%; cursor: pointer; font-family: ${SANS}; color: ${NAVY_INK}; }
  .qc-input { width: 100%; border: 1px solid rgba(10,22,40,0.2); border-radius: 12px; padding: 12px 14px; font-family: ${SANS}; font-size: 14px; background: #FFFFFF; color: ${NAVY_INK}; }
  .qc-confetti { position: relative; height: 70px; overflow: hidden; }
  .qc-confetti i { position: absolute; top: -12px; width: 8px; height: 14px; border-radius: 2px; animation: qc-fall 1.5s linear forwards; }
  @keyframes qc-fall { to { transform: translateY(90px) rotate(320deg); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) {
    .qc-node, .qc-node.pop, .qc-confetti i { animation: none; transition: none; }
  }
`;

type Progress = Record<string, string[]>;

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* armazenamento indisponível */
  }
};

const today = () => new Date().toISOString().slice(0, 10);

/** Sequência de dias seguidos em que o Quick Card foi aberto, calculada no aparelho. */
const bumpStreak = () => {
  const state = readJson<{ last: string; count: number }>(STREAK_KEY, { last: "", count: 0 });
  const day = today();
  if (state.last === day) return state.count;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const count = state.last === yesterday ? state.count + 1 : 1;
  writeJson(STREAK_KEY, { last: day, count });
  return count;
};

const QuickCard = () => {
  const [lang, setLang] = useState<QuickCardLang>("en");
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [seen, setSeen] = useState<Progress>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [popped, setPopped] = useState<string[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const { access, langs, refresh } = useAcademyAccess();

  useEffect(() => {
    setSeen(readJson<Progress>(SEEN_KEY, {}));
    setFavorites(readJson<string[]>(FAV_KEY, []));
    setStreak(bumpStreak());
  }, []);

  const availableLangs = useMemo<QuickCardLang[]>(() => {
    const base: QuickCardLang[] = ["pt"];
    return access ? (langs.length ? langs : ["pt", "en", "es"]) : base.concat("en");
  }, [access, langs]);

  const canUse = (l: QuickCardLang) => l === "pt" || l === "en" || availableLangs.includes(l);

  const unlocked = useCallback((catFree: boolean) => catFree || access, [access]);

  const markSeen = (catId: string, key: string) => {
    setSeen((prev) => {
      const list = prev[catId] ?? [];
      if (list.includes(key)) return prev;
      const next = { ...prev, [catId]: [...list, key] };
      writeJson(SEEN_KEY, next);
      return next;
    });
  };

  const toggleFavorite = (key: string) => {
    setFavorites((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      writeJson(FAV_KEY, next);
      return next;
    });
  };

  const buy = async (slug: string) => {
    setBuying(slug);
    try {
      const { data } = await supabase.functions.invoke("academy-checkout", { body: { slug } });
      if (data?.url) window.location.href = data.url;
    } catch {
      /* erro tratado abaixo */
    }
    setBuying(null);
  };

  const redeem = async () => {
    setRedeeming(true);
    setTokenError(null);
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
        await Promise.all((data.downloads ?? []).map((d: { url: string }) => cacheAcademyPdf(d.url)));
        setToken("");
        setPopped(QUICK_CARD.filter((c) => !c.free).map((c) => c.id));
        await refresh();
      } else {
        setTokenError("Não encontramos esse link de acesso.");
      }
    } catch {
      setTokenError("Não encontramos esse link de acesso.");
    }
    setRedeeming(false);
  };

  const category = QUICK_CARD.find((c) => c.id === openCat) ?? null;

  const openCategory = (id: string, free: boolean) => {
    if (!unlocked(free)) {
      document.getElementById("qc-desbloquear")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setOpenCat(id);
    setIndex(0);
    setDone(false);
  };

  const next = () => {
    if (!category) return;
    const key = `${category.id}-${index}`;
    markSeen(category.id, key);
    if (index + 1 >= category.phrases.length) {
      setDone(true);
      return;
    }
    setIndex(index + 1);
  };

  return (
    <div style={{ background: CREAM_BG, minHeight: "100vh", color: NAVY_INK, fontFamily: SANS }}>
      <Helmet>
        <title>Quick Card | Frases de atendimento em saúde, grátis</title>
        <meta
          name="description"
          content="Treine frases de atendimento em saúde em inglês e espanhol direto no navegador. Categoria de emergência grátis, sem cadastro."
        />
        <link rel="canonical" href="https://salbcare.com/quick-card" />
      </Helmet>
      <style>{proStyles + STYLES}</style>

      <div className="qc-shell">
        <div className="qc-top">
          <Link to="/" className="pro-link" style={{ fontFamily: MONO, fontSize: 12.5 }}>
            SalbCare
          </Link>
          <span className="qc-streak" title="Dias seguidos usando o Quick Card">
            <Flame size={14} strokeWidth={1.8} color={GOLD} aria-hidden />
            {streak}
          </span>
        </div>

        {!category && (
          <>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 34, lineHeight: 1.15, margin: "18px 0 0" }}>
              Sua trilha de atendimento
            </h1>
            <p style={{ fontSize: 14.5, color: "#3D4B5C", marginTop: 10 }}>
              Uma categoria por vez, uma frase por vez. A categoria de emergência é grátis e não precisa de cadastro.
            </p>

            <div className="qc-langs">
              {(["pt", "en", "es"] as QuickCardLang[]).map((l) => (
                <button
                  key={l}
                  className="qc-lang"
                  aria-pressed={lang === l}
                  disabled={!canUse(l)}
                  onClick={() => setLang(l)}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="qc-trail">
              {QUICK_CARD.map((cat, i) => {
                const Icon = ICONS[i % ICONS.length];
                const open = unlocked(cat.free);
                const total = cat.phrases.length;
                const count = (seen[cat.id] ?? []).length;
                return (
                  <div key={cat.id} style={{ display: "grid", justifyItems: "center" }}>
                    {i > 0 && <div className="qc-link-line" aria-hidden />}
                    <button
                      className={`qc-node${open ? "" : " locked"}${popped.includes(cat.id) ? " pop" : ""}`}
                      onClick={() => openCategory(cat.id, cat.free)}
                      aria-label={open ? `Abrir ${cat.label}` : `${cat.label} bloqueada`}
                    >
                      {open ? (
                        <Icon size={32} strokeWidth={1.6} aria-hidden />
                      ) : (
                        <Lock size={28} strokeWidth={1.7} aria-hidden />
                      )}
                    </button>
                    <div className="qc-node-label">{cat.label.toLowerCase()}</div>
                    <div className="qc-node-sub">
                      {open ? `${count}/${total}` : "bloqueada"}
                      {open && count >= total ? " · concluída" : ""}
                    </div>
                  </div>
                );
              })}
            </div>

            <div id="qc-desbloquear" style={{ marginTop: 44, display: "grid", gap: 12 }}>
              <h2 style={{ fontFamily: DISPLAY, fontSize: 24, margin: 0 }}>Desbloquear todas as categorias</h2>
              <p style={{ fontSize: 14, color: "#3D4B5C", margin: 0 }}>
                Compra única, sem criar conta. O link de acesso chega no seu e-mail.
              </p>
              {PRODUCTS.map((p) => (
                <button key={p.slug} className="qc-buy" onClick={() => void buy(p.slug)} disabled={buying === p.slug}>
                  <strong style={{ fontFamily: MONO, fontSize: 13 }}>{p.title}</strong>
                  <span style={{ fontFamily: DISPLAY, fontSize: 22 }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: "#3D4B5C" }}>{p.note}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: TEAL_DEEP }}>
                    {buying === p.slug ? "abrindo pagamento" : "comprar agora"}
                  </span>
                </button>
              ))}

              <label htmlFor="qc-token" style={{ fontFamily: MONO, fontSize: 12, marginTop: 8 }}>
                JÁ COMPREI, TENHO O LINK DE ACESSO
              </label>
              <input
                id="qc-token"
                className="qc-input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole aqui o link do e-mail"
              />
              {tokenError && <span style={{ fontSize: 13, color: "#B3261E" }}>{tokenError}</span>}
              <button className="qc-round" onClick={() => void redeem()} disabled={redeeming || !token.trim()}>
                {redeeming ? "Verificando" : "Liberar neste aparelho"}
              </button>

              <p style={{ fontSize: 13, color: "#3D4B5C", marginTop: 6 }}>
                Assinantes do SalbCare PRO já têm tudo liberado.{" "}
                <Link to="/pro" className="pro-link">
                  Ver o PRO
                </Link>
              </p>
            </div>

            <div style={{ marginTop: 30 }}>
              <InstallPrompt />
            </div>
          </>
        )}

        {category && !done && (
          <>
            <button className="qc-ghost" style={{ marginTop: 18 }} onClick={() => setOpenCat(null)}>
              <ArrowLeft size={13} strokeWidth={1.8} aria-hidden /> voltar para a trilha
            </button>
            <div style={{ marginTop: 18 }}>
              <div className="qc-bar" aria-hidden>
                <span style={{ width: `${((index + 1) / category.phrases.length) * 100}%` }} />
              </div>
              <p style={{ fontFamily: MONO, fontSize: 12, marginTop: 8 }}>
                {index + 1}/{category.phrases.length} · {category.label.toLowerCase()}
              </p>
            </div>

            <div className="qc-card">
              <div className="qc-target">{category.phrases[index][lang]}</div>
              {lang !== "pt" && <div className="qc-pt">{category.phrases[index].pt}</div>}
              <button
                className="qc-ghost"
                style={{ justifySelf: "center" }}
                onClick={() => toggleFavorite(`${category.id}-${index}`)}
                aria-pressed={favorites.includes(`${category.id}-${index}`)}
              >
                <Star
                  size={14}
                  strokeWidth={1.8}
                  aria-hidden
                  color={favorites.includes(`${category.id}-${index}`) ? GOLD : NAVY_INK}
                />
                {favorites.includes(`${category.id}-${index}`) ? "favorita" : "favoritar"}
              </button>
            </div>

            <button className="qc-round" style={{ marginTop: 18 }} onClick={next}>
              {index + 1 >= category.phrases.length ? "Concluir categoria" : "Próxima frase"}
            </button>
          </>
        )}

        {category && done && (
          <div style={{ marginTop: 30, textAlign: "center" }}>
            <div className="qc-confetti" aria-hidden>
              {Array.from({ length: 14 }).map((_, i) => (
                <i
                  key={i}
                  style={{
                    left: `${(i * 7) % 100}%`,
                    background: i % 3 === 0 ? TEAL : i % 3 === 1 ? GOLD : NAVY_INK,
                    animationDelay: `${(i % 5) * 0.12}s`,
                  }}
                />
              ))}
            </div>
            <Check size={26} strokeWidth={1.8} color={TEAL_DEEP} aria-hidden />
            <h2 style={{ fontFamily: DISPLAY, fontSize: 28, margin: "10px 0 0" }}>Categoria concluída!</h2>
            <p style={{ fontSize: 14, color: "#3D4B5C", marginTop: 8 }}>
              Você viu todas as frases de {category.label.toLowerCase()}. Volte amanhã para manter a sequência.
            </p>
            <button className="qc-round" style={{ marginTop: 20 }} onClick={() => setOpenCat(null)}>
              Voltar para a trilha
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickCard;
