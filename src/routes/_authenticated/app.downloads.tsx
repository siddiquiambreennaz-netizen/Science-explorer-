import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, Download, Play, RotateCcw, Trash2, Trophy, WifiOff } from "lucide-react";
import { AppShell, cardCls, studentNav, teacherNav } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/use-me";
import { listOfflinePacks, removeOfflinePack, subscribeOfflinePacks, type OfflinePack } from "@/lib/offline-downloads";
import { cn } from "@/lib/utils";
import { OfflineActivity } from "@/components/games/OfflineActivity";

export const Route = createFileRoute("/_authenticated/app/downloads")({
  head: () => ({ meta: [{ title: "My Downloads — SCIENCE EXPLORER" }, { name: "description", content: "Your saved offline learning packs and missions." }] }),
  component: DownloadsPage,
});

function DownloadsPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const role = useMe(user.id).data?.role ?? null;
  const [packs, setPacks] = useState<OfflinePack[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [missionChecked, setMissionChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const refresh = () => { void listOfflinePacks().then(setPacks); };
  useEffect(() => {
    refresh();
    return subscribeOfflinePacks(refresh);
  }, []);

  const activePack = useMemo(() => packs.find((pack) => pack.id === activeId) ?? null, [packs, activeId]);
  const question = activePack?.questions[questionIndex];
  const correctPlacements = activePack?.game?.items.filter((item) => placements[item.id] === item.correctTarget).length ?? 0;

  const startPack = (id: string) => {
    setActiveId(id); setQuestionIndex(0); setChoice(null); setScore(0); setChecked(false); setFinished(false); setPlacements({}); setSelectedItem(null); setMissionChecked(false); setShowHint(false);
  };

  const checkAnswer = () => {
    if (choice === null || !question || checked) return;
    if (choice === question.correct) setScore((current) => current + 1);
    setChecked(true);
  };

  const nextQuestion = () => {
    if (!activePack) return;
    if (questionIndex >= activePack.questions.length - 1) {
      void saveOfflinePack({ ...activePack, lastScore: score, lastTotal: activePack.questions.length, lastPlayedAt: Date.now() });
      setFinished(true);
      return;
    }
    setQuestionIndex((current) => current + 1); setChoice(null); setChecked(false);
  };

  const goBack = () => { setActiveId(null); setFinished(false); };

  return (
    <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="relative isolate overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10"><Download className="h-7 w-7" /></div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-200">LEARN ANYWHERE</p>
              <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">My Downloads</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">Saved learning packs are stored on this device. Open them here when you are offline and practise without a live AI connection.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">{packs.length} saved packs</span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2"><WifiOff className="mr-1 inline h-3.5 w-3.5" /> Downloaded games & lessons</span>
              </div>
            </div>
          </div>
        </header>

        {activePack ? (
          <section className={cn(cardCls, "space-y-5")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" className="rounded-full" onClick={goBack}><ArrowLeft className="h-4 w-4" /> My Downloads</Button>
              <span className="rounded-full bg-success/10 px-3 py-1.5 text-xs font-bold text-success">Saved on this device</span>
            </div>
            {!finished ? (
              <>
                <div className={cn("relative isolate overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white sm:p-7", activePack.theme)}>
                  <div className="absolute -right-4 -top-10 text-8xl opacity-20" aria-hidden="true">{activePack.icon}</div>
                  <p className="relative text-xs font-extrabold uppercase tracking-[0.18em] text-white/65">{activePack.subject} · OFFLINE MISSION</p>
                  <h2 className="relative mt-2 font-display text-2xl font-extrabold">{activePack.title}</h2>
                  <p className="relative mt-2 max-w-2xl text-sm text-white/80">{activePack.story}</p>
                </div>
                {activePack.activity && !missionChecked && <OfflineActivity activity={activePack.activity} onComplete={() => setMissionChecked(true)} />}
                {activePack.game && !missionChecked && <div className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-5 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-200">OFFLINE INTERACTIVE MISSION</p><h3 className="mt-1 font-display text-xl font-extrabold">{activePack.game.mechanic === "sequence" ? "Put the steps in order" : activePack.game.mechanic === "sort" ? "Sort the mission cards" : "Match each card to its zone"}</h3></div><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{correctPlacements}/{activePack.game.items.length} correct</span></div>
                  <p className="mt-2 text-sm text-white/70">Tap a card, then tap the zone where it belongs. You can change an answer before checking.</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
                    <div><p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-white/60">Mission cards</p><div className="flex flex-wrap gap-2">{activePack.game.items.map((item) => <button key={item.id} type="button" onClick={() => setSelectedItem(item.id)} className={cn("rounded-2xl border px-3 py-2 text-left text-sm font-bold transition", selectedItem === item.id ? "border-cyan-200 bg-cyan-200/20" : "border-white/15 bg-white/10 hover:bg-white/15")}>{item.icon} {item.label}{placements[item.id] && <span className="ml-1 text-cyan-100">✓</span>}</button>)}</div></div>
                    <div><p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-white/60">Mission zones</p><div className="grid gap-2">{activePack.game.targets.map((target) => <button key={target.id} type="button" disabled={!selectedItem} onClick={() => { if (selectedItem) { setPlacements((current) => ({ ...current, [selectedItem]: target.id })); setSelectedItem(null); } }} className={cn("min-h-12 rounded-2xl border p-3 text-left text-sm font-bold transition", selectedItem ? "border-cyan-200/40 bg-white/10 hover:bg-cyan-300/15" : "border-white/10 bg-white/5 text-white/55")}>{target.icon} {target.label}</button>)}</div></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" className="rounded-full" onClick={() => setShowHint((current) => !current)}>Need a hint?</Button><Button className="rounded-full bg-cyan-200 text-slate-950 hover:bg-cyan-100" disabled={Object.keys(placements).length !== activePack.game.items.length} onClick={() => { if (correctPlacements === activePack.game?.items.length) setMissionChecked(true); else setShowHint(true); }}>Check mission</Button></div>
                  {showHint && <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm text-white/85">{activePack.game.hints[0] ?? "Think about the topic and match each card to its best target."}</p>}
                  {Object.keys(placements).length === activePack.game.items.length && correctPlacements !== activePack.game.items.length && <p className="mt-2 text-sm text-amber-200">Some cards need another look. Check the hints and try again.</p>}
                </div>}
                {(activePack.game || activePack.activity) && missionChecked && <p className="rounded-2xl border border-success/20 bg-success/10 p-4 text-sm font-semibold text-success">Mission complete! {activePack.game?.reward ?? "Your offline subject mission is complete."}</p>}
                {activePack.lessonSections && <section className="space-y-3 rounded-3xl border border-border bg-background/60 p-5"><div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary"/><h3 className="font-display text-xl font-extrabold">{activePack.contentType === "note" ? "Saved personal lesson" : "Saved lesson content"}</h3></div>{activePack.lessonSections.map((section, index) => <details key={`${section.title}-${index}`} open={index === 0} className="rounded-2xl bg-secondary/60 p-4"><summary className="cursor-pointer font-bold">{section.title}</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{section.body}</p></details>)}</section>}
                {(!activePack.game && !activePack.activity || missionChecked) && <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
                  <div className="rounded-3xl border border-border bg-background/60 p-5">
                    <h3 className="font-display text-lg font-extrabold">Mission briefing</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{activePack.objective}</p>
                    <h4 className="mt-5 text-sm font-extrabold">Quick discoveries</h4>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">{activePack.facts.map((fact) => <li key={fact} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{fact}</li>)}</ul>
                  </div>
                  {activePack.questions.length > 0 && <div className="rounded-3xl border border-border bg-background/60 p-5">
                    <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide text-primary">Knowledge challenge</p><p className="text-xs font-bold text-muted-foreground">{questionIndex + 1}/{activePack.questions.length}</p></div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((questionIndex + 1) / activePack.questions.length) * 100}%` }} /></div>
                    <h3 className="mt-5 text-lg font-extrabold">{question?.question}</h3>
                    <div className="mt-4 grid gap-2">{question?.answers.map((answer, index) => <button key={answer} type="button" disabled={checked} onClick={() => setChoice(index)} className={cn("min-h-12 rounded-2xl border-2 p-3 text-left text-sm font-bold transition", choice === index ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40", checked && index === question.correct && "border-emerald-500 bg-emerald-500/10 text-emerald-700", checked && choice === index && index !== question.correct && "border-rose-500 bg-rose-500/10 text-rose-700")}>{String.fromCharCode(65 + index)}. {answer}</button>)}</div>
                    {checked && question && <p role="status" className="mt-4 rounded-2xl bg-secondary p-3 text-sm"><strong>{choice === question.correct ? "Correct!" : "Good try!"}</strong> {question.explanation}</p>}
                    <div className="mt-5 flex flex-wrap gap-2">{!checked ? <Button className="rounded-full" disabled={choice === null} onClick={checkAnswer}>Check answer</Button> : <Button className="rounded-full" onClick={nextQuestion}>{questionIndex === activePack.questions.length - 1 ? "Finish mission" : "Next question"}</Button>}<Button variant="outline" className="rounded-full" onClick={goBack}>Exit pack</Button></div>
                  </div>}
                </div>}
              </>
            ) : (
              <div className="mx-auto max-w-xl py-10 text-center">
                <Trophy className="mx-auto h-14 w-14 text-amber-500" />
                <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-primary">MISSION COMPLETE</p>
                <h2 className="mt-2 font-display text-3xl font-extrabold">Well done, Explorer!</h2>
                <p className="mt-3 text-muted-foreground">Your score: <strong>{score} / {activePack.questions.length}</strong></p>
                <div className="mt-6 flex justify-center gap-2"><Button className="rounded-full" onClick={() => startPack(activePack.id)}><RotateCcw className="h-4 w-4" /> Play again</Button><Button variant="outline" className="rounded-full" onClick={goBack}>My Downloads</Button></div>
              </div>
            )}
          </section>
        ) : packs.length === 0 ? (
          <section className={cn(cardCls, "py-12 text-center")}>
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 font-display text-2xl font-extrabold">No downloads yet</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Open Science Games and use “Save for offline” on a subject world. Your saved packs will appear here and can be practised without an internet connection.</p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2">
            {packs.map((pack) => <article key={pack.id} className={cn(cardCls, "relative overflow-hidden")}>
              <div className={cn("absolute -right-7 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl", pack.theme)} />
              <div className="relative flex items-start gap-3"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-secondary text-3xl">{pack.icon}</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-primary">{pack.subject}</p><h2 className="mt-1 font-display text-xl font-extrabold">{pack.title}</h2><p className="mt-2 text-sm text-muted-foreground">{pack.description}</p></div></div>
              <p className="relative mt-4 text-xs text-muted-foreground">{pack.contentType === "lesson" ? "Saved lesson" : pack.contentType === "note" ? "Personal lesson / note" : "Interactive game pack"} · {pack.facts.length} learning points · {pack.questions.length} review questions</p>
              {typeof pack.lastScore === "number" && <p className="relative mt-2 text-xs font-bold text-success">Last score: {pack.lastScore}/{pack.lastTotal ?? pack.questions.length}</p>}
              <div className="relative mt-5 flex flex-wrap gap-2"><Button className="rounded-full" onClick={() => startPack(pack.id)}><Play className="h-4 w-4" /> Play offline</Button><Button variant="outline" size="icon" className="rounded-full" aria-label={`Delete ${pack.title}`} title="Delete download" onClick={() => void removeOfflinePack(pack.id).then(refresh)}><Trash2 className="h-4 w-4" /></Button></div>
            </article>)}
          </section>
        )}
      </div>
    </AppShell>
  );
}
