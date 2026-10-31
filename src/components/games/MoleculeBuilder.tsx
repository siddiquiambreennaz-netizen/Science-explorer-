import { useState } from "react";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { Mascot, type MascotState } from "@/components/Mascot";
import { btnCls, cardCls } from "@/components/AppShell";
import { cn } from "@/lib/utils";

type AtomId = "H" | "C" | "O" | "N" | "Na" | "Cl";
const ATOMS: { id: AtomId; name: string; cls: string }[] = [
  { id: "H", name: "Hydrogen", cls: "bg-student-soft text-student" },
  { id: "C", name: "Carbon", cls: "bg-muted text-foreground" },
  { id: "O", name: "Oxygen", cls: "bg-destructive/10 text-destructive" },
  { id: "N", name: "Nitrogen", cls: "bg-teacher-soft text-teacher" },
  { id: "Na", name: "Sodium", cls: "bg-warning/15 text-foreground" },
  { id: "Cl", name: "Chlorine", cls: "bg-success/10 text-success" },
];

const CHALLENGES: { formula: string; name: string; need: Partial<Record<AtomId, number>>; fact: string }[] = [
  { formula: "H₂O", name: "Water", need: { H: 2, O: 1 }, fact: "Two hydrogen atoms share electrons with one oxygen atom." },
  { formula: "CO₂", name: "Carbon dioxide", need: { C: 1, O: 2 }, fact: "One carbon atom bonds with two oxygen atoms — you breathe it out!" },
  { formula: "O₂", name: "Oxygen gas", need: { O: 2 }, fact: "Oxygen travels in pairs — that's why we write O₂." },
  { formula: "NaCl", name: "Table salt", need: { Na: 1, Cl: 1 }, fact: "Sodium gives an electron to chlorine, and they stick together." },
  { formula: "CH₄", name: "Methane", need: { C: 1, H: 4 }, fact: "One carbon holds four hydrogens — the main gas in natural gas." },
  { formula: "NH₃", name: "Ammonia", need: { N: 1, H: 3 }, fact: "One nitrogen with three hydrogens — found in cleaning products." },
];

const MAX_ATOMS = 8;

export function MoleculeBuilder() {
  const [idx, setIdx] = useState(0);
  const [atoms, setAtoms] = useState<AtomId[]>([]);
  const [mascot, setMascot] = useState<MascotState>("idle");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const ch = CHALLENGES[idx]!;

  const counts = atoms.reduce<Partial<Record<AtomId, number>>>((m, a) => ({ ...m, [a]: (m[a] ?? 0) + 1 }), {});
  const flash = (s: MascotState) => { setMascot(s); setTimeout(() => setMascot("idle"), 1800); };

  const add = (a: AtomId) => {
    if (atoms.length >= MAX_ATOMS) return;
    setAtoms((p) => [...p, a]);
    setMsg(null);
  };
  const reset = (nextIdx?: number) => {
    if (nextIdx !== undefined) setIdx(nextIdx);
    setAtoms([]); setMsg(null); setMascot("idle");
  };

  const check = () => {
    const need = ch.need;
    const ids = new Set([...Object.keys(need), ...Object.keys(counts)]) as Set<AtomId>;
    for (const id of ids) {
      const want = need[id] ?? 0;
      const got = counts[id] ?? 0;
      if (got < want) {
        const atom = ATOMS.find((a) => a.id === id)!;
        setMsg({ ok: false, text: `Almost! You need ${want - got} more ${atom.name} (${id}).` });
        flash("sad");
        return;
      }
      if (got > want) {
        const atom = ATOMS.find((a) => a.id === id)!;
        setMsg({ ok: false, text: `Too many ${atom.name} (${id}) — remove ${got - want}.` });
        flash("sad");
        return;
      }
    }
    setMsg({ ok: true, text: `You built ${ch.name} (${ch.formula})! ${ch.fact}` });
    flash("celebrating");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <div className={cn(cardCls, "h-fit space-y-3")}>
        <div className="flex justify-center"><Mascot state={mascot} className="w-28" /></div>
        <h3 className="font-display text-lg font-extrabold text-foreground">Your mission</h3>
        <div className="flex flex-wrap gap-2">
          {CHALLENGES.map((c, i) => (
            <button key={c.formula} onClick={() => reset(i)}
              className={cn("rounded-full px-3.5 py-1.5 text-sm font-bold transition", i === idx ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
              {c.formula}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Build <strong className="text-foreground">{ch.name}</strong> — <span className="font-mono font-bold text-foreground">{ch.formula}</span>.
          Tap atoms to add them, then check your molecule.
        </p>
      </div>

      <div className={cn(cardCls, "space-y-4")}>
        <div className="flex flex-wrap gap-2">
          {ATOMS.map((a) => (
            <button key={a.id} onClick={() => add(a.id)} disabled={atoms.length >= MAX_ATOMS}
              className={cn("flex flex-col items-center rounded-2xl px-4 py-2 transition hover:-translate-y-0.5 disabled:opacity-50", a.cls)}>
              <span className="font-display text-xl font-extrabold">{a.id}</span>
              <span className="text-[10px] font-bold">{a.name}</span>
            </button>
          ))}
        </div>

        <div className="flex min-h-24 flex-wrap items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-input bg-background/60 p-4">
          {atoms.length === 0 && <p className="text-sm text-muted-foreground">Your molecule appears here…</p>}
          {atoms.map((a, i) => {
            const meta = ATOMS.find((x) => x.id === a)!;
            return (
              <span key={i} className={cn("grid h-12 w-12 place-items-center rounded-full font-display text-lg font-extrabold shadow-soft", meta.cls)}>
                {a}
              </span>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={check} disabled={atoms.length === 0} className={cn(btnCls, "bg-gradient-primary text-primary-foreground")}>
            <Check className="h-4 w-4" /> Check molecule
          </button>
          <button onClick={() => setAtoms((p) => p.slice(0, -1))} disabled={atoms.length === 0} className={cn(btnCls, "bg-secondary text-secondary-foreground")}>
            <Trash2 className="h-4 w-4" /> Remove last
          </button>
          <button onClick={() => reset()} className={cn(btnCls, "bg-secondary text-secondary-foreground")}>
            <RotateCcw className="h-4 w-4" /> Clear
          </button>
        </div>

        {msg && (
          <p role="status" className={cn("rounded-2xl px-4 py-3 text-sm font-semibold", msg.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
            {msg.text}
          </p>
        )}
        {msg?.ok && idx < CHALLENGES.length - 1 && (
          <button onClick={() => reset(idx + 1)} className={cn(btnCls, "bg-student text-primary-foreground")}>
            Next molecule: {CHALLENGES[idx + 1]?.formula}
          </button>
        )}
      </div>
    </div>
  );
}
