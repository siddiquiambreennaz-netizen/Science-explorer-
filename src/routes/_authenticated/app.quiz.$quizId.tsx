import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, Trophy, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, btnCls, cardCls, studentNav, teacherNav } from "@/components/AppShell";
import { Mascot, type MascotState } from "@/components/Mascot";
import { useMe } from "@/lib/use-me";
import { saveQuizResult } from "@/lib/learn.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/quiz/$quizId")({
  head: () => ({
    meta: [
      { title: "Quiz — SCIENCE EXPLORER" },
      { name: "description", content: "Answer science questions, get instant feedback and earn points." },
      { property: "og:title", content: "Quiz — SCIENCE EXPLORER" },
      { property: "og:description", content: "Answer science questions and earn points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuizPage,
});

type Question = { id: string; idx: number; question: string; options: string[]; correct_index: number; explanation: string };

function QuizPage() {
  const { quizId } = Route.useParams();
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;

  const quiz = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      const [{ data: qz, error: e1 }, { data: qs, error: e2 }] = await Promise.all([
        supabase.from("quizzes").select("id,title,subject,description").eq("id", quizId).maybeSingle(),
        supabase.from("quiz_questions").select("id,idx,question,options,correct_index,explanation").eq("quiz_id", quizId).order("idx"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      if (!qz) throw new Error("not_found");
      return { quiz: qz, questions: (qs ?? []) as Question[] };
    },
  });

  return (
    <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
      <Link to="/app/explore" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Explore
      </Link>
      {quiz.isLoading && (
        <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      )}
      {quiz.error && (
        <p className={cn(cardCls, "text-center text-destructive")}>This quiz could not be found. It may have been removed.</p>
      )}
      {quiz.data && quiz.data.questions.length === 0 && (
        <p className={cn(cardCls, "text-center text-muted-foreground")}>This quiz has no questions yet.</p>
      )}
      {quiz.data && quiz.data.questions.length > 0 && (
        <QuizPlayer quizId={quizId} title={quiz.data.quiz.title} subject={quiz.data.quiz.subject} questions={quiz.data.questions} role={role} userId={user.id} />
      )}
    </AppShell>
  );
}

function QuizPlayer({ quizId, title, subject, questions, role, userId }: {
  quizId: string; title: string; subject: string; questions: Question[]; role: "student" | "teacher" | null; userId: string;
}) {
  const qc = useQueryClient();
  const save = useServerFn(saveQuizResult);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mascot, setMascot] = useState<MascotState>("idle");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [round, setRound] = useState(0); // retry key

  const q = questions[idx]!;
  const answered = picked !== null;
  const isLast = idx === questions.length - 1;

  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    const correct = i === q.correct_index;
    if (correct) setScore((s) => s + 1);
    setMascot(correct ? "happy" : "sad");
    setTimeout(() => setMascot((m) => (m === "happy" || m === "sad" ? "idle" : m)), 1500);
  };

  const next = async () => {
    if (!isLast) { setIdx((i) => i + 1); setPicked(null); return; }
    setFinished(true);
    const finalScore = score;
    setMascot(finalScore / questions.length >= 0.6 ? "celebrating" : "sad");
    if (role !== "student") return; // teachers preview without saving
    setSaveState("saving");
    try {
      const r = await save({ data: { quizId, score: finalScore, total: questions.length } });
      setSaveState(r.ok ? "saved" : "error");
      if (r.ok) qc.invalidateQueries({ queryKey: ["quiz-results", userId] });
    } catch {
      setSaveState("error");
    }
  };

  const retry = () => {
    setIdx(0); setPicked(null); setScore(0); setFinished(false); setSaveState("idle"); setMascot("idle"); setRound((r) => r + 1);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <section className={cn(cardCls, "mx-auto flex max-w-xl flex-col items-center gap-4 text-center")}>
        <Mascot state={mascot} className="w-36" />
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          {pct >= 80 ? "Outstanding!" : pct >= 60 ? "Well done!" : "Good try — keep practising!"}
        </h1>
        <p className="text-muted-foreground">
          You scored <strong className="text-foreground">{score} out of {questions.length}</strong> ({pct}%) in {title}.
        </p>
        <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 font-bold text-secondary-foreground">
          <Trophy className="h-4 w-4" /> +{score * 10} points earned
        </div>
        {role === "student" && saveState === "saving" && <p className="text-sm text-muted-foreground"><Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Saving your result…</p>}
        {role === "student" && saveState === "saved" && <p className="text-sm font-semibold text-success">Your result was saved to your progress.</p>}
        {role === "student" && saveState === "error" && <p className="text-sm font-semibold text-destructive">Your result could not be saved. Check your connection and retry the quiz.</p>}
        {role === "teacher" && <p className="text-sm text-muted-foreground">Preview mode — teacher results are not saved.</p>}
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={retry} className={cn(btnCls, "bg-secondary text-secondary-foreground")}><RotateCcw className="h-4 w-4" /> Retry quiz</button>
          <Link to="/app/explore" className={cn(btnCls, "bg-gradient-primary text-primary-foreground")}>Next topic <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    );
  }

  return (
    <section key={round} className={cn(cardCls, "mx-auto max-w-2xl space-y-5")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{subject}</p>
          <h1 className="font-display text-2xl font-extrabold text-foreground">{title}</h1>
        </div>
        <Mascot state={mascot} className="w-16 shrink-0 sm:w-20" />
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={idx + 1} aria-valuemax={questions.length}>
        <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${((idx + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>
      <p className="text-sm font-bold text-muted-foreground">Question {idx + 1} of {questions.length}</p>

      <h2 className="text-lg font-bold text-foreground">{q.question}</h2>
      <div className="grid gap-2">
        {q.options.map((opt, i) => {
          const isCorrect = answered && i === q.correct_index;
          const isWrongPick = answered && i === picked && i !== q.correct_index;
          return (
            <button
              key={i} onClick={() => choose(i)} disabled={answered}
              className={cn(
                "flex items-center justify-between gap-3 rounded-2xl border-2 bg-background/70 px-4 py-3 text-start font-semibold transition",
                !answered && "border-input hover:border-primary/60",
                isCorrect && "border-success bg-success/10 text-success",
                isWrongPick && "border-destructive bg-destructive/10 text-destructive",
                answered && !isCorrect && !isWrongPick && "border-input opacity-60",
              )}
            >
              <span>{opt}</span>
              {isCorrect && <Check className="h-5 w-5 shrink-0" />}
              {isWrongPick && <X className="h-5 w-5 shrink-0" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={cn("rounded-2xl px-4 py-3 text-sm", picked === q.correct_index ? "bg-success/10 text-foreground" : "bg-warning/15 text-foreground")}>
          <p className="mb-1 font-bold">{picked === q.correct_index ? "Correct!" : "Not quite — that's okay, mistakes help us learn."}</p>
          <p>{q.explanation}</p>
        </div>
      )}

      <button onClick={next} disabled={!answered} className={cn(btnCls, "w-full bg-gradient-primary text-primary-foreground")}>
        {isLast ? "See my results" : "Next question"} <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}
