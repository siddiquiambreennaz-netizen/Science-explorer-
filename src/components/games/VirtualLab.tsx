import { useState } from "react";
import { Beaker, Droplets, FlaskConical, Info } from "lucide-react";
import { Mascot, type MascotState } from "@/components/Mascot";
import { btnCls, cardCls } from "@/components/AppShell";
import { cn } from "@/lib/utils";

/* ---------- Experiment 1: universal indicator ---------- */

const SUBSTANCES: { name: string; ph: number; color: string; note: string }[] = [
  { name: "Lemon juice", ph: 2, color: "oklch(0.62 0.22 25)", note: "Strongly acidic — the indicator turns red. Citric acid gives lemons their sour taste." },
  { name: "Vinegar", ph: 3, color: "oklch(0.66 0.2 45)", note: "Acidic — the indicator turns orange-red. Vinegar is dilute acetic acid." },
  { name: "Milk", ph: 6.5, color: "oklch(0.72 0.15 95)", note: "Very slightly acidic — the indicator stays yellow-green." },
  { name: "Pure water", ph: 7, color: "oklch(0.7 0.13 150)", note: "Neutral — the indicator turns green. Neither acid nor base." },
  { name: "Baking soda solution", ph: 9, color: "oklch(0.66 0.14 220)", note: "A mild base — the indicator turns blue." },
  { name: "Soap solution", ph: 10, color: "oklch(0.6 0.15 260)", note: "A base — the indicator turns deep blue. Bases feel slippery." },
  { name: "Bleach (diluted)", ph: 12, color: "oklch(0.55 0.16 300)", note: "Strongly basic — the indicator turns purple. Never mix bleach with other cleaners in real life!" },
];

function IndicatorLab({ flash }: { flash: (s: MascotState) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [tested, setTested] = useState(false);
  const s = picked === null ? null : SUBSTANCES[picked];
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={cn(cardCls, "space-y-3")}>
        <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-foreground">
          <Droplets className="h-5 w-5 text-teacher" /> Step 1 — choose a substance
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {SUBSTANCES.map((x, i) => (
            <button key={x.name} onClick={() => { setPicked(i); setTested(false); }}
              className={cn("rounded-2xl border-2 px-3 py-2.5 text-sm font-bold transition", picked === i ? "border-primary bg-secondary text-secondary-foreground" : "border-input bg-background/70 text-foreground")}>
              {x.name}
            </button>
          ))}
        </div>
        <button
          disabled={picked === null}
          onClick={() => { setTested(true); flash("happy"); }}
          className={cn(btnCls, "w-full bg-gradient-primary text-primary-foreground")}
        >
          <Beaker className="h-4 w-4" /> Step 2 — add universal indicator
        </button>
      </div>

      <div className={cn(cardCls, "flex flex-col items-center justify-center gap-4 text-center")}>
        <div
          className="grid h-36 w-36 place-items-center rounded-full border-4 border-white/70 shadow-soft transition-colors duration-700"
          style={{ background: tested && s ? s.color : "oklch(0.95 0.02 265)" }}
          aria-label={tested && s ? `Indicator color for ${s.name}` : "Empty beaker"}
        >
          <FlaskConical className="h-10 w-10 text-white/90" />
        </div>
        {!tested || !s ? (
          <p className="text-sm text-muted-foreground">Pick a substance and add the indicator to see the color change.</p>
        ) : (
          <div>
            <p className="font-display text-xl font-extrabold text-foreground">{s.name} — pH {s.ph}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Experiment 2: baking soda + vinegar ---------- */

function FizzLab({ flash }: { flash: (s: MascotState) => void }) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const run = () => {
    setRunning(true); setDone(false); flash("thinking");
    setTimeout(() => { setRunning(false); setDone(true); flash("celebrating"); }, 2600);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={cn(cardCls, "space-y-3")}>
        <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-foreground">
          <FlaskConical className="h-5 w-5 text-student" /> Fizz factory
        </h3>
        <ol className="list-decimal space-y-1.5 ps-5 text-sm text-muted-foreground">
          <li>The flask already contains vinegar (an acid).</li>
          <li>Press the button to tip in baking soda (a base).</li>
          <li>Watch what happens, then read the explanation.</li>
        </ol>
        <button onClick={run} disabled={running} className={cn(btnCls, "w-full bg-gradient-primary text-primary-foreground")}>
          {running ? "Reacting…" : "Add baking soda"}
        </button>
        {done && (
          <div className="rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
            <strong>What happened?</strong> The acid and base reacted and released <strong>carbon dioxide (CO₂)</strong> gas —
            those bubbles are the same gas that makes fizzy drinks sparkle. The equation:
            <span className="mt-1 block font-mono font-bold" dir="ltr">NaHCO₃ + CH₃COOH → CO₂ + H₂O + CH₃COONa</span>
          </div>
        )}
      </div>

      <div className={cn(cardCls, "flex flex-col items-center justify-center gap-2")}>
        <div className="relative grid h-44 w-44 place-items-end overflow-hidden rounded-b-[3rem] rounded-t-lg border-4 border-white/70 bg-teacher-soft/60 shadow-soft">
          <div className={cn("w-full transition-all duration-1000", running || done ? "h-3/5 bg-teacher/40" : "h-2/5 bg-teacher/25")}>
            {running && (
              <div className="relative h-full w-full">
                {[...Array(9)].map((_, i) => (
                  <span
                    key={i}
                    className="fizz-bubble absolute bottom-0 rounded-full bg-white/80"
                    style={{
                      left: `${8 + i * 10}%`,
                      width: `${6 + (i % 3) * 4}px`,
                      height: `${6 + (i % 3) * 4}px`,
                      animationDelay: `${(i % 5) * 0.25}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs font-bold text-muted-foreground">{running ? "Fizzing! CO₂ bubbles are forming…" : done ? "Reaction complete" : "Vinegar waiting in the flask"}</p>
      </div>
    </div>
  );
}

export function VirtualLab() {
  const [tab, setTab] = useState<"indicator" | "fizz">("indicator");
  const [mascot, setMascot] = useState<MascotState>("idle");
  const flash = (s: MascotState) => { setMascot(s); setTimeout(() => setMascot("idle"), 1800); };
  return (
    <div className="space-y-6">
      <div className={cn(cardCls, "flex flex-col items-center gap-4 sm:flex-row")}>
        <Mascot state={mascot} className="w-24 shrink-0" />
        <div className="flex-1 text-center sm:text-start">
          <h2 className="font-display text-2xl font-extrabold text-foreground">Virtual Science Lab</h2>
          <p className="mt-1 flex items-start justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            These are safe computer simulations — they model real experiments but are not a substitute for supervised lab work.
          </p>
        </div>
        <div className="flex gap-2">
          {([["indicator", "Magic Indicator"], ["fizz", "Fizz Factory"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn("rounded-full px-4 py-2 text-sm font-bold transition", tab === id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {tab === "indicator" ? <IndicatorLab flash={flash} /> : <FizzLab flash={flash} />}
    </div>
  );
}
