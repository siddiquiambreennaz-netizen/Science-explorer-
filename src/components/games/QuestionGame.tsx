import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Lightbulb, LogOut, Play, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot, useMascot } from "@/components/Mascot";
import { advance, check, correctAnswer, newSession, promptOf, scoreOf, startSession, submit, type Session } from "@/lib/game-engine";
import type { GameDef } from "@/data/game-banks";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-store";

/** Shared game flow: Start → Question → Submit → Feedback → Continue → Results → Restart. */
export function QuestionGame({ game, onComplete, onExit }: { game: GameDef; onComplete?: (score: number, total: number) => Promise<string>; onExit: () => void }) {
  const [lang] = useLang();
  const ui = {
    en: { exit: "Exit", briefing: "Mission briefing", start: "Start", questions: "questions, one at a time — no repeats.", submit: "Submit", hint: "Hint", correct: "Correct!", notQuite: "Not quite — here’s how it works.", timeUp: "Time’s up!", answer: "Correct answer:", continue: "Continue", results: "See results", restart: "Restart", back: "Back to games", score: "Score", question: "Question", leave: "Leave this game? Your current session progress will be lost." },
    ur: { exit: "باہر جائیں", briefing: "مشن کی وضاحت", start: "شروع کریں", questions: "سوال، ایک وقت میں — کوئی سوال دہرایا نہیں جائے گا۔", submit: "جمع کریں", hint: "اشارہ", correct: "درست!", notQuite: "ابھی درست نہیں — طریقہ یہ ہے۔", timeUp: "وقت ختم!", answer: "درست جواب:", continue: "جاری رکھیں", results: "نتائج دیکھیں", restart: "دوبارہ شروع", back: "گیمز پر واپس", score: "اسکور", question: "سوال", leave: "کیا گیم چھوڑ دیں؟ موجودہ سیشن کی پیش رفت ضائع ہو جائے گی۔" },
    roman: { exit: "Exit", briefing: "Mission briefing", start: "Shuru karein", questions: "sawal, ek waqt mein — koi sawal repeat nahi hoga.", submit: "Submit", hint: "Hint", correct: "Bilkul sahi!", notQuite: "Abhi sahi nahi — is tarah samjhein.", timeUp: "Waqt khatam!", answer: "Sahi jawab:", continue: "Jari rakhein", results: "Results dekhein", restart: "Dobara shuru", back: "Games par wapas", score: "Score", question: "Sawal", leave: "Game chhor dein? Is session ki progress zaya ho jayegi." },
    sd: { exit: "ٻاهر وڃو", briefing: "مشن جي وضاحت", start: "شروع ڪريو", questions: "سوال، هڪ وقت ۾ — ڪو سوال ٻيهر نه ايندو.", submit: "جمع ڪريو", hint: "اشارو", correct: "صحيح!", notQuite: "اڃا صحيح ناهي — هيئن سمجهو.", timeUp: "وقت ختم!", answer: "صحيح جواب:", continue: "جاري رکو", results: "نتيجا ڏسو", restart: "ٻيهر شروع", back: "راندين ڏانهن واپس", score: "اسڪور", question: "سوال", leave: "ڇا راند ڇڏڻ چاهيو ٿا؟ هن سيشن جي اڳڀرائي ضايع ٿيندي." },
  }[lang];
  const [s, setS] = useState<Session>(newSession());
  const [given, setGiven] = useState("");
  const [hint, setHint] = useState(false);
  const [left, setLeft] = useState(game.timed ?? 0);
  const [saveMsg, setSaveMsg] = useState("");
  const [mascot, react] = useMascot("welcome");
  const saved = useRef(false);
  const q = s.phase === "question" || s.phase === "feedback" ? game.questions[s.order[s.i]!] ?? null : null;
  const last = s.answers[s.answers.length - 1];

  const doSubmit = (value: string) => {
    if (!q) return;
    setS((cur) => {
      if (cur.phase !== "question") return cur;
      const ok = value !== "" && check(q, value);
      react(ok ? "happy" : "sad", 1800);
      return submit(cur, value, ok);
    });
  };

  useEffect(() => {
    if (!game.timed || s.phase !== "question") return;
    setLeft(game.timed);
    const t = setInterval(() => setLeft((l) => { if (l <= 1) { clearInterval(t); doSubmit(""); return 0; } return l - 1; }), 1000);
    return () => clearInterval(t);
  }, [s.phase, s.i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (s.phase !== "results" || saved.current) return;
    saved.current = true;
    const score = scoreOf(s);
    react(score >= Math.ceil(s.order.length * 0.6) ? "celebrating" : "sad", 2500);
    if (onComplete) onComplete(score, s.order.length).then(setSaveMsg).catch(() => setSaveMsg("Your result couldn’t be saved. Check your connection."));
  }, [s.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => { saved.current = false; setSaveMsg(""); setGiven(""); setHint(false); setS(startSession(game.questions.length, game.count, Date.now())); react("excited", 1200); };
  const next = () => { setGiven(""); setHint(false); setS((cur) => advance(cur)); };
  const exit = () => { if (s.phase === "question" || s.phase === "feedback") { if (!window.confirm(ui.leave)) return; } onExit(); };

  return (
    <div className="space-y-5" data-tutor-context={q ? `${game.title}: ${promptOf(q)}${last && s.phase === "feedback" ? ` Student answered "${last.given}" (${last.correct ? "correct" : "incorrect"}).` : ""}` : game.title}>
      <div className="flex items-center gap-4">
        <Mascot state={mascot} className="w-20 sm:w-24" />
        <div className="flex-1"><p className="text-xs font-bold uppercase text-primary">{game.subject} · {game.difficulty}</p><h1 className="font-display text-3xl font-extrabold">{game.title}</h1></div>
        <Button variant="ghost" className="rounded-full" onClick={exit}><LogOut />{ui.exit}</Button>
      </div>
      {game.safety && <p className="rounded-2xl bg-warning/15 p-3 text-sm font-bold">{game.safety}</p>}

      {s.phase === "start" && <section className="glass screen-in space-y-4 rounded-[2rem] p-6">
        <h2 className="font-display text-2xl font-bold">{ui.briefing}</h2>
        <p className="text-muted-foreground">{game.description}</p>
        <ul className="list-disc space-y-1 ps-5 text-sm"><li>{game.count} {ui.questions}</li><li>Submit your answer, read the explanation, then press Continue.</li>{game.timed && <li>You have {game.timed} seconds per question.</li>}</ul>
        <Button className="rounded-full" onClick={start}><Play />{ui.start}</Button>
      </section>}

      {q && <section className="glass space-y-4 rounded-[2rem] p-6" key={s.i}>
        <div className="flex items-center justify-between text-sm font-bold"><span>{ui.question} {s.i + 1} / {s.order.length}</span><span>{ui.score} {scoreOf(s)}{game.timed && s.phase === "question" ? ` · ⏱ ${left}s` : ""}</span></div>
        <div className="h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(s.i / s.order.length) * 100}%` }} /></div>
        <h2 className="whitespace-pre-wrap font-display text-2xl font-bold">{promptOf(q)}</h2>
        {q.kind === "mcq" ? (
          <div className="grid gap-2">{q.options.map((o, i) => (
            <Button key={o} variant="outline" disabled={s.phase !== "question"} onClick={() => setGiven(String(i))}
              className={cn("h-auto min-h-12 justify-start whitespace-normal rounded-2xl text-left font-bold", given === String(i) && "border-primary bg-primary/10", s.phase === "feedback" && i === q.correct && "border-success bg-success/10", s.phase === "feedback" && given === String(i) && !last?.correct && "border-destructive bg-destructive/10")}>{o}</Button>
          ))}</div>
        ) : (
          <input aria-label="Your answer" value={given} disabled={s.phase !== "question"} onChange={(e) => setGiven(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && given.trim()) doSubmit(given); }}
            placeholder={q.kind === "balance" ? `Coefficients, e.g. ${Array(q.reactants.length + q.products.length).fill(1).join(",")}` : q.kind === "input" ? q.placeholder ?? "Type your answer" : "Number of atoms"}
            className="h-12 w-full rounded-2xl border-2 border-input bg-background/70 px-4 font-bold outline-none focus:border-primary" />
        )}
        {s.phase === "question" && <div className="flex flex-wrap gap-2">
          <Button className="rounded-full" disabled={!given.trim()} onClick={() => doSubmit(given)}><Check />{ui.submit}</Button>
          {q.hint && <Button variant="ghost" onClick={() => setHint(!hint)}><Lightbulb />{ui.hint}</Button>}
        </div>}
        {hint && s.phase === "question" && <p className="text-sm text-muted-foreground">{q.hint}</p>}
        {s.phase === "feedback" && last && <div role="status" className={cn("screen-in space-y-2 rounded-2xl p-4", last.correct ? "bg-success/10" : "bg-secondary")}>
          <p className="flex items-center gap-2 font-bold">{last.correct ? <><Check className="text-success" />{ui.correct}</> : <><X className="text-destructive" />{last.given ? ui.notQuite : ui.timeUp}</>}</p>
          {!last.correct && q.kind !== "balance" && <p className="text-sm">{ui.answer} <b>{correctAnswer(q)}</b></p>}
          <p className="text-sm leading-relaxed">{q.explanation}</p>
          <Button className="rounded-full" onClick={next}>{s.i + 1 >= s.order.length ? ui.results : ui.continue}<ArrowRight /></Button>
        </div>}
      </section>}

      {s.phase === "results" && <section className="glass screen-in space-y-4 rounded-[2rem] p-6">
        <h2 className="font-display text-3xl font-extrabold">You scored {scoreOf(s)} / {s.order.length}</h2>
        {saveMsg && <p className="xp-pop rounded-2xl bg-accent px-4 py-2 font-bold">{saveMsg}</p>}
        <ol className="space-y-2">{s.answers.map((a, i) => { const qq = game.questions[a.q]; if (!qq) return null; return (
          <li key={i} className="rounded-2xl bg-background/60 p-3 text-sm"><p className="font-bold">{a.correct ? "✅" : "❌"} {promptOf(qq)}</p><p className="mt-1 text-muted-foreground">{qq.explanation}</p></li>); })}</ol>
        <div className="flex gap-2"><Button className="rounded-full" onClick={start}><RotateCcw />{ui.restart}</Button><Button variant="secondary" className="rounded-full" onClick={onExit}>{ui.back}</Button></div>
      </section>}
    </div>
  );
}
