/**
 * Jogo gratuito da SalbCare Academy: o profissional atende um paciente virtual
 * do início ao fim, em inglês ou espanhol. Progresso apenas em estado local.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Lock, Volume2 } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/pro/SiteChrome";
import { CREAM, DISPLAY, GOLD, MONO, NAVY, ProLabel, SANS, TEAL_DEEP, proStyles } from "@/components/pro/brand";
import PatientAvatar from "@/components/academy/PatientAvatar";
import {
  CONFIDENCE_NEAR,
  CONFIDENCE_START,
  CONFIDENCE_UP,
  CONFIDENCE_WRONG,
  GAME_CASES,
  LOCKED_CASES,
  UNLOCK_PRICE,
  sealFor,
  type GameCase,
  type Verdict,
} from "@/config/academyGame";

const GAME_STYLES = `
  .ag-scene { animation: ag-in 250ms ease both; }
  @keyframes ag-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  .ag-bar { height: 8px; border-radius: 999px; background: rgba(10,22,40,0.12); overflow: hidden; }
  .ag-bar > span { display: block; height: 100%; background: ${TEAL_DEEP}; transition: width 250ms ease; }
  .ag-opt {
    width: 100%; text-align: left; font-family: ${SANS}; font-size: 15px; line-height: 1.5;
    background: #FFFFFF; color: ${CREAM}; border: 1px solid rgba(10,22,40,0.2);
    border-radius: 12px; padding: 14px 16px; cursor: pointer; min-height: 52px;
    transition: border-color 160ms ease, background 160ms ease;
  }
  .ag-opt:hover:not(:disabled) { border-color: ${TEAL_DEEP}; background: rgba(45,212,191,0.08); }
  .ag-opt:disabled { opacity: 0.55; cursor: default; }
  .ag-chip {
    font-family: ${SANS}; font-size: 14px; background: #FFFFFF; color: ${CREAM};
    border: 1px solid rgba(10,22,40,0.2); border-radius: 999px; padding: 9px 14px; cursor: pointer;
  }
  .ag-chip:hover { border-color: ${TEAL_DEEP}; }
  .ag-locked { position: relative; overflow: hidden; }
  .ag-locked-body { filter: blur(4px); opacity: 0.5; }
  .ag-case-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  @media (min-width: 760px) { .ag-case-grid { grid-template-columns: 1fr 1fr; } }
  @media (prefers-reduced-motion: reduce) { .ag-scene { animation: none; } .ag-bar > span { transition: none; } }
`;

type Phase = "select" | "play" | "result";
type Mood = "neutral" | "happy" | "confused" | "uncomfortable";

interface SceneLog {
  step: string;
  firstTry: boolean;
  answer: string;
}

const MOOD_BY_VERDICT: Record<Verdict, Mood> = {
  correct: "happy",
  near: "confused",
  wrong: "uncomfortable",
};

const speak = (text: string, locale: string) => {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    u.rate = 0.9;
    synth.speak(u);
  } catch {
    /* navegador sem suporte: o texto do exercício continua legível */
  }
};

const fmtTime = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

const AcademyGame = () => {
  const [phase, setPhase] = useState<Phase>("select");
  const [caseId, setCaseId] = useState<string | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [confidence, setConfidence] = useState(CONFIDENCE_START);
  const [attempts, setAttempts] = useState(0);
  const [log, setLog] = useState<SceneLog[]>([]);
  const [feedback, setFeedback] = useState<{ verdict: Verdict; reaction: string; hint?: string } | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const startedAt = useRef(0);
  const [elapsed, setElapsed] = useState(0);

  const activeCase = useMemo<GameCase | null>(() => GAME_CASES.find((c) => c.id === caseId) ?? null, [caseId]);
  const scene = activeCase?.scenes[sceneIndex] ?? null;
  const exercise = scene?.exercise;

  const startCase = (id: string) => {
    setCaseId(id);
    setPhase("play");
    setSceneIndex(0);
    setConfidence(CONFIDENCE_START);
    setAttempts(0);
    setLog([]);
    setFeedback(null);
    setPicked([]);
    startedAt.current = Date.now();
  };

  const register = useCallback(
    (verdict: Verdict, reaction: string, hint: string | undefined, answer: string) => {
      setConfidence((c) =>
        Math.max(0, Math.min(100, c + (verdict === "correct" ? CONFIDENCE_UP : verdict === "near" ? CONFIDENCE_NEAR : CONFIDENCE_WRONG))),
      );
      setFeedback({ verdict, reaction, hint });
      setRemaining(null);
      if (verdict === "correct" && scene) {
        setLog((l) => [...l, { step: scene.step, firstTry: attempts === 0, answer }]);
      } else {
        setAttempts((a) => a + 1);
      }
    },
    [attempts, scene],
  );

  // Cronômetro da cena com tempo limite.
  useEffect(() => {
    if (phase !== "play" || !exercise || exercise.kind !== "choice" || !exercise.seconds || feedback) {
      setRemaining(null);
      return;
    }
    setRemaining(exercise.seconds);
    const t = window.setInterval(() => {
      setRemaining((r) => {
        if (r === null) return null;
        if (r <= 1) {
          window.clearInterval(t);
          register("wrong", "I am still waiting...", "O silêncio prolongado deixa o paciente inseguro. Responda mesmo com uma frase simples.", "");
          return null;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sceneIndex, feedback, caseId]);

  const advance = () => {
    if (!activeCase) return;
    setFeedback(null);
    setPicked([]);
    setAttempts(0);
    if (sceneIndex + 1 >= activeCase.scenes.length) {
      setElapsed(Date.now() - startedAt.current);
      setPhase("result");
      return;
    }
    setSceneIndex((i) => i + 1);
  };

  const retry = () => {
    setFeedback(null);
    setPicked([]);
  };

  const mood: Mood = feedback ? MOOD_BY_VERDICT[feedback.verdict] : "neutral";

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: CREAM, fontFamily: SANS }}>
      <Helmet>
        <title>Jogo de atendimento em inglês e espanhol | SalbCare Academy</title>
        <meta
          name="description"
          content="Atenda pacientes virtuais em inglês e espanhol, do primeiro contato ao pagamento. Prática gratuita da SalbCare Academy, sem cadastro."
        />
        <link rel="canonical" href="https://salbcare.com/academy/jogo" />
        <meta property="og:title" content="Jogo de atendimento em inglês e espanhol | SalbCare Academy" />
        <meta property="og:description" content="Prática gratuita de atendimento em inglês e espanhol, caso por caso." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <style>{proStyles + GAME_STYLES}</style>

      <SiteHeader />

      {phase === "select" && (
        <>
          <section className="pro-wrap pro-section" style={{ paddingBottom: 32 }}>
            <ProLabel>Prática gratuita</ProLabel>
            <h1 className="pro-h1" style={{ maxWidth: 660 }}>
              Atenda um paciente estrangeiro do início ao fim.
            </h1>
            <p className="pro-lead" style={{ marginTop: 18, maxWidth: 560 }}>
              Cada caso tem cinco cenas, da recepção ao pagamento. O paciente reage ao que você diz e a confiança dele
              sobe ou desce. Sem cadastro, sem cobrança.
            </p>
          </section>

          <section className="pro-wrap" style={{ paddingBottom: 64 }}>
            <div className="ag-case-grid">
              {GAME_CASES.map((c) => (
                <div key={c.id} className="pro-card">
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <PatientAvatar variant={c.avatar} size={56} />
                    <div>
                      <div className="pro-mono" style={{ color: TEAL_DEEP }}>
                        {c.languageLabel.toUpperCase()} · 5 CENAS
                      </div>
                      <div style={{ fontFamily: DISPLAY, fontSize: 20, marginTop: 4 }}>{c.patientName}</div>
                    </div>
                  </div>
                  <p className="pro-body" style={{ marginTop: 12 }}>
                    {c.headline}
                  </p>
                  <p className="pro-body" style={{ marginTop: 6, opacity: 0.85 }}>
                    {c.context}
                  </p>
                  <button type="button" className="pro-cta" style={{ marginTop: 16 }} onClick={() => startCase(c.id)}>
                    Começar o atendimento
                  </button>
                </div>
              ))}
            </div>

            <h2 className="pro-h2" style={{ marginTop: 56 }}>
              Mais oito casos vêm com a apostila.
            </h2>
            <div className="ag-case-grid" style={{ marginTop: 20 }}>
              {LOCKED_CASES.slice(0, 4).map((title) => (
                <div key={title} className="pro-card ag-locked">
                  <div className="pro-mono" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Lock size={13} /> BLOQUEADO
                  </div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 18, marginTop: 8 }}>{title}</div>
                  <p className="pro-body ag-locked-body" style={{ marginTop: 8 }}>
                    Cinco cenas com vocabulário próprio, reações do paciente e placar de confiança.
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {phase === "play" && activeCase && scene && exercise && (
        <section className="pro-wrap pro-section" style={{ paddingTop: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <span className="pro-mono">
              CENA {sceneIndex + 1} DE {activeCase.scenes.length} · {scene.step.toUpperCase()}
            </span>
            <span className="pro-mono" style={{ color: TEAL_DEEP }}>
              CONFIANÇA {confidence}
            </span>
          </div>
          <div className="ag-bar" style={{ marginTop: 10 }}>
            <span style={{ width: `${confidence}%`, background: confidence < 30 ? GOLD : TEAL_DEEP }} />
          </div>
          {confidence < 30 && (
            <p className="pro-mono" style={{ marginTop: 8, color: GOLD }}>
              O ATENDIMENTO ESTÁ INDO MAL. RESPIRE E SIGA COM FRASES SIMPLES.
            </p>
          )}

          <div className="ag-scene" key={`${activeCase.id}-${sceneIndex}-${feedback ? "fb" : "q"}`} style={{ marginTop: 26 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <PatientAvatar variant={activeCase.avatar} mood={mood} size={54} />
              <div className="pro-card" style={{ flex: 1, background: "#FFFFFF" }}>
                <div className="pro-mono">{activeCase.patientName.toUpperCase()}</div>
                <p className="pro-body" style={{ marginTop: 8 }}>
                  {feedback ? feedback.reaction : scene.situation}
                </p>
                {!feedback && exercise.kind === "choice" && exercise.audio && (
                  <button
                    type="button"
                    className="ag-chip"
                    style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8 }}
                    onClick={() => speak(exercise.audio!, activeCase.speechLocale)}
                  >
                    <Volume2 size={14} /> Ouvir o paciente
                  </button>
                )}
                {feedback?.hint && (
                  <p className="pro-body" style={{ marginTop: 12, borderTop: "1px solid rgba(10,22,40,0.12)", paddingTop: 12 }}>
                    {feedback.hint}
                  </p>
                )}
              </div>
            </div>

            <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
              {feedback ? (
                feedback.verdict === "correct" ? (
                  <button type="button" className="pro-cta" onClick={advance}>
                    Continuar
                  </button>
                ) : (
                  <button type="button" className="pro-cta" onClick={retry}>
                    Tentar de novo
                  </button>
                )
              ) : exercise.kind === "choice" ? (
                <>
                  {remaining !== null && (
                    <span className="pro-mono" style={{ color: GOLD }}>
                      {String(remaining).padStart(2, "0")} SEGUNDOS
                    </span>
                  )}
                  {exercise.options.map((o) => (
                    <button
                      key={o.text}
                      type="button"
                      className="ag-opt"
                      onClick={() => register(o.verdict, o.reaction, o.hint, o.text)}
                    >
                      {o.text}
                    </button>
                  ))}
                </>
              ) : exercise.kind === "gap" ? (
                <>
                  <p className="pro-body">
                    {exercise.before} <strong>{picked[0] ?? "___"}</strong> {exercise.after}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {exercise.options.map((o) => (
                      <button
                        key={o}
                        type="button"
                        className="ag-chip"
                        onClick={() =>
                          o === exercise.answer
                            ? register("correct", exercise.reaction, undefined, `${exercise.before} ${o} ${exercise.after}`)
                            : register("near", "Sorry, I didn't quite catch that.", exercise.hint, o)
                        }
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="pro-card"
                    style={{ minHeight: 56, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}
                  >
                    {picked.length === 0 ? (
                      <span className="pro-mono">TOQUE NAS PALAVRAS NA ORDEM</span>
                    ) : (
                      picked.map((w, i) => (
                        <button
                          key={`${w}-${i}`}
                          type="button"
                          className="ag-chip"
                          onClick={() => setPicked((p) => p.filter((_, idx) => idx !== i))}
                        >
                          {w}
                        </button>
                      ))
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {exercise.words
                      .filter((w) => picked.filter((p) => p === w).length < exercise.words.filter((x) => x === w).length)
                      .map((w, i) => (
                        <button key={`${w}-opt-${i}`} type="button" className="ag-chip" onClick={() => setPicked((p) => [...p, w])}>
                          {w}
                        </button>
                      ))}
                  </div>
                  <button
                    type="button"
                    className="pro-cta"
                    disabled={picked.length === 0}
                    onClick={() =>
                      picked.join(" ") === exercise.answer
                        ? register("correct", exercise.reaction, undefined, exercise.answer)
                        : register("near", "Sorry, I didn't quite catch that.", exercise.hint, picked.join(" "))
                    }
                  >
                    Conferir a frase
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {phase === "result" && activeCase && (
        <section className="pro-wrap pro-section" style={{ paddingTop: 32 }}>
          <ProLabel>Placar do atendimento</ProLabel>
          <h1 className="pro-h1" style={{ maxWidth: 620 }}>
            Você atendeu {activeCase.patientName} do início ao fim.
          </h1>

          <div className="pro-card" style={{ marginTop: 26 }}>
            <div className="pro-mono" style={{ color: TEAL_DEEP }}>
              CONFIANÇA FINAL
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 40, lineHeight: 1.1, marginTop: 6 }}>{confidence}</div>
            <div className="pro-body">{sealFor(confidence)}</div>
            <div className="ag-bar" style={{ marginTop: 12 }}>
              <span style={{ width: `${confidence}%` }} />
            </div>
            <p className="pro-mono" style={{ marginTop: 12 }}>TEMPO TOTAL {fmtTime(elapsed)}</p>
          </div>

          <CertificateIssuer language={activeCase.language} score={confidence} />

          <div className="pro-card" style={{ marginTop: 18 }}>
            <div className="pro-mono" style={{ color: TEAL_DEEP }}>
              ACERTOS DE PRIMEIRA
            </div>
            <ul className="pro-body" style={{ margin: "10px 0 0", paddingLeft: 18 }}>
              {log.filter((l) => l.firstTry).map((l) => (
                <li key={l.step}>
                  {l.step}: {l.answer}
                </li>
              ))}
              {log.filter((l) => l.firstTry).length === 0 && <li>Nenhuma cena saiu de primeira nesta rodada.</li>}
            </ul>
            <div className="pro-mono" style={{ color: TEAL_DEEP, marginTop: 18 }}>
              ONDE VOCÊ TRAVOU
            </div>
            <ul className="pro-body" style={{ margin: "10px 0 0", paddingLeft: 18 }}>
              {log.filter((l) => !l.firstTry).map((l) => (
                <li key={l.step}>
                  {l.step}: a versão correta é "{l.answer}"
                </li>
              ))}
              {log.filter((l) => !l.firstTry).length === 0 && <li>Você não travou em nenhuma cena.</li>}
            </ul>
          </div>

          <div className="pro-card" style={{ marginTop: 26 }}>
            <h2 className="pro-h2">Faltam mais oito casos.</h2>
            <p className="pro-body" style={{ marginTop: 10 }}>
              Emergência, criança acompanhada dos pais, paciente com plano internacional, retorno pós-procedimento e
              outros.
            </p>
            <div className="ag-case-grid" style={{ marginTop: 18 }}>
              {LOCKED_CASES.slice(0, 4).map((title) => (
                <div key={title} className="ag-locked" style={{ border: "1px solid rgba(10,22,40,0.12)", borderRadius: 10, padding: 14 }}>
                  <div className="pro-mono" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Lock size={13} /> BLOQUEADO
                  </div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 17, marginTop: 6 }}>{title}</div>
                  <p className="pro-body ag-locked-body" style={{ marginTop: 6 }}>
                    Cinco cenas, reações do paciente e placar de confiança.
                  </p>
                </div>
              ))}
            </div>
            <Link
              to={`/academy/${activeCase.language === "en" ? "ingles-para-atendimento-em-saude" : "espanhol-para-atendimento-em-saude"}`}
              className="pro-cta"
              style={{ marginTop: 20, textDecoration: "none" }}
            >
              Desbloquear todos os casos e o certificado, {UNLOCK_PRICE}
            </Link>
            <p className="pro-mono" style={{ marginTop: 10 }}>A APOSTILA COMPLETA EM PDF VEM JUNTO.</p>
          </div>

          <div style={{ marginTop: 24, display: "grid", gap: 10 }}>
            <button type="button" className="pro-cta pro-cta-ghost" onClick={() => startCase(activeCase.id)}>
              Atender de novo
            </button>
            <button type="button" className="pro-cta pro-cta-ghost" onClick={() => setPhase("select")}>
              Escolher outro caso
            </button>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
};

export default AcademyGame;
