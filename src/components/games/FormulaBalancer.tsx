import { useEffect, useMemo, useState } from "react";
import { Check, Lightbulb, Minus, Plus, Timer, Trophy } from "lucide-react";
import { Mascot, type MascotState } from "@/components/Mascot";
import { btnCls, cardCls } from "@/components/AppShell";
import { cn } from "@/lib/utils";

/** Count atoms in a simple formula like "H2O" or "NaCl" (no parentheses). */
export function countAtoms(formula: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) {
    out[m[1]!] = (out[m[1]!] ?? 0) + (m[2] ? parseInt(m[2], 10) : 1);
  }
  return out;
}

type Equation = { left: string[]; right: string[]; answer: number[]; label: string };
const EQUATIONS: Equation[] = [
  { left: ["H2", "O2"], right: ["H2O"], answer: [2, 1, 2], label: "H₂ + O₂ → H₂O" },
  { left: ["N2", "H2"], right: ["NH3"], answer: [1, 3, 2], label: "N₂ + H₂ → NH₃" },
  { left: ["Mg", "O2"], right: ["MgO"], answer: [2, 1, 2], label: "Mg + O₂ → MgO" },
  { left: ["Na", "Cl2"], right: ["NaCl"], answer: [2, 1, 2], label: "Na + Cl₂ → NaCl" },
  { left: ["CH4", "O2"], right: ["CO2", "H2O"], answer: [1, 2, 1, 2], label: "CH₄ + O₂ → CO₂ + H₂O" },
];

const SUBS: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈" };
const pretty = (f: string) => f.replace(/\d/g, (d) => SUBS[d] ?? d);

function balanced(eq: Equation, coefs: number[]): boolean {
  const tally = (formulas: string[], cs: number[]) => {
    const tot: Record<string, number> = {};
    formulas.forEach((f, i) => {
      const atoms = countAtoms(f);
      for (const [el, n] of Object.entries(atoms)) tot[el] = (tot[el] ?? 0) + n * (cs[i] ?? 1);
    });
    return tot;
  };
  const l = tally(eq.left, coefs.slice(0, eq.left.length));
  const r = tally(eq.right, coefs.slice(eq.left.length));
  const els = new Set([...Object.keys(l), ...Object.keys(r)]);
  for (const el of els) if ((l[el] ?? 0) !== (r[el] ?? 0)) return false;
  return true;
}

const SPEED_SECONDS = 60;

export function FormulaBalancer() {
  const [idx, setIdx] = useState(0);
  const [coefs, setCoefs] = useState<number[]>([1, 1, 1]);
  const [mascot, setMascot] = useState<MascotState>("idle");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SPEED_SECONDS);
  const eq = EQUATIONS[idx]!;

  const flash = (m: MascotState) => { setMascot(m); setTimeout(() => setMascot("idle"), 1600); };
  const load = (i: number) => {
    const e = EQUATIONS[i]!;
    setIdx(i);
    setCoefs(Array(e.left.length + e.right.length).fill(1));
    setMsg(null);
  };

  useEffect(() => {
    if (!speed) return;
    if (timeLeft <= 0) { setSpeed(false); setMsg({ ok: true, text: `Time! Speed-run score: ${score} points.` }); flash("celebrating"); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, timeLeft]);

  const bump = (i: number, d: number) =>
    setCoefs((p) => p.map((c, j) => (j === i ? Math.min(8, Math.max(1, c + d)) : c)));

  const check = () => {
    if (balanced(eq, coefs)) {
      setScore((s) => s + 10);
      setMsg({ ok: true, text: `Balanced! ${eq.label} — both sides have the same atoms. +10 points` });
      flash("happy");
      if (speed) setTimeout(() => load((idx + 1) % EQUATIONS.length), 900);
    } else {
      setMsg({ ok: false, text: "Not balanced yet — count each kind of atom on both sides and try again." });
      flash("sad");
    }
  };

  const hint = () => {
    const i = coefs.findIndex((c, j) => c !== eq.answer[j]);
    if (i >= 0) {
      setCoefs((p) => p.map((c, j) => (j === i ? (eq.answer[j] ?? c) : c)));
      setScore((s) => Math.max(0, s - 2));
      setMsg({ ok: false, text: "Hint used (−2 points): one coefficient was set for you." });
    }
  };

  const startSpeed = () => { setScore(0); setTimeLeft(SPEED_SECONDS); setSpeed(true); load(0); };

  const slots = useMemo(() => [...eq.left, ...eq.right], [eq]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <div className={cn(cardCls, "h-fit space-y-3")}>
        <div className="flex justify-center"><Mascot state={mascot} className="w-28" /></div>
        <h3 className="font-display text-lg font-extrabold text-foreground">Balance the equation</h3>
        <p className="text-sm text-muted-foreground">
          Atoms can't appear or disappear — adjust the numbers in front of each formula so both sides match.
        </p>
        <div className="flex flex-wrap gap-2">
          {EQUATIONS.map((e, i) => (
            <button key={e.label} onClick={() => { setSpeed(false); load(i); }}
              className={cn("rounded-full px-3 py-1.5 text-sm font-bold transition", i === idx && !speed ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
              {e.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 pt-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">
            <Trophy className="h-4 w-4" /> {score} pts
          </span>
          {speed ? (
            <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold", timeLeft <= 10 ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground")}>
              <Timer className="h-4 w-4" /> {timeLeft}s
            </span>
          ) : (
            <button onClick={startSpeed} className={cn(btnCls, "min-h-9 bg-accent px-4 text-sm text-accent-foreground")}>
              <Timer className="h-4 w-4" /> Speed run (60s)
            </button>
          )}
        </div>
      </div>

      <div className={cn(cardCls, "space-y-4")}>
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-3xl border-2 border-input bg-background/60 p-4" dir="ltr">
          {slots.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              {i === eq.left.length && <span className="font-display text-2xl font-extrabold text-primary">→</span>}
              {i > 0 && i !== eq.left.length && <span className="font-display text-xl font-bold text-muted-foreground">+</span>}
              <div className="flex items-center gap-1.5 rounded-2xl bg-secondary p-2">
                <div className="flex flex-col items-center">
                  <button onClick={() => bump(i, 1)} aria-label="Increase coefficient" className="rounded-full p-0.5 text-primary hover:bg-background"><Plus className="h-4 w-4" /></button>
                  <span className="font-display text-xl font-extrabold text-secondary-foreground">{coefs[i]}</span>
                  <button onClick={() => bump(i, -1)} aria-label="Decrease coefficient" className="rounded-full p-0.5 text-primary hover:bg-background"><Minus className="h-4 w-4" /></button>
                </div>
                <span className="font-display text-2xl font-extrabold text-foreground">{pretty(f)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={check} className={cn(btnCls, "bg-gradient-primary text-primary-foreground")}>
            <Check className="h-4 w-4" /> Check balance
          </button>
          <button onClick={hint} className={cn(btnCls, "bg-secondary text-secondary-foreground")}>
            <Lightbulb className="h-4 w-4" /> Hint (−2)
          </button>
        </div>

        {msg && (
          <p role="status" className={cn("rounded-2xl px-4 py-3 text-sm font-semibold", msg.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
            {msg.text}
          </p>
        )}
        {msg?.ok && !speed && (
          <button onClick={() => load((idx + 1) % EQUATIONS.length)} className={cn(btnCls, "bg-student text-primary-foreground")}>
            Next equation
          </button>
        )}
      </div>
    </div>
  );
}
