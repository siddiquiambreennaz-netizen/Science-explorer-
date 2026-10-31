import { useEffect, useRef, useState } from "react";
import { ArrowRight, Lightbulb, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/Mascot";
import { PHYSICS_MISSIONS, physicsAnswerCorrect } from "@/lib/physics-playlab";
import { cn } from "@/lib/utils";

export function PhysicsPlaylab({ completed = [], onComplete }: { completed?: string[]; onComplete?: (id: string) => Promise<string> }) {
  const [index, setIndex] = useState(0);
  const [setting, setSetting] = useState(40);
  const [closed, setClosed] = useState(false);
  const [run, setRun] = useState(0);
  const [observed, setObserved] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  const [reaction, setReaction] = useState<"idle" | "celebrating" | "sad">("idle");
  const [reduced, setReduced] = useState(false);
  useEffect(() => { const media = window.matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setReduced(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  useEffect(() => { if (reaction === "idle") return; const timer = setTimeout(() => setReaction("idle"), 1600); return () => clearTimeout(timer); }, [reaction]);
  const lock = useRef(false);
  const mission = PHYSICS_MISSIONS[index];
  if (!mission) return null;
  const correct = selected !== null && physicsAnswerCorrect(index, selected);
  const save = async () => {
    if (lock.current || !onComplete) return;
    setSaveFailed(false);
    lock.current = true; setSaving(true);
    try { setSaved(await onComplete(mission.id)); }
    catch { setSaveFailed(true); setSaved("Progress couldn’t be saved. Retry saving before leaving."); }
    finally { lock.current = false; setSaving(false); }
  };
  const choose = async (answer: number) => {
    if (lock.current || correct) return;
    setSelected(answer); setSaved("");
    const ok = physicsAnswerCorrect(index, answer);
    setReaction(ok ? "celebrating" : "sad");
    if (ok) await save();
  };
  const next = (i: number) => { setIndex(i); setSelected(null); setObserved(false); setHint(false); setSaved(""); setSaveFailed(false); setReaction("idle"); setRun(0); };
  return <div data-tutor-context={`${mission.title}: ${mission.question} ${selected !== null ? `Learner selected ${mission.options[selected]}.` : ""}`} className="space-y-5">
    <div className="flex items-center gap-4"><Mascot state={saving ? "thinking" : reaction} className="w-24" /><div><p className="text-sm font-bold text-primary">Mission {index + 1} / {PHYSICS_MISSIONS.length}</p><h1 className="font-display text-3xl font-extrabold">Physics Playlab</h1><p className="text-muted-foreground">Predict. Play. Discover.</p></div></div>
    <div className="flex flex-wrap gap-2">{PHYSICS_MISSIONS.map((m, i) => <Button key={m.id} variant={i === index ? "default" : "secondary"} className="rounded-full" disabled={saving} onClick={() => next(i)}>{i + 1}{completed.includes(m.id) ? " ✓" : ""} · {m.title}</Button>)}</div>
    <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
      <section className="space-y-4"><div className="flex items-center justify-between"><h2 className="font-display text-2xl font-bold">{mission.title}</h2><span className="text-xs font-semibold text-muted-foreground">Illustrative model · not to scale</span></div>
        <div key={`${mission.id}-${run}`} className={cn("physics-stage relative h-72 overflow-hidden rounded-3xl border-2 border-border bg-secondary/50 sm:h-80", observed && "physics-running")}>
          {mission.id === "gravity" && <><div className="absolute inset-x-8 top-6 flex justify-around text-sm font-bold"><span>Light ball</span><span>Heavy ball</span></div><div className="physics-drop absolute left-[25%] top-16 h-8 w-8 rounded-full bg-teacher shadow-soft" /><div className="physics-drop absolute left-[70%] top-16 h-12 w-12 rounded-full bg-student shadow-soft" /><div className="absolute inset-x-6 bottom-10 border-t-4 border-primary/40" /></>}
          {mission.id === "ramp" && <svg viewBox="0 0 400 260" className="h-full w-full" aria-label="Ball sliding down an adjustable ramp"><path d={`M40 ${180-setting} L350 215 L40 215 Z`} className="fill-student-soft stroke-primary" strokeWidth="4" /><circle r="15" className="fill-teacher"><animateMotion dur={reduced ? "0.001s" : `${3-setting/40}s`} calcMode="spline" keySplines="0.5 0 1 1" keyTimes="0;1" fill="freeze" path={observed ? `M55 ${165-setting} L335 195` : `M55 ${165-setting} L55 ${165-setting}`} /></circle></svg>}
          {mission.id === "friction" && <><div className="absolute inset-x-6 bottom-16 border-t-8 border-primary/30" /><div className="absolute bottom-[4.5rem] left-8 grid h-12 w-12 place-items-center rounded-xl bg-teacher text-primary-foreground transition-transform duration-[2000ms]" style={{ transform: observed ? `translateX(${220 - setting * 1.6}px)` : "none" }}>→</div><p className="absolute bottom-5 left-6 text-sm font-bold">{setting > 50 ? "Rougher trail" : "Smoother trail"}</p></>}
          {mission.id === "circuit" && <svg viewBox="0 0 400 260" className="h-full w-full" aria-label={closed ? "Closed circuit with lit bulb" : "Open circuit with unlit bulb"}><path d="M90 130 V50 H180 M220 50 H310 V210 H90 V155" className="fill-none stroke-primary" strokeWidth="5" /><path d={closed ? "M180 50 H220" : "M180 50 L220 25"} className="stroke-primary" strokeWidth="5" /><path d="M70 130 H110 M80 155 H100" className="stroke-teacher" strokeWidth="6" /><circle cx="310" cy="130" r="27" className={closed ? "fill-warning stroke-primary" : "fill-muted stroke-primary"} strokeWidth="4" /><text x="145" y="245" className="fill-foreground" fontSize="16">{closed ? "Current can flow" : "Circuit is open"}</text></svg>}
          {mission.id === "light" && <svg viewBox="0 0 400 260" className="h-full w-full" aria-label="Incident and reflected rays symmetric about the normal"><path d="M40 210 H360" className="stroke-primary" strokeWidth="7" /><path d="M200 30 V210" className="stroke-muted-foreground" strokeDasharray="6" strokeWidth="2" /><path d={`M${200-setting*1.3} 50 L200 210 ${observed ? `L${200+setting*1.3} 50` : ""}`} className="fill-none stroke-warning" strokeWidth="5" /><text x="210" y="30" className="fill-foreground" fontSize="14">Normal</text><text x="150" y="242" className="fill-foreground" fontSize="14">Mirror</text></svg>}
          {mission.id === "energy" && <><div className="physics-drop absolute left-1/2 top-8 h-10 w-10 rounded-full bg-teacher" /><div className="absolute bottom-8 left-6 right-6 grid grid-cols-2 gap-4 text-sm font-bold"><div>Height energy<div className={cn("mt-2 h-4 rounded-full bg-student transition-all duration-[2000ms]", observed ? "w-4" : "w-full")} /></div><div>Motion energy<div className={cn("mt-2 h-4 rounded-full bg-teacher transition-all duration-[2000ms]", observed ? "w-full" : "w-4")} /></div></div></>}
        </div>
        {["ramp", "friction", "light"].includes(mission.id) && <label className="block text-sm font-bold">{mission.id === "ramp" ? "Ramp steepness" : mission.id === "friction" ? "Surface friction" : "Ray spread"}<input type="range" min="10" max="90" value={setting} onChange={(e) => { setSetting(Number(e.target.value)); setObserved(false); }} className="mt-3 w-full accent-primary" /></label>}
        {mission.id === "circuit" && <label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={closed} onChange={(e) => { setClosed(e.target.checked); setObserved(false); }} />Close the switch</label>}
        <div className="flex gap-2"><Button className="rounded-full" onClick={() => { setRun(run + 1); setObserved(true); }}><Play />Play experiment</Button><Button variant="secondary" className="rounded-full" onClick={() => { setObserved(false); setRun(0); }}><RotateCcw />Reset</Button></div>
      </section>
      <section className="space-y-4 lg:pt-12"><p className="text-sm font-bold text-primary">Your discovery</p><h3 className="font-display text-2xl font-bold">{mission.question}</h3><p className="text-sm text-muted-foreground">Try the model, then choose your prediction.</p>
        <div className="space-y-3">{mission.options.map((option, i) => <Button key={option} variant="outline" disabled={!observed || saving || correct} onClick={() => void choose(i)} className={cn("h-auto min-h-12 w-full justify-start whitespace-normal rounded-2xl px-4 py-3 text-left font-bold", selected === i && (correct ? "border-success bg-success/10 text-success" : "border-destructive bg-destructive/10"))}>{option}</Button>)}</div>
        <Button variant="ghost" onClick={() => setHint(!hint)}><Lightbulb />Need a hint?</Button>{hint && <p className="text-sm text-muted-foreground">{mission.hint}</p>}
        {selected !== null && <div role="status" className={cn("rounded-2xl p-4", correct ? "bg-success/10" : "bg-secondary")}><p className="font-bold">{correct ? "Discovery unlocked!" : "Good try — let’s explore again."}</p><p className="mt-2 text-sm leading-relaxed">{mission.explanation}</p>{saving && <p className="mt-3 text-sm">Saving your mission…</p>}{saved && <p className="mt-3 text-sm font-bold">{saved}</p>}</div>}
        {saveFailed && <Button variant="secondary" disabled={saving} onClick={() => void save()}>Retry saving</Button>}
        {correct && <Button disabled={saving} className="rounded-full" onClick={() => next((index + 1) % PHYSICS_MISSIONS.length)}>{index === PHYSICS_MISSIONS.length - 1 ? "Play again" : "Next mission"}<ArrowRight /></Button>}
      </section>
    </div>
  </div>;
}