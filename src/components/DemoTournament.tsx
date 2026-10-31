import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Check, Play, RotateCcw, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot, useMascot } from "@/components/Mascot";
import { OPPONENTS, QUESTION_SECONDS, ROUNDS, opponentRound, points, tournamentQuestions } from "@/lib/demo-tournament";
import { cn } from "@/lib/utils";

type Phase = "lobby" | "countdown" | "question" | "feedback" | "results";

export function DemoTournament({ playerName }: { playerName: string }) {
  const [phase, setPhase] = useState<Phase>("lobby");
  const [seed, setSeed] = useState(1);
  const [round, setRound] = useState(0);
  const [count, setCount] = useState(3);
  const [left, setLeft] = useState(QUESTION_SECONDS);
  const [mine, setMine] = useState<{ correct: boolean; pts: number; picked: number | null }[]>([]);
  const [mascot, react] = useMascot("idle");
  const startedAt = useRef(0);
  const questions = useMemo(() => tournamentQuestions(seed), [seed]);
  const q = questions[round];

  const start = () => { setSeed(Date.now() % 100000); setRound(0); setMine([]); setCount(3); setPhase("countdown"); react("excited", 1200); };

  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) { setPhase("question"); return; }
    const t = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count]);

  const answer = (picked: number | null) => {
    if (phase !== "question" || !q) return;
    const used = Math.min(QUESTION_SECONDS, (Date.now() - startedAt.current) / 1000);
    const correct = picked === q.correct;
    setMine((m) => [...m, { correct, pts: points(correct, used), picked }]);
    react(correct ? "happy" : "sad");
    setPhase("feedback");
  };

  useEffect(() => {
    if (phase !== "question") return;
    startedAt.current = Date.now(); setLeft(QUESTION_SECONDS);
    const t = setInterval(() => {
      const l = QUESTION_SECONDS - Math.floor((Date.now() - startedAt.current) / 1000);
      setLeft(Math.max(0, l));
      if (l <= 0) { clearInterval(t); answer(null); }
    }, 250);
    return () => clearInterval(t);
  }, [phase, round]); // eslint-disable-line react-hooks/exhaustive-deps

  const roundsPlayed = mine.length;
  const board = useMemo(() => {
    const rows = OPPONENTS.map((o) => {
      let total = 0, right = 0;
      for (let r = 0; r < roundsPlayed; r++) { const res = opponentRound(o, seed, r); total += points(res.correct, res.seconds); if (res.correct) right++; }
      return { id: o.id, name: o.name, avatar: o.avatar, total, right, ai: true };
    });
    rows.push({ id: "me", name: `${playerName} (you)`, avatar: "⭐", total: mine.reduce((a, b) => a + b.pts, 0), right: mine.filter((m) => m.correct).length, ai: false });
    return rows.sort((a, b) => b.total - a.total);
  }, [mine, roundsPlayed, seed, playerName]);
  const myRank = board.findIndex((r) => r.id === "me") + 1;

  const next = () => {
    if (round + 1 >= ROUNDS) { setPhase("results"); react(myRank <= 3 ? "celebrating" : "happy", 2500); }
    else { setRound(round + 1); setPhase("question"); }
  };
  const exit = () => { if ((phase === "question" || phase === "feedback") && !window.confirm("Leave the demo tournament?")) return; setPhase("lobby"); };

  return (
    <section className="glass space-y-4 rounded-[2rem] p-6" aria-label="Demo tournament">
      <div className="flex items-center gap-3">
        <Mascot state={mascot} className="w-20" />
        <div className="flex-1">
          <span className="rounded-full bg-warning/20 px-3 py-1 text-xs font-extrabold">PRACTICE / DEMO TOURNAMENT</span>
          <h2 className="mt-1 font-display text-2xl font-extrabold">You vs 23 AI practice opponents</h2>
          <p className="text-xs text-muted-foreground">Opponents are simulated AI players, not real students. Results aren’t saved to records or official leaderboards.</p>
        </div>
        {phase !== "lobby" && <Button variant="ghost" className="rounded-full" onClick={exit}><X />Exit demo</Button>}
      </div>

      {phase === "lobby" && <>
        <div className="flex flex-wrap gap-2">{OPPONENTS.map((o) => <span key={o.id} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold"><span>{o.avatar}</span>{o.name}<Bot className="h-3 w-3" /></span>)}</div>
        <p className="text-sm">{ROUNDS} mixed-subject questions · {QUESTION_SECONDS}s each · 100 points per correct answer + up to 50 speed bonus. Same rules for every player.</p>
        <Button className="rounded-full" onClick={start}><Play />Start demo tournament</Button>
      </>}

      {phase === "countdown" && <p className="xp-pop py-10 text-center font-display text-7xl font-extrabold text-primary" key={count}>{count || "Go!"}</p>}

      {(phase === "question" || phase === "feedback") && q && <div className="space-y-3">
        <div className="flex justify-between text-sm font-bold"><span>Round {round + 1} / {ROUNDS}</span><span>{phase === "question" ? `⏱ ${left}s` : "Time stopped"}</span></div>
        <div className="h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${phase === "question" ? (left / QUESTION_SECONDS) * 100 : 0}%` }} /></div>
        <h3 className="font-display text-2xl font-bold">{q.prompt}</h3>
        <div className="grid gap-2">{q.options.map((o, i) => { const mineNow = mine[round]; return (
          <Button key={o} variant="outline" disabled={phase !== "question"} onClick={() => answer(i)} className={cn("h-auto min-h-12 justify-start whitespace-normal rounded-2xl text-left font-bold", phase === "feedback" && i === q.correct && "border-success bg-success/10", phase === "feedback" && mineNow?.picked === i && !mineNow.correct && "border-destructive bg-destructive/10")}>{o}</Button>); })}</div>
        {phase === "feedback" && mine[round] && <div role="status" className="space-y-2 rounded-2xl bg-secondary/70 p-4">
          <p className="flex items-center gap-2 font-bold">{mine[round].correct ? <><Check className="text-success" />Correct · +{mine[round].pts} points</> : <><X className="text-destructive" />{mine[round].picked === null ? "Time’s up" : "Incorrect"} · +0</>}</p>
          <p className="text-sm">{q.explanation}</p>
          <p className="text-sm font-bold">You’re currently #{myRank} of 24.</p>
          <Button className="rounded-full" onClick={next}>{round + 1 >= ROUNDS ? "See final leaderboard" : "Next round"}</Button>
        </div>}
      </div>}

      {phase === "results" && <div className="space-y-3">
        <h3 className="flex items-center gap-2 font-display text-2xl font-extrabold"><Trophy className="text-warning" />You finished #{myRank} of 24</h3>
        <ol className="max-h-[28rem] space-y-1 overflow-y-auto">{board.map((r, i) => (
          <li key={r.id} className={cn("flex items-center gap-3 rounded-2xl px-3 py-2 text-sm", r.ai ? "bg-background/60" : "bg-primary/15 font-extrabold")}>
            <span className="w-6 text-end font-bold">{i + 1}</span><span>{r.avatar}</span><span className="flex-1">{r.name}{r.ai && <span className="ms-2 rounded-full bg-secondary px-2 text-xs">AI demo</span>}</span><span>{r.right}/{ROUNDS}</span><span className="w-14 text-end font-bold">{r.total}</span>
          </li>))}</ol>
        <Button className="rounded-full" onClick={start}><RotateCcw />Play again</Button>
      </div>}
    </section>
  );
}
