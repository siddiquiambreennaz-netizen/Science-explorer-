import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, Download, Lightbulb, Loader2, RotateCcw } from "lucide-react";
import { AppShell, cardCls, studentNav, teacherNav } from "@/components/AppShell";
import { Mascot, useMascot } from "@/components/Mascot";
import { AskAboutTopic } from "@/components/AskAboutTopic";
import { ReadAloud, SpokenText } from "@/components/ReadAloud";
import { Button } from "@/components/ui/button";
import { generateLesson, markTopicComplete, type LessonQ } from "@/lib/learn.functions";
import { useLang } from "@/lib/lang-store";
import { useMe } from "@/lib/use-me";
import { cn } from "@/lib/utils";
import { saveOfflinePack } from "@/lib/offline-downloads";

const search = z.object({
  subject: z.string().catch("Physics"),
  topic: z.string().catch("Forces and motion"),
  grade: z.number().int().min(5).max(10).catch(9),
  level: z.enum(["beginner", "intermediate", "advanced"]).catch("beginner"),
});

export const Route = createFileRoute("/_authenticated/app/lesson")({
  validateSearch: search,
  head: () => ({ meta: [
    { title: "Interactive Lesson — SCIENCE EXPLORER" },
    { name: "description", content: "Step-by-step lessons with examples, knowledge checks, a practice quiz and an in-lesson tutor." },
    { property: "og:title", content: "Interactive Lesson — SCIENCE EXPLORER" },
    { property: "og:description", content: "Step-by-step interactive lessons for every school subject." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: LessonPage,
});

const lessonSlug = (subject: string, topic: string) =>
  `lesson-${`${subject}-${topic}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`.slice(0, 80);

function Question({ q, onAnswer }: { q: LessonQ; onAnswer: (ok: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const ok = picked === q.correct;
  return (
    <div className="space-y-2 rounded-2xl bg-background/60 p-4">
      <p className="font-bold">{q.question}</p>
      <div className="grid gap-2">{q.options.map((o, i) => (
        <Button key={i} variant="outline" disabled={picked !== null} onClick={() => { setPicked(i); onAnswer(i === q.correct); }}
          className={cn("h-auto min-h-11 justify-start whitespace-normal rounded-2xl text-left", picked !== null && i === q.correct && "border-success bg-success/10", picked === i && !ok && "border-destructive bg-destructive/10")}>{o}</Button>
      ))}</div>
      {picked !== null && <p role="status" className="text-sm"><b>{ok ? "Correct! " : "Not quite. "}</b>{q.explanation}</p>}
    </div>
  );
}

function LessonPage() {
  const s = Route.useSearch();
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const [lang] = useLang();
  const gen = useServerFn(generateLesson);
  const mark = useServerFn(markTopicComplete);
  const qc = useQueryClient();
  const [mascot, react] = useMascot("welcome");
  const [step, setStep] = useState(0);
  const [quizScore, setQuizScore] = useState<boolean[]>([]);
  const [saved, setSaved] = useState("");
  const [offlineSaving, setOfflineSaving] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState("");
  const saving = useRef(false);

  const lesson = useQuery({
    queryKey: ["lesson", s.subject, s.topic, s.grade, s.level, lang],
    staleTime: Infinity, retry: false,
    queryFn: async () => { const r = await gen({ data: { ...s, lang } }); if (!r.ok) throw new Error(r.error); return r.lesson; },
  });
  const L = lesson.data;
  const sections = L?.sections ?? [];
  const context = L ? `Lesson: ${s.topic}. Current section: ${sections[step]?.title ?? "Quiz"}. ${sections[step]?.body ?? ""}` : s.topic;
  const quizDone = !!L && quizScore.length === L.quiz.length && L.quiz.length > 0;

  const saveLessonForOffline = async () => {
    if (!L || offlineSaving || offlineSaved) return;
    setOfflineSaving(true);
    setOfflineMessage("");
    try {
      const id = lessonSlug(s.subject, s.topic);
      const facts = [
        L.intro,
        ...L.sections.map((section) => `${section.title}: ${section.body}`),
        ...L.terms.map((term) => `${term.term}: ${term.meaning}`),
        ...L.examples,
        ...L.worked.map((worked) => `${worked.problem} ${worked.steps.join(" ")} Answer: ${worked.answer}`),
        ...L.recap,
      ].filter(Boolean);
      await saveOfflinePack({
        id,
        title: s.topic,
        subject: s.subject,
        icon: "📘",
        theme: "from-slate-950 via-indigo-950 to-cyan-950",
        description: `Grade ${s.grade} · ${s.level} · saved lesson`,
        story: L.intro,
        objective: `Study ${s.topic} in ${s.subject}, review the key terms and complete the practice quiz.`,
        facts,
        lessonSections: [{ title: "Introduction", body: L.intro }, ...L.sections, { title: "Key terms", body: L.terms.map((term) => `${term.term}: ${term.meaning}`).join("\n\n") }, { title: "Examples", body: L.examples.join("\n\n") }, { title: "Recap", body: L.recap.join("\n") }],
        contentType: "lesson",
        questions: L.quiz.map((question) => ({ question: question.question, answers: question.options, correct: question.correct, explanation: question.explanation })),
        savedAt: Date.now(),
      });
      setOfflineSaved(true);
      setOfflineMessage("Lesson saved on this device. Find it in My Downloads to study offline.");
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready.catch(() => null);
        registration?.active?.postMessage({ type: "CACHE_APP_SHELL", paths: ["/app/downloads"] });
      }
    } catch {
      setOfflineMessage("Could not save this lesson. Check the available storage on this device.");
    } finally {
      setOfflineSaving(false);
    }
  };

  const finish = async () => {
    if (saving.current || role !== "student") return;
    saving.current = true;
    try {
      const r = await mark({ data: { topicSlug: lessonSlug(s.subject, s.topic) } });
      if (r.ok) { setSaved("Lesson saved to My Learning (25 XP the first time you complete it)."); react("celebrating", 2200); qc.invalidateQueries({ queryKey: ["topic-progress", user.id] }); }
      else { setSaved(r.error); react("error"); }
    } catch { setSaved("Couldn’t save your progress — check your connection and try again."); react("error"); }
    finally { saving.current = false; }
  };

  return (
    <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
      <div className="space-y-6">
        <Link to="/app/explore" className="inline-flex items-center gap-2 text-sm font-bold text-primary"><ArrowLeft className="h-4 w-4" />Back to Explore</Link>
        <section className={cn(cardCls, "flex flex-col items-center gap-4 sm:flex-row")}>
          <Mascot state={lesson.isFetching ? "thinking" : lesson.isError ? "error" : mascot} className="w-24 sm:w-28" />
          <div className="min-w-0 flex-1 text-center sm:text-start">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{s.subject} · Grade {s.grade} · {s.level}</p>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{s.topic}</h1>
            {L && <div className="mt-2"><SpokenText text={L.intro} className="text-muted-foreground" /></div>}
            {offlineMessage && <p role="status" className="mt-3 text-sm font-semibold text-success">{offlineMessage}</p>}
          </div>
          {L && <Button variant="secondary" className="shrink-0 rounded-full" disabled={offlineSaving || offlineSaved} onClick={() => void saveLessonForOffline()}>
            {offlineSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : offlineSaved ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {offlineSaving ? "Saving…" : offlineSaved ? "Saved offline" : "Save for offline"}
          </Button>}
        </section>

        {lesson.isFetching && <p className={cn(cardCls, "flex items-center gap-2")}><Loader2 className="h-5 w-5 animate-spin" />Preparing your lesson…</p>}
        {lesson.isError && !lesson.isFetching && <div role="alert" className={cn(cardCls, "space-y-3")}><p className="font-bold text-destructive">{lesson.error.message}</p><Button className="rounded-full" onClick={() => void lesson.refetch()}><RotateCcw />Try again</Button></div>}

        {L && <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <section className={cn(cardCls, "space-y-4")}>
              <div className="flex items-center justify-between"><h2 className="font-display text-xl font-extrabold"><BookOpen className="mr-2 inline h-5 w-5 text-primary" />Step {Math.min(step + 1, sections.length)} of {sections.length}</h2>
                <div className="flex gap-1">{sections.map((_, i) => <span key={i} className={cn("h-2 w-6 rounded-full", i <= step ? "bg-primary" : "bg-secondary")} />)}</div></div>
              {sections[step] && <div className="screen-in" key={step}><h3 className="mb-2 font-display text-2xl font-bold">{sections[step].title}</h3><SpokenText text={sections[step].body} /></div>}
              {step === 0 && L.checks[0] && <Question q={L.checks[0]} onAnswer={(ok) => react(ok ? "happy" : "sad")} />}
              {step === Math.floor(sections.length / 2) && step > 0 && L.checks[1] && <Question q={L.checks[1]} onAnswer={(ok) => react(ok ? "happy" : "sad")} />}
              <div className="flex justify-between">
                <Button variant="secondary" className="rounded-full" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft />Previous</Button>
                {step < sections.length - 1 ? <Button className="rounded-full" onClick={() => { setStep(step + 1); react("explaining", 1500); }}>Next step<ArrowRight /></Button> : <span className="text-sm font-bold text-success">All steps done — try the quiz below!</span>}
              </div>
            </section>

            <section className={cn(cardCls, "space-y-3")}><h2 className="font-display text-xl font-extrabold">Key terms</h2>
              {L.terms.map((t) => <details key={t.term} className="rounded-2xl bg-background/60 p-3"><summary className="flex cursor-pointer items-center justify-between font-bold">{t.term}<ChevronDown className="h-4 w-4" /></summary><p className="mt-2 text-sm">{t.meaning}</p></details>)}
            </section>

            <section className={cn(cardCls, "space-y-3")}><h2 className="font-display text-xl font-extrabold"><Lightbulb className="mr-2 inline h-5 w-5 text-warning" />Everyday examples</h2>
              <ul className="list-disc space-y-1 ps-5 text-sm">{L.examples.map((e) => <li key={e}>{e}</li>)}</ul></section>

            {L.worked.length > 0 && <section className={cn(cardCls, "space-y-3")}><h2 className="font-display text-xl font-extrabold">Worked examples</h2>
              {L.worked.map((w, i) => <WorkedExample key={i} w={w} />)}</section>}

            <section className={cn(cardCls, "space-y-3")}><h2 className="font-display text-xl font-extrabold">Recap</h2>
              <ReadAloud text={L.recap.join(". ")} />
              <ul className="space-y-1 text-sm">{L.recap.map((r) => <li key={r} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{r}</li>)}</ul></section>

            <section className={cn(cardCls, "space-y-3")}><h2 className="font-display text-xl font-extrabold">Practice quiz · {quizScore.filter(Boolean).length}/{L.quiz.length}</h2>
              {L.quiz.map((q, i) => <Question key={i} q={q} onAnswer={(ok) => { setQuizScore((p) => [...p, ok]); react(ok ? "happy" : "sad"); }} />)}
              {quizDone && <div role="status" className="space-y-2 rounded-2xl bg-success/10 p-4"><p className="font-bold">You scored {quizScore.filter(Boolean).length} / {L.quiz.length}.</p>
                {role === "student" && !saved && <Button className="rounded-full" onClick={() => void finish()}><Check />Complete lesson</Button>}{saved && <p className="text-sm font-bold">{saved}</p>}</div>}
            </section>

            <section className={cn(cardCls, "space-y-2")}><h2 className="font-display text-xl font-extrabold">Next steps</h2>
              <div className="flex flex-wrap gap-2">{L.next.map((n) => <Button key={n} asChild variant="secondary" className="rounded-full"><Link to="/app/lesson" search={{ ...s, topic: n }} onClick={() => { setStep(0); setQuizScore([]); setSaved(""); }}>{n}</Link></Button>)}</div></section>
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start"><AskAboutTopic topic={`${s.subject}: ${s.topic}`} context={context} onMascot={react} /></div>
        </div>}
      </div>
    </AppShell>
  );
}

function WorkedExample({ w }: { w: { problem: string; steps: string[]; answer: string } }) {
  const [shown, setShown] = useState(0);
  return (
    <div className="space-y-2 rounded-2xl bg-background/60 p-4">
      <p className="font-bold">{w.problem}</p>
      <ol className="list-decimal space-y-1 ps-5 text-sm">{w.steps.slice(0, shown).map((st, i) => <li key={i} className="screen-in">{st}</li>)}</ol>
      {shown < w.steps.length ? <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setShown(shown + 1)}>Show next step</Button> : <p className="text-sm font-bold text-success">Answer: {w.answer}</p>}
    </div>
  );
}
