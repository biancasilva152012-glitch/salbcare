import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, GraduationCap, Lock, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import PageContainer from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAcademyAccess } from "@/hooks/useAcademyAccess";
import { useAcademyCatalog } from "@/hooks/useAcademyCatalog";
import { useAcademyPrices } from "@/hooks/useAcademyPrices";
import { GAME_CASES, type Exercise, type GameCase, type Verdict } from "@/config/academyGame";
import { toast } from "sonner";

type Track = {
  lang: "en" | "es";
  slug: string;
  title: string;
  subtitle: string;
  caseData: GameCase;
};

type LessonState = "idle" | "answered";

const tracks: Track[] = GAME_CASES.map((caseData) => ({
  lang: caseData.language,
  slug: caseData.language === "en" ? "ingles-para-atendimento-em-saude" : "espanhol-para-atendimento-em-saude",
  title: caseData.language === "en" ? "Inglês para atendimento em saúde" : "Espanhol para atendimento em saúde",
  subtitle: caseData.language === "en" ? "Recepção, anamnese e orientação em inglês." : "Conduza pacientes hispanofalantes com segurança.",
  caseData,
}));

const buyableSlugs = ["ingles-para-atendimento-em-saude", "espanhol-para-atendimento-em-saude", "international-healthcare-kit"];

const speak = (text: string, locale: string) => {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = 0.9;
    synth.speak(utterance);
  } catch {
    toast.info("Áudio indisponível neste navegador.");
  }
};

const readCompleted = () => {
  try {
    return JSON.parse(localStorage.getItem("salbcare_academy_completed_lessons") || "[]") as string[];
  } catch {
    return [];
  }
};

const writeCompleted = (items: string[]) => {
  try {
    localStorage.setItem("salbcare_academy_completed_lessons", JSON.stringify(items));
    if (items.length > 0) localStorage.setItem("salbcare_academy_first_lesson_done", "1");
  } catch {
    /* armazenamento local indisponível */
  }
};

const answerLabel = (verdict: Verdict) => {
  if (verdict === "correct") return "Correto";
  if (verdict === "near") return "Quase";
  return "Revise";
};

const Academy = () => {
  const navigate = useNavigate();
  const { access, langs, loading: accessLoading, isLoggedIn } = useAcademyAccess();
  const { products } = useAcademyCatalog();
  const { prices, isLoading: pricesLoading } = useAcademyPrices();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>(readCompleted);
  const [lessonState, setLessonState] = useState<LessonState>("idle");
  const [feedback, setFeedback] = useState<{ verdict: Verdict; text: string; hint?: string } | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [busySlug, setBusySlug] = useState<string | null>(null);

  const activeLesson = selectedTrack?.caseData.scenes[lessonIndex] ?? null;
  const progress = useMemo(() => {
    const total = tracks.reduce((sum, track) => sum + track.caseData.scenes.length, 0);
    if (total === 0) return 0;
    return Math.round((completed.length / total) * 100);
  }, [completed.length]);

  const streak = useMemo(() => {
    try {
      return Number(localStorage.getItem("salbcare_academy_streak") || "0");
    } catch {
      return 0;
    }
  }, [completed.length]);

  const hasTrackAccess = (track: Track) =>
    access && (langs.length === 0 || langs.includes(track.lang) || (track.lang === "en" && langs.includes("pt")));

  const isLessonUnlocked = (track: Track, index: number) => index < 2 || hasTrackAccess(track);

  const startLesson = (track: Track, index: number) => {
    if (!isLessonUnlocked(track, index)) {
      setSelectedTrack(track);
      setLessonIndex(index);
      setPaywallOpen(true);
      return;
    }
    setSelectedTrack(track);
    setLessonIndex(index);
    setLessonState("idle");
    setFeedback(null);
    setPicked([]);
  };

  const markCompleteAndContinue = () => {
    if (!selectedTrack || !activeLesson) return;
    const id = `${selectedTrack.lang}-${activeLesson.id}`;
    const nextCompleted = completed.includes(id) ? completed : [...completed, id];
    setCompleted(nextCompleted);
    writeCompleted(nextCompleted);

    const nextIndex = lessonIndex + 1;
    if (nextIndex < selectedTrack.caseData.scenes.length) {
      if (!isLessonUnlocked(selectedTrack, nextIndex)) {
        setPaywallOpen(true);
        return;
      }
      setLessonIndex(nextIndex);
      setLessonState("idle");
      setFeedback(null);
      setPicked([]);
      return;
    }
    setSelectedTrack(null);
    setLessonState("idle");
    setFeedback(null);
    setPicked([]);
    toast.success("Lição concluída.");
  };

  const registerAnswer = (verdict: Verdict, text: string, hint?: string) => {
    setFeedback({ verdict, text, hint });
    setLessonState("answered");
  };

  const buy = async (slug: string) => {
    setBusySlug(slug);
    try {
      const { data, error } = await supabase.functions.invoke("academy-checkout", { body: { slug } });
      if (error || !data?.url) throw new Error("checkout");
      window.location.href = data.url as string;
    } catch {
      toast.error("Não foi possível abrir o pagamento.");
      setBusySlug(null);
    }
  };

  const renderExercise = (exercise: Exercise, track: Track) => {
    if (lessonState === "answered" && feedback) {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{answerLabel(feedback.verdict)}</p>
            <p className="mt-2 text-base font-semibold text-foreground">{feedback.text}</p>
            {feedback.hint && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feedback.hint}</p>}
          </div>
          {feedback.verdict === "correct" ? (
            <Button className="w-full gap-2" onClick={markCompleteAndContinue}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => { setLessonState("idle"); setFeedback(null); setPicked([]); }}>
              Tentar de novo
            </Button>
          )}
        </div>
      );
    }

    if (exercise.kind === "choice") {
      return (
        <div className="space-y-3">
          {exercise.audio && (
            <Button variant="outline" className="w-full gap-2" onClick={() => speak(exercise.audio || "", track.caseData.speechLocale)}>
              <Volume2 className="h-4 w-4" /> Ouvir o paciente
            </Button>
          )}
          {exercise.options.map((option) => (
            <button
              key={option.text}
              type="button"
              onClick={() => registerAnswer(option.verdict, option.reaction, option.hint)}
              className="min-h-14 w-full rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-semibold leading-relaxed shadow-sm transition-colors hover:bg-accent"
            >
              {option.text}
            </button>
          ))}
        </div>
      );
    }

    if (exercise.kind === "gap") {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 text-lg font-semibold shadow-sm">
            {exercise.before} <span className="text-gold">{picked[0] ?? "______"}</span> {exercise.after}
          </div>
          <div className="grid gap-2">
            {exercise.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  option === exercise.answer
                    ? registerAnswer("correct", exercise.reaction)
                    : registerAnswer("near", "A frase ainda não está natural para o atendimento.", exercise.hint)
                }
                className="min-h-12 rounded-xl border border-border bg-card px-4 text-left text-sm font-semibold shadow-sm hover:bg-accent"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="min-h-16 rounded-2xl border border-border bg-card p-3 shadow-sm">
          {picked.length === 0 ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Toque nas palavras na ordem correta</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {picked.map((word, index) => (
                <button
                  key={`${word}-${index}`}
                  type="button"
                  onClick={() => setPicked((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  className="min-h-11 rounded-xl border border-border bg-accent px-3 text-sm font-semibold"
                >
                  {word}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {exercise.words
            .filter((word) => picked.filter((item) => item === word).length < exercise.words.filter((item) => item === word).length)
            .map((word, index) => (
              <button
                key={`${word}-option-${index}`}
                type="button"
                onClick={() => setPicked((current) => [...current, word])}
                className="min-h-11 rounded-xl border border-border bg-card px-3 text-sm font-semibold shadow-sm hover:bg-accent"
              >
                {word}
              </button>
            ))}
        </div>
        <Button
          className="w-full"
          disabled={picked.length === 0}
          onClick={() =>
            picked.join(" ") === exercise.answer
              ? registerAnswer("correct", exercise.reaction)
              : registerAnswer("near", "A ordem ainda não está pronta para usar com o paciente.", exercise.hint)
          }
        >
          Conferir frase
        </Button>
      </div>
    );
  };

  return (
    <PageContainer className="bg-background">
      <Helmet>
        <title>SALB Academy | Aprenda, pratique e evolua</title>
        <meta name="description" content="Trilhas práticas de Inglês e Espanhol para profissionais de saúde dentro do SalbCare." />
        <link rel="canonical" href="https://salbcare.com/academy" />
        <meta property="og:title" content="SALB Academy | Aprenda, pratique e evolua" />
        <meta property="og:description" content="Lições rápidas e apostilas práticas para atendimento em saúde." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {!selectedTrack && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <header className="space-y-3">
            {isLoggedIn && (
              <Button variant="ghost" className="h-12 px-0 text-muted-foreground" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4" /> Início
              </Button>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gold">SALB Academy</p>
              <h1 className="mt-1 text-2xl font-bold leading-tight text-foreground">Aprenda. Pratique. Evolua.</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Lições curtas para usar idiomas no atendimento real.</p>
            </div>
          </header>

          <section className="rounded-2xl border border-gold/40 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Continuar aprendendo</p>
                <h2 className="mt-1 text-lg font-bold">How to take a patient's medical history</h2>
              </div>
              <GraduationCap className="h-6 w-6 text-gold" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-background p-3">
                <p className="font-mono text-xl font-semibold">{streak}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sequência</p>
              </div>
              <div className="rounded-xl bg-background p-3">
                <p className="font-mono text-xl font-semibold">{progress}%</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Progresso</p>
              </div>
              <div className="rounded-xl bg-background p-3">
                <p className="font-mono text-xl font-semibold">{completed.length}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Lições</p>
              </div>
            </div>
            <Button className="mt-4 w-full gap-2" onClick={() => startLesson(tracks[0], Math.min(completed.length, 1))}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trilhas</p>
            {tracks.map((track) => {
              const done = track.caseData.scenes.filter((scene) => completed.includes(`${track.lang}-${scene.id}`)).length;
              const percent = Math.round((done / track.caseData.scenes.length) * 100);
              return (
                <div key={track.lang} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold leading-snug">{track.title}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{track.subtitle}</p>
                    </div>
                    <BookOpen className="h-5 w-5 shrink-0 text-gold" />
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="mt-4 space-y-2">
                    {track.caseData.scenes.map((scene, index) => {
                      const locked = !isLessonUnlocked(track, index);
                      const sceneDone = completed.includes(`${track.lang}-${scene.id}`);
                      return (
                        <button
                          key={scene.id}
                          type="button"
                          onClick={() => startLesson(track, index)}
                          className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-background px-3 text-left transition-colors hover:bg-accent"
                        >
                          {locked ? <Lock className="h-4 w-4 shrink-0 text-muted-foreground" /> : <CheckCircle2 className={`h-4 w-4 shrink-0 ${sceneDone ? "text-gold" : "text-secondary"}`} />}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{scene.step}</span>
                            <span className="block truncate text-xs text-muted-foreground">{index < 2 ? "Grátis" : locked ? "Apostila necessária" : "Liberada"}</span>
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        </motion.div>
      )}

      {selectedTrack && activeLesson && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <header className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" size="icon" aria-label="Voltar para trilhas" onClick={() => setSelectedTrack(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Lição {lessonIndex + 1} de {selectedTrack.caseData.scenes.length}
              </p>
              <Button variant="outline" size="icon" aria-label="Abrir paywall" onClick={() => setPaywallOpen(true)}>
                <Lock className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-gold" style={{ width: `${((lessonIndex + 1) / selectedTrack.caseData.scenes.length) * 100}%` }} />
            </div>
          </header>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold">{selectedTrack.title}</p>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-foreground">{activeLesson.step}</h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{activeLesson.situation}</p>
          </section>

          {renderExercise(activeLesson.exercise, selectedTrack)}
        </motion.div>
      )}

      <Sheet open={paywallOpen} onOpenChange={setPaywallOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-border bg-card pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <SheetHeader className="text-left">
            <SheetTitle>Desbloqueie as apostilas da Academy</SheetTitle>
            <SheetDescription>
              Os dois primeiros módulos são grátis. A compra libera as lições avançadas e o PDF correspondente.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5 grid gap-3">
            {products.filter((product) => buyableSlugs.includes(product.slug)).map((product) => {
              const remote = prices[product.slug];
              const price = remote?.price ?? (pricesLoading ? "Carregando" : product.price ?? "Consulte o preço");
              const isBundle = product.slug === "international-healthcare-kit";
              return (
                <div key={product.slug} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold leading-snug">{product.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{price}</p>
                    </div>
                    {isBundle && <span className="rounded-full bg-gold px-2 py-1 text-[10px] font-semibold text-gold-foreground">Melhor valor</span>}
                  </div>
                  <Button className="mt-3 w-full" disabled={busySlug === product.slug} onClick={() => buy(product.slug)}>
                    {busySlug === product.slug ? "Abrindo pagamento" : "Comprar apostila"}
                  </Button>
                </div>
              );
            })}
          </div>
          {accessLoading && <p className="mt-3 text-xs text-muted-foreground">Verificando acesso.</p>}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
};

export default Academy;
