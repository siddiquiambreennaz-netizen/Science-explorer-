import { useMemo, useState, type DragEvent, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, Download, GraduationCap, Lightbulb, Loader2, Play, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/lang-store";
import { generateTopicGame } from "@/lib/learn.functions";
import type { TopicGameItem, TopicGameSpec } from "@/lib/topic-game-types";
import { cn } from "@/lib/utils";
import { saveOfflinePack } from "@/lib/offline-downloads";

type Complete = (score: number, total: number) => Promise<string>;
type Props = { onComplete?: Complete; onExit: () => void };
type Language = "en" | "ur" | "roman" | "sd";
type Phase = "setup" | "mission" | "quiz" | "results";

const ui = {
  en: { eyebrow: "AI GAME CREATOR", title: "Create your own game", intro: "Enter a school topic. AI will turn it into a hands-on mission—not just a quiz.", topic: "Your topic", topicHint: "e.g. Gravity, Fractions, Photosynthesis, Chemical Bonding", grade: "Class / Grade", generate: "Build my game", loading: "Designing your mission…", ageNote: "Made mainly for Classes 9–10 / Matric. Classes 5–8 are supported; no preschool or First Year/Inter mode.", story: "Mission briefing", objective: "What you will learn", goal: "Your mission", tray: "Move these cards", zones: "Mission zones", dropHint: "Drag a card here—or tap a card, then tap a zone.", hint: "Get a hint", check: "Check mission", reset: "Reset", checkAgain: "Try again", missionSuccess: "Mission complete! The science behind your choices is below.", missionPartial: "Nice attempt! Review the feedback, move any cards you want to change, and check again—or continue to the quick quiz.", continueQuiz: "Continue to final quiz", quizTitle: "Mission debrief", quizNext: "Check answer", nextQuestion: "Next question", finishQuiz: "Finish mission", results: "Mission complete", reward: "Reward unlocked", playAgain: "Play again", exit: "Exit", correct: "Correct", incorrect: "Not quite", score: "Your score", zonesLabel: "Drop zones", noAnswer: "Choose an answer first.", errorPrefix: "Could not generate the game", regenerate: "Try again", world: "World", chooseClass: "Choose a class", safeNote: "The AI creates game rules and content only. The app runs these through a safe, prebuilt interaction engine.", missionDone: "Mission score", quizScore: "Quiz score", great: "Great work!" },
  ur: { eyebrow: "اے آئی گیم کریئیٹر", title: "اپنی گیم بنائیں", intro: "اپنا تعلیمی موضوع لکھیں۔ اے آئی اس سے عملی مشن بنائے گا، صرف کوئز نہیں۔", topic: "آپ کا موضوع", topicHint: "مثلاً کششِ ثقل، کسر، ضیائی تالیف، کیمیائی بند", grade: "جماعت", generate: "میری گیم بنائیں", loading: "مشن تیار ہو رہا ہے…", ageNote: "خاص توجہ جماعت 9–10 / میٹرک پر ہے۔ جماعت 5–8 بھی شامل ہیں؛ پری اسکول یا فرسٹ ایئر/انٹر نہیں۔", story: "مشن کی کہانی", objective: "آپ کیا سیکھیں گے", goal: "آپ کا مشن", tray: "کارڈز منتقل کریں", zones: "مشن زونز", dropHint: "کارڈ یہاں گھسیٹیں، یا پہلے کارڈ اور پھر زون کو ٹیپ کریں۔", hint: "اشارہ لیں", check: "مشن چیک کریں", reset: "دوبارہ شروع", checkAgain: "دوبارہ کوشش کریں", missionSuccess: "مشن مکمل! آپ کے انتخاب کے پیچھے سائنس نیچے دی گئی ہے۔", missionPartial: "اچھی کوشش! وضاحت دیکھیں، ضرورت ہو تو کارڈز بدلیں، دوبارہ چیک کریں یا کوئز پر جائیں۔", continueQuiz: "آخری کوئز کی طرف", quizTitle: "مشن کا جائزہ", quizNext: "جواب چیک کریں", nextQuestion: "اگلا سوال", finishQuiz: "مشن ختم کریں", results: "مشن مکمل", reward: "انعام حاصل", playAgain: "دوبارہ کھیلیں", exit: "باہر جائیں", correct: "درست", incorrect: "ابھی درست نہیں", score: "آپ کا اسکور", zonesLabel: "ڈراپ زونز", noAnswer: "پہلے جواب منتخب کریں۔", errorPrefix: "گیم نہیں بن سکی", regenerate: "دوبارہ کوشش کریں", world: "دنیا", chooseClass: "جماعت منتخب کریں", safeNote: "اے آئی صرف گیم کے قواعد اور مواد بناتا ہے۔ ایپ انہیں محفوظ، پہلے سے بنے انٹرایکشن انجن میں چلاتی ہے۔", missionDone: "مشن اسکور", quizScore: "کوئز اسکور", great: "بہت خوب!" },
  roman: { eyebrow: "AI GAME CREATOR", title: "Apni game banao", intro: "Apna school topic likho. AI us se hands-on mission banayega—sirf quiz nahi.", topic: "Aap ka topic", topicHint: "e.g. Gravity, Fractions, Photosynthesis, Chemical Bonding", grade: "Class / Grade", generate: "Meri game banao", loading: "Mission tayar ho raha hai…", ageNote: "Core focus Classes 9–10 / Matric par hai. Classes 5–8 bhi supported hain; preschool ya First Year/Inter mode nahi.", story: "Mission briefing", objective: "Aap kya seekhenge", goal: "Aap ka mission", tray: "In cards ko move karein", zones: "Mission zones", dropHint: "Card yahan drag karein, ya pehle card aur phir zone tap karein.", hint: "Hint lein", check: "Mission check karein", reset: "Reset", checkAgain: "Dobara try karein", missionSuccess: "Mission complete! Aap ke choices ke peeche science neeche hai.", missionPartial: "Achhi koshish! Feedback dekhein, cards badlein, dobara check karein ya quiz par chalein.", continueQuiz: "Final quiz par jayein", quizTitle: "Mission debrief", quizNext: "Answer check karein", nextQuestion: "Agla sawal", finishQuiz: "Mission finish karein", results: "Mission complete", reward: "Reward unlock hua", playAgain: "Dobara khelein", exit: "Exit", correct: "Sahi", incorrect: "Abhi sahi nahi", score: "Aap ka score", zonesLabel: "Drop zones", noAnswer: "Pehle answer select karein.", errorPrefix: "Game generate nahi hui", regenerate: "Dobara try karein", world: "World", chooseClass: "Class select karein", safeNote: "AI sirf game ke rules aur content banata hai. App inhein safe, prebuilt interaction engine mein chalati hai.", missionDone: "Mission score", quizScore: "Quiz score", great: "Shabash!" },
  sd: { eyebrow: "AI GAME CREATOR", title: "پنهنجي راند ٺاهيو", intro: "پنهنجو تعليمي موضوع لکو. AI ان مان عملي مشن ٺاهيندو، رڳو ڪوئز نه.", topic: "توهان جو موضوع", topicHint: "مثال: ڪشش ثقل، ڪسرون، فوٽو سنٿيسس", grade: "ڪلاس", generate: "منهنجي راند ٺاهيو", loading: "مشن تيار ٿي رهيو آهي…", ageNote: "خاص ڌيان ڪلاس 9–10 / ميٽرڪ تي آهي. ڪلاس 5–8 پڻ شامل آهن؛ پري اسڪول يا فرسٽ ايئر/انٽر نه.", story: "مشن جي ڪهاڻي", objective: "توهان ڇا سکندا", goal: "توهان جو مشن", tray: "ڪارڊ منتقل ڪريو", zones: "مشن زون", dropHint: "ڪارڊ هتي ڇڪيو يا پهرين ڪارڊ ۽ پوءِ زون کي ٽيپ ڪريو.", hint: "اشارو وٺو", check: "مشن چيڪ ڪريو", reset: "ٻيهر شروع", checkAgain: "ٻيهر ڪوشش", missionSuccess: "مشن مڪمل! توهان جي چونڊ جي پويان سائنس هيٺ ڏنل آهي.", missionPartial: "سٺي ڪوشش! وضاحت ڏسو، ڪارڊ بدلايو يا ڪوئز ڏانهن وڃو.", continueQuiz: "آخري ڪوئز ڏانهن", quizTitle: "مشن جو جائزو", quizNext: "جواب چيڪ ڪريو", nextQuestion: "اڳيون سوال", finishQuiz: "مشن ختم ڪريو", results: "مشن مڪمل", reward: "انعام حاصل", playAgain: "ٻيهر کيڏيو", exit: "ٻاهر وڃو", correct: "صحيح", incorrect: "اڃا صحيح ناهي", score: "توهان جو اسڪور", zonesLabel: "ڊراپ زون", noAnswer: "پهريان جواب چونڊيو.", errorPrefix: "راند نه ٺهي سگهي", regenerate: "ٻيهر ڪوشش", world: "دنيا", chooseClass: "ڪلاس چونڊيو", safeNote: "AI رڳو راند جا اصول ۽ مواد ٺاهي ٿو. ايپ انهن کي محفوظ، اڳ ٺهيل انٽرايڪشن انجڻ ۾ هلائي ٿي.", missionDone: "مشن اسڪور", quizScore: "ڪوئز اسڪور", great: "تمام سٺو!" },
} as const;

const worldStyle: Record<TopicGameSpec["world"], { icon: string; shell: string; glow: string }> = {
  space: { icon: "🚀", shell: "from-slate-950 via-indigo-950 to-violet-950", glow: "bg-violet-400/20" },
  physics: { icon: "⚡", shell: "from-slate-950 via-blue-950 to-cyan-950", glow: "bg-cyan-400/20" },
  chemistry: { icon: "⚗️", shell: "from-slate-950 via-teal-950 to-emerald-950", glow: "bg-emerald-400/20" },
  biology: { icon: "🧬", shell: "from-slate-950 via-emerald-950 to-lime-950", glow: "bg-lime-400/20" },
  math: { icon: "📐", shell: "from-slate-950 via-amber-950 to-orange-950", glow: "bg-amber-400/20" },
  earth: { icon: "🌍", shell: "from-slate-950 via-blue-950 to-emerald-950", glow: "bg-sky-400/20" },
  coding: { icon: "🤖", shell: "from-slate-950 via-sky-950 to-fuchsia-950", glow: "bg-sky-400/20" },
  general: { icon: "✨", shell: "from-slate-950 via-violet-950 to-pink-950", glow: "bg-fuchsia-400/20" },
};

function shuffled(items: TopicGameItem[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function TopicGameCreator({ onComplete, onExit }: Props) {
  const [lang] = useLang();
  const t = ui[lang as Language] ?? ui.en;
  const createGame = useServerFn(generateTopicGame);
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("9");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [game, setGame] = useState<TopicGameSpec | null>(null);
  const [phase, setPhase] = useState<Phase>("setup");
  const [items, setItems] = useState<TopicGameItem[]>([]);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [hintIndex, setHintIndex] = useState(-1);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState("");
  const [quizScore, setQuizScore] = useState(0);
  const [missionScore, setMissionScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [answeredQuiz, setAnsweredQuiz] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [offlineSaving, setOfflineSaving] = useState(false);

  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const currentQuestion = game?.quiz[quizIndex];
  const style = game ? worldStyle[game.world] : worldStyle.general;
  const placedCount = Object.keys(placements).length;
  const correctCount = game ? items.filter((item) => placements[item.id] === item.correctTarget).length : 0;

  const saveCurrentGameOffline = async () => {
    if (!game || offlineSaving || offlineSaved) return;
    setOfflineSaving(true);
    try {
      const safeSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "topic";
      await saveOfflinePack({
        id: `ai-${safeSlug}-${Date.now()}`,
        title: game.title,
        subject: game.world,
        icon: style.icon,
        theme: style.shell,
        description: game.mission,
        story: game.story,
        objective: game.objective,
        facts: game.items.map((item) => `${item.label}: ${item.feedback}`),
        questions: game.quiz.map((question) => ({ question: question.question, answers: question.options, correct: question.correctIndex, explanation: question.explanation })),
        contentType: "game",
        game: { mechanic: game.mechanic, items: game.items, targets: game.targets, hints: game.hints, reward: game.reward },
        savedAt: Date.now(),
      });
      setOfflineSaved(true);
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready.catch(() => null);
        registration?.active?.postMessage({ type: "CACHE_APP_SHELL", paths: ["/app/downloads", "/app/games/physics", "/app/games/chemistry"] });
      }
    } catch {
      setSavedMessage("Could not save this game offline. Check the free storage on this device.");
    } finally { setOfflineSaving(false); }
  };

  const startGame = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (topic.trim().length < 2 || loading) return;
    setLoading(true); setError(""); setGame(null); setPhase("setup");
    try {
      const result = await createGame({ data: { topic: topic.trim(), grade: Number(grade), lang: (lang as Language) } });
      if (!result.ok) { setError(result.error); return; }
      setGame(result.game);
      setOfflineSaved(false);
      setItems(shuffled(result.game.items));
      setPlacements({}); setSelectedItem(null); setChecked(false); setHintIndex(-1);
      setQuizIndex(0); setQuizChoice(null); setQuizFeedback(""); setQuizScore(0); setMissionScore(0); setSavedMessage(""); setAnsweredQuiz(false);
      setPhase("mission");
    } catch {
      setError("Could not reach the AI game generator. Check the real server .env settings, restart the server, and try again.");
    } finally { setLoading(false); }
  };

  const assign = (itemId: string, targetId: string) => {
    if (!game || phase !== "mission") return;
    setPlacements((previous) => {
      const next = { ...previous, [itemId]: targetId };
      if (game.mechanic !== "sort") {
        for (const [otherId, currentTarget] of Object.entries(next)) if (otherId !== itemId && currentTarget === targetId) delete next[otherId];
      }
      return next;
    });
    setSelectedItem(null); setChecked(false);
  };

  const onItemDrag = (event: DragEvent<HTMLButtonElement>, itemId: string) => event.dataTransfer.setData("text/topic-game-item", itemId);
  const onTargetDrop = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData("text/topic-game-item");
    if (itemId && itemMap.has(itemId)) assign(itemId, targetId);
  };

  const checkMission = () => {
    if (!game || placedCount < game.items.length) return;
    setChecked(true); setMissionScore(correctCount);
  };

  const finishQuiz = async () => {
    if (!game || saving) return;
    setPhase("results");
    if (onComplete && !saving) {
      setSaving(true);
      try { setSavedMessage(await onComplete(missionScore + quizScore, game.items.length + game.quiz.length)); }
      catch { setSavedMessage("Mission completed. Your progress could not be saved right now."); }
      finally { setSaving(false); }
    }
  };

  const submitQuizAnswer = () => {
    if (!game || !currentQuestion || quizChoice == null || answeredQuiz) return;
    const isCorrect = quizChoice === currentQuestion.correctIndex;
    if (isCorrect) setQuizScore((score) => score + 1);
    setQuizFeedback(`${isCorrect ? t.correct : t.incorrect}: ${currentQuestion.explanation}`);
    setAnsweredQuiz(true);
  };

  const nextQuiz = () => {
    if (!game) return;
    if (quizIndex < game.quiz.length - 1) {
      setQuizIndex((i) => i + 1); setQuizChoice(null); setQuizFeedback(""); setAnsweredQuiz(false);
    } else void finishQuiz();
  };

  const resetMission = () => {
    if (!game) return;
    setItems(shuffled(game.items)); setPlacements({}); setSelectedItem(null); setChecked(false); setHintIndex(-1); setMissionScore(0);
  };

  if (!game || phase === "setup") {
    return <div className="mx-auto max-w-3xl space-y-5">
      <header className="flex items-start gap-3"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-violet-500/15 text-3xl">🎮</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t.eyebrow}</p><h1 className="font-display text-2xl font-extrabold sm:text-3xl">{t.title}</h1><p className="mt-1 text-sm text-muted-foreground">{t.intro}</p></div><Button variant="ghost" className="rounded-full" onClick={onExit}><ArrowLeft className="h-4 w-4"/> {t.exit}</Button></header>
      <form onSubmit={(e) => void startGame(e)} className="glass space-y-5 rounded-[2rem] p-5 sm:p-7">
        <div className="grid h-24 place-items-center overflow-hidden rounded-3xl border border-violet-300/20 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-5xl shadow-inner"><div className="animate-pulse">{worldStyle.space.icon} ✨ 🌍 🪐</div></div>
        <div className="space-y-2"><label htmlFor="topic-game-topic" className="text-sm font-extrabold">{t.topic}</label><input id="topic-game-topic" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={100} minLength={2} required placeholder={t.topicHint} className="h-12 w-full rounded-2xl border-2 border-input bg-background/70 px-4 text-sm outline-none transition focus:border-primary" /><div className="flex flex-wrap gap-2">{["Gravity", "Photosynthesis", "Fractions", "Chemical bonding", "Newton's laws"].map((suggestion) => <button key={suggestion} type="button" onClick={() => setTopic(suggestion)} className="rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-semibold hover:border-primary/60">{suggestion}</button>)}</div></div>
        <div className="space-y-2"><label htmlFor="topic-game-grade" className="flex items-center gap-2 text-sm font-extrabold"><GraduationCap className="h-4 w-4 text-primary"/>{t.grade}</label><select id="topic-game-grade" value={grade} onChange={(e) => setGrade(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-input bg-background/70 px-4 text-sm font-semibold outline-none focus:border-primary">{[5, 6, 7, 8, 9, 10].map((value) => <option key={value} value={value}>Class {value}{value === 10 ? " · Matric" : value === 9 ? " · Secondary focus" : ""}</option>)}</select><p className="text-xs text-muted-foreground">{t.ageNote}</p></div>
        {error && <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><p className="font-bold">{t.errorPrefix}</p><p className="mt-1">{error}</p><Button type="button" variant="outline" size="sm" onClick={() => void startGame()} className="mt-3 rounded-full">{t.regenerate}</Button></div>}
        <Button type="submit" disabled={loading || topic.trim().length < 2} className="h-12 w-full rounded-full text-base font-extrabold">{loading ? <><Loader2 className="h-5 w-5 animate-spin"/>{t.loading}</> : <><Sparkles className="h-5 w-5"/>{t.generate}</>}</Button>
        <p className="text-xs text-muted-foreground">{t.safeNote}</p>
      </form>
    </div>;
  }

  if (phase === "mission" && game) {
    return <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-start gap-3"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-3xl">{style.icon}</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{t.world} · Class {grade}</p><h1 className="font-display text-2xl font-extrabold sm:text-3xl">{game.title}</h1><p className="mt-1 text-sm text-muted-foreground">{game.objective}</p></div><Button variant="ghost" className="rounded-full" onClick={onExit}><ArrowLeft className="h-4 w-4"/> {t.exit}</Button></header>
      <section className={cn("relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br p-5 text-white sm:p-7", style.shell)} style={game.world === "space" ? { backgroundImage: "linear-gradient(135deg, rgba(7,11,31,0.42), rgba(17,23,59,0.36)), url('/assets/space-orbit-background.png')", backgroundSize: "cover, cover", backgroundPosition: "center, center" } : undefined}><div aria-hidden="true" className={cn("pointer-events-none absolute -right-12 -top-16 -z-10 h-60 w-60 rounded-full blur-3xl", style.glow)}/><div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-25" style={{ backgroundImage: "radial-gradient(1px 1px at 12% 20%, white 99%, transparent 100%), radial-gradient(2px 2px at 78% 27%, white 99%, transparent 100%), radial-gradient(1px 1px at 61% 79%, white 99%, transparent 100%), radial-gradient(1.5px 1.5px at 33% 64%, white 99%, transparent 100%)", backgroundSize: "180px 130px" }}/><div className="max-w-3xl"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/65">{t.story}</p><p className="mt-2 text-base leading-relaxed sm:text-lg">{game.story}</p><p className="mt-4 text-sm font-bold text-white/90">🎯 {t.goal}: {game.mission}</p></div><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">{game.items.length} cards</span><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">{game.mechanic === "sequence" ? "Sequence mission" : game.mechanic === "sort" ? "Sorting mission" : "Matching mission"}</span><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">Class {grade}{Number(grade) === 10 ? " · Matric" : ""}</span></div></section>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="glass rounded-[2rem] p-5"><div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-display text-lg font-extrabold">{t.tray}</h2><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">{placedCount}/{game.items.length}</span></div><p className="mb-3 text-xs text-muted-foreground">{t.dropHint}</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">{items.map((item) => <button key={item.id} type="button" draggable onDragStart={(e) => onItemDrag(e, item.id)} onClick={() => setSelectedItem((old) => old === item.id ? null : item.id)} aria-pressed={selectedItem === item.id} className={cn("min-h-24 rounded-2xl border-2 p-3 text-left transition", selectedItem === item.id ? "border-primary bg-primary/10 ring-2 ring-primary/20" : placements[item.id] ? "border-emerald-500/30 bg-emerald-500/5 opacity-75" : "border-border bg-background/70 hover:-translate-y-0.5 hover:border-primary/50")}><span className="text-2xl">{item.icon}</span><span className="mt-1 block text-sm font-extrabold leading-snug">{item.label}</span>{placements[item.id] && <span className="mt-1 block text-[11px] font-semibold text-primary">↪ {game.targets.find((target) => target.id === placements[item.id])?.label}</span>}</button>)}</div></section>
        <section className="glass rounded-[2rem] p-5"><div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-display text-lg font-extrabold">{t.zones}</h2><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">{t.zonesLabel}</span></div><div className={cn("grid gap-3", game.targets.length > 3 ? "sm:grid-cols-2" : "grid-cols-1")}>{game.targets.map((target, index) => { const targetItems = items.filter((item) => placements[item.id] === target.id); const isCorrect = checked && targetItems.every((item) => item.correctTarget === target.id) && targetItems.length > 0 && (game.mechanic === "sort" || targetItems.length === 1); return <div key={target.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onTargetDrop(e, target.id)} onClick={() => { if (selectedItem) assign(selectedItem, target.id); }} role="button" tabIndex={0} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && selectedItem) { e.preventDefault(); assign(selectedItem, target.id); } }} className={cn("min-h-28 cursor-pointer rounded-2xl border-2 border-dashed p-3 outline-none transition focus-visible:ring-2 focus-visible:ring-primary", isCorrect ? "border-emerald-500/70 bg-emerald-500/10" : checked && targetItems.some((item) => item.correctTarget !== target.id) ? "border-rose-500/60 bg-rose-500/5" : selectedItem ? "border-primary/50 bg-primary/5" : "border-border bg-background/40 hover:border-primary/50")}><div className="mb-2 flex items-center gap-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-xl">{target.icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">{target.label}</span><span className="block text-xs text-muted-foreground">{target.hint || `Zone ${index + 1}`}</span></span>{targetItems.length > 0 && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold">{targetItems.length}</span>}</div><div className="flex flex-wrap gap-1.5">{targetItems.map((item) => <span key={item.id} className="rounded-lg border border-border bg-background/80 px-2 py-1 text-xs font-bold">{item.icon} {item.label}</span>)}</div></div>; })}</div>
          {checked && <div role="status" className={cn("mt-4 rounded-2xl p-3 text-sm", correctCount === game.items.length ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-800")}><p className="font-extrabold">{correctCount === game.items.length ? t.missionSuccess : `${correctCount}/${game.items.length} cards are in the right zone.`}</p><p className="mt-1">{game.items.slice(0, 4).map((item) => `${placements[item.id] === item.correctTarget ? "✓" : "↻"} ${item.label}: ${item.feedback}`).join(" ")}</p><p className="mt-1">{t.missionPartial}</p></div>}
          <div className="mt-4 flex flex-wrap gap-2"><Button onClick={checkMission} disabled={placedCount !== game.items.length} className="rounded-full"><CheckCircle2 className="h-4 w-4"/>{t.check}</Button><Button variant="outline" className="rounded-full" onClick={resetMission}><RotateCcw className="h-4 w-4"/>{t.reset}</Button><Button variant="outline" className="rounded-full" onClick={() => setHintIndex((i) => Math.min(i + 1, game.hints.length - 1))} disabled={hintIndex >= game.hints.length - 1}><Lightbulb className="h-4 w-4"/>{t.hint}</Button>{checked && <Button className="rounded-full" onClick={() => { setPhase("quiz"); setQuizIndex(0); setQuizChoice(null); setQuizFeedback(""); setAnsweredQuiz(false); }}>{t.continueQuiz}<Play className="h-4 w-4"/></Button>}</div>
          {hintIndex >= 0 && <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-sm"><Lightbulb className="mr-2 inline h-4 w-4"/>{game.hints[hintIndex]}</p>}
        </section>
      </div>
      <p className="px-2 text-xs text-muted-foreground">{t.safeNote}</p>
    </div>;
  }

  if (phase === "quiz" && game && currentQuestion) {
    return <div className="mx-auto max-w-3xl space-y-5"><header className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-3xl">{style.icon}</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{t.quizTitle} · {quizIndex + 1}/{game.quiz.length}</p><h1 className="font-display text-2xl font-extrabold">{game.title}</h1></div></header><section className="glass space-y-4 rounded-[2rem] p-5 sm:p-7"><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((quizIndex + 1) / game.quiz.length) * 100}%` }}/></div><h2 className="text-lg font-extrabold sm:text-xl">{currentQuestion.question}</h2><div className="grid gap-2">{currentQuestion.options.map((option, index) => <button key={`${index}-${option}`} disabled={answeredQuiz} onClick={() => setQuizChoice(index)} className={cn("rounded-2xl border-2 p-4 text-left text-sm font-bold transition", quizChoice === index ? "border-primary bg-primary/10" : "border-border bg-background/60 hover:border-primary/40", answeredQuiz && index === currentQuestion.correctIndex && "border-emerald-500/70 bg-emerald-500/10", answeredQuiz && quizChoice === index && index !== currentQuestion.correctIndex && "border-rose-500/70 bg-rose-500/10")}>{String.fromCharCode(65 + index)}. {option}</button>)}</div>{quizFeedback && <p role="status" className="rounded-2xl bg-secondary p-3 text-sm">{quizFeedback}</p>}<div className="flex flex-wrap gap-2">{!answeredQuiz ? <Button className="rounded-full" disabled={quizChoice == null} onClick={submitQuizAnswer}>{t.quizNext}</Button> : <Button className="rounded-full" onClick={nextQuiz}>{quizIndex === game.quiz.length - 1 ? t.finishQuiz : t.nextQuestion}</Button>}</div></section></div>;
  }

  return <div className="mx-auto max-w-3xl space-y-5"><section className={cn("relative overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 text-white sm:p-9", style.shell)}><div aria-hidden="true" className={cn("absolute -right-10 -top-10 h-52 w-52 rounded-full blur-3xl", style.glow)}/><div className="relative"><div className="mb-3 grid h-16 w-16 place-items-center rounded-2xl border border-white/15 bg-white/10 text-4xl">🏆</div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/60">{t.results}</p><h1 className="mt-1 font-display text-3xl font-extrabold">{game.title}</h1><p className="mt-3 text-white/85">{game.reward}</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-xs text-white/70">{t.missionDone}</p><p className="mt-1 text-2xl font-extrabold">{missionScore}/{game.items.length}</p></div><div className="rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-xs text-white/70">{t.quizScore}</p><p className="mt-1 text-2xl font-extrabold">{quizScore}/{game.quiz.length}</p></div></div><p className="mt-4 text-lg font-bold">{t.great} ⭐</p></div></section><section className="glass rounded-[2rem] p-5"><h2 className="font-display text-lg font-extrabold">{t.objective}</h2><p className="mt-2 text-sm text-muted-foreground">{game.objective}</p>{savedMessage && <p role="status" className="mt-3 rounded-2xl bg-secondary p-3 text-sm">{savedMessage}</p>}<div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" className="rounded-full" disabled={offlineSaving || offlineSaved} onClick={() => void saveCurrentGameOffline()}>{offlineSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : offlineSaved ? <CheckCircle2 className="h-4 w-4"/> : <Download className="h-4 w-4"/>}{offlineSaving ? "Saving offline…" : offlineSaved ? "Saved for offline" : "Save for offline"}</Button><Button className="rounded-full" disabled={saving} onClick={() => { setGame(null); setPhase("setup"); setTopic(""); setError(""); }}>{saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <RotateCcw className="h-4 w-4"/>}{t.playAgain}</Button><Button variant="outline" className="rounded-full" onClick={onExit}><ArrowLeft className="h-4 w-4"/>{t.exit}</Button></div></section></div>;
}
