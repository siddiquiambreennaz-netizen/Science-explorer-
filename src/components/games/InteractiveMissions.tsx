import { useState, type DragEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, CheckCircle2, Play, RotateCcw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlanetCharacter, type PlanetId } from "@/components/games/PlanetCharacter";

type Complete = (score: number, total: number) => Promise<string>;
type MissionProps = { onComplete?: Complete; onExit: () => void };

const card = "glass rounded-[2rem] p-5 sm:p-6";
const action = "rounded-full";

/** Mobile-friendly drag-and-drop, with tap-to-select support for touch screens. */
export function BuildCellMission({ onComplete, onExit }: MissionProps) {
  const organelles = [
    { id: "nucleus", name: "Nucleus", icon: "🧠", description: "Stores DNA and directs cell activities." },
    { id: "membrane", name: "Cell membrane", icon: "🫧", description: "Controls what enters and leaves the cell." },
    { id: "chloroplast", name: "Chloroplast", icon: "🌿", description: "Uses light energy to make food in plant cells." },
    { id: "mitochondrion", name: "Mitochondrion", icon: "⚡", description: "Releases usable energy from food." },
  ];
  const [selected, setSelected] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const score = organelles.filter((o) => placements[o.id] === o.id).length;
  const drag = (event: DragEvent<HTMLButtonElement>, id: string) => event.dataTransfer.setData("text/organell-id", id);
  const drop = (event: DragEvent<HTMLDivElement>, slot: string) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/organell-id");
    if (id) { setPlacements((current) => ({ ...current, [slot]: id })); setChecked(false); setMessage(""); setSelected(null); }
  };
  const place = (slot: string) => {
    if (!selected) return;
    setPlacements((current) => ({ ...current, [slot]: selected }));
    setSelected(null); setChecked(false); setMessage("");
  };
  const checkCell = async () => {
    setChecked(true);
    const text = score === organelles.length ? "Excellent! Your cell is built correctly." : `${score}/4 correct. Move the highlighted organelles and check again.`;
    setMessage(text);
    if (score === organelles.length && onComplete && !saving) {
      setSaving(true);
      try { setMessage(await onComplete(score, organelles.length)); } catch { setMessage("Your result could not be saved. You can still replay the cell mission."); }
      setSaving(false);
    }
  };
  const reset = () => { setPlacements({}); setSelected(null); setMessage(""); setChecked(false); };

  return <div className="relative isolate space-y-5 before:pointer-events-none before:absolute before:inset-x-[-1rem] before:-top-8 before:-z-10 before:h-[28rem] before:rounded-[3rem] before:bg-gradient-to-br before:from-emerald-500/15 before:via-teal-400/10 before:to-transparent before:blur-2xl" data-tutor-context="Biology: Build the Cell — match organelles to their functions.">
    <header className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-3xl">🧬</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-primary">Biology · Interactive mission</p><h1 className="font-display text-2xl font-extrabold sm:text-3xl">Build the Cell</h1><p className="text-sm text-muted-foreground">Drag an organelle to its job — or tap an organelle and then a slot.</p></div><Button variant="ghost" className={action} onClick={onExit}><ArrowLeft className="h-4 w-4"/> Exit</Button></header>
    <section className={card}>
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-bold">Organelle tray</h2><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">{Object.keys(placements).length}/4 placed</span></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {organelles.map((o) => <button key={o.id} draggable onDragStart={(e) => drag(e, o.id)} onClick={() => setSelected(o.id)} className={cn("rounded-2xl border-2 p-3 text-left transition", selected === o.id ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border bg-background/60 hover:border-primary/50")} aria-pressed={selected === o.id}><span className="text-2xl">{o.icon}</span><span className="mt-2 block text-sm font-extrabold">{o.name}</span></button>)}
      </div>
    </section>
    <section className={card}>
      <h2 className="mb-4 font-display text-lg font-bold">Cell workbench</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {organelles.map((o) => {
          const placed = placements[o.id];
          const placedOrganelle = organelles.find((item) => item.id === placed);
          const isCorrect = placed === o.id;
          return <div key={o.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => drop(e, o.id)} onClick={() => place(o.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); place(o.id); } }} className={cn("flex min-h-24 items-center gap-3 rounded-2xl border-2 border-dashed p-4 outline-none transition focus-visible:ring-2 focus-visible:ring-primary", isCorrect ? "border-emerald-500/70 bg-emerald-500/10" : checked && placed ? "border-destructive/70 bg-destructive/5" : "border-border bg-background/40 hover:border-primary/60")}><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-2xl">{placedOrganelle?.icon ?? "＋"}</div><div className="min-w-0 flex-1"><p className="text-sm font-extrabold">{o.name}</p><p className="text-sm text-muted-foreground">{o.description}</p>{placed && checked && <p className={cn("mt-1 text-xs font-bold", isCorrect ? "text-emerald-600" : "text-destructive")}>{isCorrect ? "Correct match" : `Placed: ${placedOrganelle?.name}`}</p>}</div>{isCorrect && <Check className="h-5 w-5 text-emerald-600"/>}</div>;
        })}
      </div>
      {message && <p role="status" className="mt-4 rounded-xl bg-secondary p-3 text-sm font-semibold">{message}</p>}
      <div className="mt-4 flex flex-wrap gap-2"><Button className={action} onClick={() => void checkCell()} disabled={saving}><CheckCircle2 className="h-4 w-4"/> Check cell</Button><Button variant="outline" className={action} onClick={reset}><RotateCcw className="h-4 w-4"/> Reset</Button></div>
    </section>
  </div>;
}

const bodyOrgans = [
  { id: "brain", name: "Brain", icon: "🧠", description: "Controls thinking, memory, movement and many body functions.", slot: "head" },
  { id: "lungs", name: "Lungs", icon: "🫁", description: "Bring oxygen into the body and remove carbon dioxide.", slot: "chest-lungs" },
  { id: "heart", name: "Heart", icon: "❤️", description: "Pumps blood around the body.", slot: "chest-heart" },
  { id: "stomach", name: "Stomach", icon: "🍽️", description: "Mixes food with digestive juices as digestion begins.", slot: "abdomen" },
  { id: "kidneys", name: "Kidneys", icon: "🫘", description: "Filter the blood and help make urine.", slot: "lower-back" },
] as const;
const bodySlots = [
  { id: "head", label: "Head", hint: "Thinking and control" },
  { id: "chest-lungs", label: "Chest · breathing", hint: "Gas exchange" },
  { id: "chest-heart", label: "Chest · circulation", hint: "Blood pump" },
  { id: "abdomen", label: "Upper abdomen", hint: "Digestion" },
  { id: "lower-back", label: "Lower back", hint: "Blood filtering" },
] as const;

/** Touch-friendly organ placement with a clear function reveal after checking. */
export function BodyDetectiveMission({ onComplete, onExit }: MissionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const score = bodySlots.filter((slot) => placements[slot.id] === bodyOrgans.find((organ) => organ.slot === slot.id)?.id).length;
  const place = (slot: string, id = selected) => {
    if (!id) return;
    setPlacements((current) => {
      const next = { ...current };
      for (const [existingSlot, existingId] of Object.entries(next)) if (existingId === id) delete next[existingSlot];
      next[slot] = id;
      return next;
    });
    setSelected(null); setChecked(false); setMessage("");
  };
  const check = async () => {
    setChecked(true);
    setMessage(`${score}/5 organs are in the correct place.`);
    if (Object.keys(placements).length === 5 && score >= 3 && onComplete && !saving) {
      setSaving(true);
      try { setMessage(await onComplete(score, 5)); } catch { setMessage("Your result could not be saved. You can still finish the body map here."); }
      setSaving(false);
    }
  };
  return <div className="relative isolate space-y-5 before:pointer-events-none before:absolute before:inset-x-[-1rem] before:-top-8 before:-z-10 before:h-[28rem] before:rounded-[3rem] before:bg-gradient-to-br before:from-rose-500/15 before:via-pink-400/10 before:to-transparent before:blur-2xl" data-tutor-context="Human Body: place the brain, lungs, heart, stomach and kidneys in the correct body regions, then learn each function.">
    <header className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/15 text-3xl">🫀</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-primary">Human body · Placement mission</p><h1 className="font-display text-2xl font-extrabold sm:text-3xl">Body Detective</h1><p className="text-sm text-muted-foreground">Place each organ in the right body region. Tap an organ then a target, or drag it into place.</p></div><Button variant="ghost" className={action} onClick={onExit}><ArrowLeft className="h-4 w-4"/> Exit</Button></header>
    <section className={card}><h2 className="mb-3 font-display text-lg font-bold">Organ tray</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{bodyOrgans.map((organ) => <button key={organ.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/body-organ", organ.id)} onClick={() => setSelected(organ.id)} aria-pressed={selected === organ.id} className={cn("rounded-2xl border-2 p-3 text-left transition", selected === organ.id ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border bg-background/60 hover:border-primary/50")}><span className="text-2xl">{organ.icon}</span><span className="mt-1 block text-sm font-extrabold">{organ.name}</span></button>)}</div></section>
    <section className={card}><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-bold">Body map</h2><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">{Object.keys(placements).length}/5 placed</span></div><div className="mx-auto grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">{bodySlots.map((slot) => { const organ = bodyOrgans.find((item) => item.id === placements[slot.id]); const correct = organ?.slot === slot.id; return <div key={slot.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/body-organ"); if (id) place(slot.id, id); }} onClick={() => place(slot.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); place(slot.id); } }} className={cn("flex min-h-24 cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed p-4 transition focus-visible:ring-2 focus-visible:ring-primary", checked && correct ? "border-emerald-500/60 bg-emerald-500/10" : checked && organ ? "border-destructive/60 bg-destructive/5" : "border-border bg-background/50 hover:border-primary/50")}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-2xl">{organ?.icon ?? "＋"}</span><span className="min-w-0 flex-1"><span className="block font-extrabold">{slot.label}</span><span className="block text-xs text-muted-foreground">{slot.hint}</span>{organ && <span className="mt-1 block text-sm font-semibold">{organ.name}</span>}{checked && correct && <span className="mt-1 block text-xs font-bold text-emerald-600">{organ?.description}</span>}{checked && organ && !correct && <span className="mt-1 block text-xs font-bold text-destructive">Try a different body region.</span>}</span></div>; })}</div>
      {message && <p role="status" className="mt-4 rounded-xl bg-secondary p-3 text-sm font-semibold">{message}</p>}<div className="mt-4 flex flex-wrap gap-2"><Button className={action} onClick={() => void check()} disabled={saving}><CheckCircle2 className="h-4 w-4"/> Check body map</Button><Button variant="outline" className={action} onClick={() => { setPlacements({}); setSelected(null); setChecked(false); setMessage(""); }}><RotateCcw className="h-4 w-4"/> Reset</Button></div>
    </section>
  </div>;
}

const planetOrder = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"] as const;
const planetIdForName: Record<(typeof planetOrder)[number], PlanetId> = {
  Mercury: "mercury", Venus: "venus", Earth: "earth", Mars: "mars", Jupiter: "jupiter", Saturn: "saturn", Uranus: "uranus", Neptune: "neptune",
};
const planetCards: { name: (typeof planetOrder)[number]; id: PlanetId; clue: string }[] = [
  { name: "Mars", id: "mars", clue: "The red planet" },
  { name: "Neptune", id: "neptune", clue: "A distant ice giant" },
  { name: "Earth", id: "earth", clue: "Our home planet" },
  { name: "Jupiter", id: "jupiter", clue: "The largest planet" },
  { name: "Mercury", id: "mercury", clue: "Closest to the Sun" },
  { name: "Uranus", id: "uranus", clue: "An ice giant that rotates on its side" },
  { name: "Venus", id: "venus", clue: "The hottest planet" },
  { name: "Saturn", id: "saturn", clue: "Famous for its rings" },
];
const orbitHints = ["Closest to the Sun", "Second orbit", "Our home planet", "Fourth orbit", "Largest planet", "Ringed gas giant", "Sideways rotation", "Most distant planet"];

/** Drag or tap expressive cartoon planet characters into numbered orbital positions. */
export function SpaceMissionGame({ onComplete, onExit }: MissionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const score = planetOrder.filter((planet, index) => placements[String(index)] === planet).length;
  const place = (slot: string, planet = selected) => {
    if (!planet) return;
    setPlacements((current) => { const next = { ...current }; for (const [oldSlot, oldPlanet] of Object.entries(next)) if (oldPlanet === planet) delete next[oldSlot]; next[slot] = planet; return next; });
    setSelected(null); setChecked(false); setMessage("");
  };
  const check = async () => {
    setChecked(true);
    setMessage(`${score}/8 planets are in the correct order. Start at the Sun and move outward.`);
    if (Object.keys(placements).length === 8 && score >= 5 && onComplete && !saving) {
      setSaving(true);
      try { setMessage(await onComplete(score, 8)); } catch { setMessage("Your score could not be saved. Keep exploring the Solar System!"); }
      setSaving(false);
    }
  };
  const reset = () => { setSelected(null); setPlacements({}); setChecked(false); setMessage(""); };

  return <div className="space-y-5" data-tutor-context="Space Mission: arrange Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune in orbital order from the Sun outward. Drag-and-drop character-style planet tokens into Planet 1 to Planet 8 slots.">
    <header className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/15 text-3xl">🚀</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-primary">Space science · Solar System</p><h1 className="font-display text-2xl font-extrabold sm:text-3xl">Space Mission</h1><p className="text-sm text-muted-foreground">Drag the smiling planet characters into Planet 1–8, starting closest to the Sun. You can also tap a planet, then tap an orbit slot.</p></div><Button variant="ghost" className={action} onClick={onExit}><ArrowLeft className="h-4 w-4"/> Exit</Button></header>

    <section className="relative isolate overflow-hidden rounded-[2rem] border border-violet-300/20 bg-gradient-to-br from-[#070b1f] via-[#11173b] to-[#21174a] p-4 text-white shadow-xl sm:p-6" style={{ backgroundImage: "linear-gradient(135deg, rgba(7,11,31,0.44), rgba(17,23,59,0.32)), url('/assets/space-orbit-background.png')", backgroundSize: "cover, cover", backgroundPosition: "center, center" }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-80" style={{ backgroundImage: "radial-gradient(1px 1px at 7% 18%, white 99%, transparent 100%), radial-gradient(1.5px 1.5px at 24% 62%, #c4b5fd 99%, transparent 100%), radial-gradient(1px 1px at 51% 29%, white 99%, transparent 100%), radial-gradient(2px 2px at 77% 15%, #fcd34d 99%, transparent 100%), radial-gradient(1px 1px at 88% 75%, white 99%, transparent 100%), radial-gradient(1.5px 1.5px at 64% 83%, #c4b5fd 99%, transparent 100%)", backgroundSize: "210px 145px" }} />
      <div aria-hidden="true" className="pointer-events-none absolute -left-14 top-[40%] -z-10 h-44 w-44 rounded-full bg-amber-400/10 blur-2xl" />
      <div className="mb-4 flex items-center gap-3"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-amber-200/60 bg-gradient-to-br from-yellow-100 via-amber-400 to-orange-600 text-3xl shadow-[0_0_35px_rgba(251,191,36,0.35)]">☀️</div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200/80">Solar System Challenge</p><h2 className="font-display text-lg font-extrabold sm:text-xl">Arrange the planets in orbit order</h2><p className="text-xs text-white/60">Number 1 is closest to the Sun · Number 8 is farthest</p></div></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{planetOrder.map((planet, index) => {
        const placed = placements[String(index)] as (typeof planetOrder)[number] | undefined;
        const correct = placed === planet;
        return <div key={index} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const name = event.dataTransfer.getData("text/planet-name"); if (planetOrder.includes(name as (typeof planetOrder)[number])) place(String(index), name); }} onClick={() => place(String(index))} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); place(String(index)); } }} className={cn("relative flex min-h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-2 py-3 text-center transition focus-visible:ring-2 focus-visible:ring-white", checked && correct ? "border-emerald-300 bg-emerald-400/10" : checked && placed ? "border-rose-300 bg-rose-400/10" : selected ? "border-violet-300 bg-violet-300/10" : "border-white/20 bg-white/[0.045] hover:border-violet-200/70 hover:bg-white/[0.08]")}>
          <span className="absolute left-2 top-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white/70">PLANET {index + 1}</span>
          {placed ? <><PlanetCharacter planet={planetIdForName[placed]} size="md" className="mt-4"/><span className="mt-1 text-sm font-extrabold">{placed}</span>{checked && <span className={cn("mt-1 text-[10px] font-bold", correct ? "text-emerald-200" : "text-rose-200")}>{correct ? "Correct orbit" : "Try another orbit"}</span>}</> : <><span className="mt-4 text-3xl text-white/30">＋</span><span className="mt-1 text-xs font-semibold text-white/70">{orbitHints[index]}</span></>}
        </div>;
      })}</div>
      {checked && <div role="status" className={cn("mt-4 rounded-2xl border p-3 text-sm", score === 8 ? "border-emerald-200/30 bg-emerald-300/10 text-emerald-100" : "border-amber-200/30 bg-amber-300/10 text-amber-100")}><p className="font-extrabold">{score === 8 ? "Perfect orbit order! The Solar System is aligned. 🌟" : `${score}/8 planets are in the right orbital position.`}</p><p className="mt-1 text-white/75">{score === 8 ? "From the Sun outward: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune." : "Use the planet clues, then swap any misplaced characters and check again."}</p></div>}
    </section>

    <section className={card}><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-lg font-bold">Planet character dock</h2><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">{Object.keys(placements).length}/8 placed</span></div><p className="mb-3 text-sm text-muted-foreground">Each planet is a separate draggable character. On a phone or tablet, tap a planet and then the matching Planet 1–8 slot.</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{planetCards.map((planet) => <button key={planet.name} type="button" draggable onDragStart={(event) => event.dataTransfer.setData("text/planet-name", planet.name)} onClick={() => setSelected((current) => current === planet.name ? null : planet.name)} aria-pressed={selected === planet.name} className={cn("flex min-h-32 items-center gap-3 rounded-2xl border-2 p-3 text-left transition", selected === planet.name ? "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/20" : Object.values(placements).includes(planet.name) ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-background/70 hover:-translate-y-0.5 hover:border-violet-500/50")}><PlanetCharacter planet={planet.id} size="md"/><span className="min-w-0"><span className="block text-sm font-extrabold">{planet.name}</span><span className="mt-1 block text-xs text-muted-foreground">{planet.clue}</span></span></button>)}</div>
      {message && <p role="status" className="mt-4 rounded-xl bg-secondary p-3 text-sm font-semibold">{message}</p>}
      <div className="mt-4 flex flex-wrap gap-2"><Button className={action} onClick={() => void check()} disabled={Object.keys(placements).length !== 8 || saving}><CheckCircle2 className="h-4 w-4"/> Check orbit order</Button><Button variant="outline" className={action} onClick={reset}><RotateCcw className="h-4 w-4"/> Reset</Button></div>
    </section>
  </div>;
}

export function EcoRescueMission({ onComplete, onExit }: MissionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [sorted, setSorted] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const score = wasteItems.filter((item) => sorted[item.id] === item.bin).length;
  const dropItem = (e: DragEvent<HTMLDivElement>, binId: string) => {
    e.preventDefault(); const id = e.dataTransfer.getData("text/waste-id");
    if (id) { setSorted((current) => ({ ...current, [id]: binId })); setChecked(false); setMessage(""); setSelected(null); }
  };
  const assign = (binId: string) => {
    if (!selected) return;
    setSorted((current) => ({ ...current, [selected]: binId })); setChecked(false); setMessage(""); setSelected(null);
  };
  const check = async () => {
    setChecked(true);
    setMessage(`${score}/${wasteItems.length} items sorted correctly.`);
    if (Object.keys(sorted).length === wasteItems.length && score >= 4 && onComplete && !saving) {
      setSaving(true);
      try { setMessage(await onComplete(score, wasteItems.length)); } catch { setMessage("Your score could not be saved. Please try again."); }
      setSaving(false);
    }
  };
  return <div className="relative isolate space-y-5 before:pointer-events-none before:absolute before:inset-x-[-1rem] before:-top-8 before:-z-10 before:h-[28rem] before:rounded-[3rem] before:bg-gradient-to-br before:from-lime-500/15 before:via-emerald-400/10 before:to-transparent before:blur-2xl" data-tutor-context="Eco Rescue: sort waste into recycling, compost and general waste bins.">
    <header className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-3xl">🌍</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-primary">Earth science · Rescue mission</p><h1 className="font-display text-2xl font-extrabold sm:text-3xl">Eco Rescue</h1><p className="text-sm text-muted-foreground">Choose an item, then tap a bin — or drag it into the right bin.</p></div><Button variant="ghost" className={action} onClick={onExit}><ArrowLeft className="h-4 w-4"/> Exit</Button></header>
    <section className={card}><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-bold">Items to rescue</h2><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">{Object.keys(sorted).length}/6 sorted</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{wasteItems.filter((item) => !sorted[item.id]).map((item) => <button key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/waste-id", item.id)} onClick={() => setSelected(item.id)} className={cn("rounded-2xl border-2 p-3 text-left transition", selected === item.id ? "border-primary bg-primary/10" : "border-border bg-background/60 hover:border-primary/50")} aria-pressed={selected === item.id}><span className="text-2xl">{item.icon}</span><span className="mt-1 block text-sm font-bold">{item.name}</span></button>)}</div>{Object.keys(sorted).length > 0 && <p className="mt-3 text-xs text-muted-foreground">Already sorted: {wasteItems.filter((item) => sorted[item.id]).map((item) => `${item.icon} ${item.name}`).join(" · ")}</p>}</section>
    <section className="grid gap-3 md:grid-cols-3">{bins.map((bin) => <div key={bin.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => dropItem(e, bin.id)} onClick={() => assign(bin.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); assign(bin.id); } }} className="min-h-36 rounded-[1.75rem] border-2 border-dashed border-border bg-background/50 p-4 transition hover:border-primary/60"><div className="flex items-center gap-3"><span className="text-3xl">{bin.icon}</span><div><h3 className="font-display text-lg font-extrabold">{bin.label}</h3><p className="text-xs text-muted-foreground">{bin.detail}</p></div></div><div className="mt-3 flex flex-wrap gap-2">{wasteItems.filter((item) => sorted[item.id] === bin.id).map((item) => <span key={item.id} className={cn("rounded-full px-2 py-1 text-xs font-semibold", checked && item.bin !== bin.id ? "bg-destructive/10 text-destructive" : "bg-secondary")}>{item.icon} {item.name}</span>)}</div></div>)}</section>
    {message && <p role="status" className="rounded-xl bg-secondary p-3 text-sm font-semibold">{message}</p>}
    <div className="flex flex-wrap gap-2"><Button className={action} onClick={() => void check()}><CheckCircle2 className="h-4 w-4"/> Check sorting</Button><Button variant="outline" className={action} onClick={() => { setSorted({}); setSelected(null); setMessage(""); setChecked(false); }}><RotateCcw className="h-4 w-4"/> Reset</Button></div>
  </div>;
}

type CodeCommand = "move" | "left" | "right" | "repeat2" | "ifclear";
const commandData: { id: CodeCommand; title: string; subtitle: string; symbol: string }[] = [
  { id: "move", title: "Move forward", subtitle: "Move 1 tile", symbol: "⬆️" },
  { id: "left", title: "Turn left", subtitle: "Rotate 90°", symbol: "↶" },
  { id: "right", title: "Turn right", subtitle: "Rotate 90°", symbol: "↷" },
  { id: "repeat2", title: "Repeat ×2", subtitle: "Loop: move twice", symbol: "🔁" },
  { id: "ifclear", title: "If path is clear", subtitle: "Move only if safe", symbol: "❔" },
];
const directions = [{ x: 1, y: 0, symbol: "➡️" }, { x: 0, y: 1, symbol: "⬇️" }, { x: -1, y: 0, symbol: "⬅️" }, { x: 0, y: -1, symbol: "⬆️" }];

function runProgram(program: CodeCommand[]) {
  let x = 0, y = 2, direction = 0;
  const path = [{ x, y }];
  let hitWall = false;
  const blocked = (nx: number, ny: number) => nx < 0 || nx > 4 || ny < 0 || ny > 3 || (nx === 2 && ny === 2);
  const move = () => {
    const next = directions[direction]!; const nx = x + next.x, ny = y + next.y;
    if (blocked(nx, ny)) { hitWall = true; return false; }
    x = nx; y = ny; path.push({ x, y }); return true;
  };
  for (const cmd of program) {
    if (cmd === "left") direction = (direction + 3) % 4;
    else if (cmd === "right") direction = (direction + 1) % 4;
    else if (cmd === "move") { if (!move()) break; }
    else if (cmd === "repeat2") { if (!move() || !move()) break; }
    else if (cmd === "ifclear") {
      const next = directions[direction]!;
      if (!blocked(x + next.x, y + next.y) && !move()) break;
    }
    if (path.length > 30) break;
  }
  return { x, y, direction, path, hitWall, won: x === 4 && y === 2 };
}

export function CodeLogicLab({ onComplete, onExit }: MissionProps) {
  const [program, setProgram] = useState<CodeCommand[]>([]);
  const [result, setResult] = useState<ReturnType<typeof runProgram> | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const append = (command: CodeCommand) => { setProgram((items) => items.length < 14 ? [...items, command] : items); setResult(null); setMessage(""); };
  const run = async () => {
    const next = runProgram(program); setResult(next);
    if (next.won) {
      setMessage("Mission complete! Your algorithm guided the robot around the obstacle. 🎉");
      if (onComplete && !saving) { setSaving(true); try { setMessage(await onComplete(5, 5)); } catch { setMessage("Level complete, but your score could not be saved."); } setSaving(false); }
    } else if (next.hitWall) setMessage("Bump! The robot hit a wall or obstacle. Debug the sequence and run again.");
    else setMessage("Not at the star yet. Check your turns and try another sequence.");
  };
  const paletteDrag = (e: DragEvent<HTMLButtonElement>, command: CodeCommand) => e.dataTransfer.setData("text/code-command", command);
  const programDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); const cmd = e.dataTransfer.getData("text/code-command") as CodeCommand; if (commandData.some((c) => c.id === cmd)) append(cmd); };
  const robot = result ? result.path[result.path.length - 1]! : { x: 0, y: 2 };
  const robotDirection = result?.direction ?? 0;

  return <div className="relative isolate space-y-5 before:pointer-events-none before:absolute before:inset-x-[-1rem] before:-top-8 before:-z-10 before:h-[28rem] before:rounded-[3rem] before:bg-gradient-to-br before:from-cyan-500/15 before:via-sky-400/10 before:to-transparent before:blur-2xl" data-tutor-context="Computer Science: Code Logic Lab — sequence commands to guide a robot through a maze using loops and conditionals.">
    <header className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-500/15 text-3xl">🤖</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-primary">Computer science · Coding mission</p><h1 className="font-display text-2xl font-extrabold sm:text-3xl">Code Logic Lab</h1><p className="text-sm text-muted-foreground">Build an algorithm to reach the star. Drag blocks, or tap a block to add it.</p></div><Button variant="ghost" className={action} onClick={onExit}><ArrowLeft className="h-4 w-4"/> Exit</Button></header>
    <section className={card}>
      <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-bold">Robot maze</h2><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">Start 🤖 · Goal ⭐</span></div>
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1.5 rounded-2xl bg-slate-900/10 p-2" role="img" aria-label="Five by four robot maze with a blocked tile in the centre row">
        {Array.from({ length: 20 }, (_, i) => { const x = i % 5, y = Math.floor(i / 5); const isStart = x === 0 && y === 2; const isGoal = x === 4 && y === 2; const isWall = x === 2 && y === 2; const isRobot = robot.x === x && robot.y === y; const visited = result?.path.some((p) => p.x === x && p.y === y); return <div key={i} className={cn("grid aspect-square place-items-center rounded-lg border text-lg sm:text-2xl", isWall ? "border-slate-700 bg-slate-700" : isGoal ? "border-amber-400 bg-amber-300/30" : visited ? "border-cyan-400 bg-cyan-400/20" : "border-border bg-background/80")}>{isWall ? "🧱" : isRobot ? directions[robotDirection]!.symbol.replace("➡️", "🤖➡️").replace("⬇️", "🤖⬇️").replace("⬅️", "🤖⬅️").replace("⬆️", "🤖⬆️") : isGoal ? "⭐" : isStart ? "🚩" : ""}</div>; })}
      </div>
      {result && <p role="status" className="mt-3 text-center text-sm font-semibold">Robot position: column {result.x + 1}, row {result.y + 1}{result.won ? " — Goal reached!" : result.hitWall ? " — collision detected" : ""}</p>}
    </section>
    <section className={card}><h2 className="mb-3 font-display text-lg font-bold">Code block palette</h2><div className="grid gap-2 sm:grid-cols-2">{commandData.map((cmd) => <button key={cmd.id} draggable onDragStart={(e) => paletteDrag(e, cmd.id)} onClick={() => append(cmd.id)} className="flex items-center gap-3 rounded-2xl border-2 border-border bg-background/60 p-3 text-left transition hover:border-primary/60"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-xl">{cmd.symbol}</span><span className="flex-1"><span className="block text-sm font-extrabold">{cmd.title}</span><span className="block text-xs text-muted-foreground">{cmd.subtitle}</span></span><span className="text-lg font-bold text-primary">＋</span></button>)}</div></section>
    <section className={card}><div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-display text-lg font-bold">Your algorithm</h2><span className="text-xs font-semibold text-muted-foreground">{program.length}/14 blocks</span></div><div onDragOver={(e) => e.preventDefault()} onDrop={programDrop} className="min-h-24 rounded-2xl border-2 border-dashed border-border bg-background/50 p-3"><div className="flex flex-wrap gap-2">{program.map((cmd, i) => <button key={`${cmd}-${i}`} onClick={() => { setProgram((items) => items.filter((_, index) => index !== i)); setResult(null); setMessage(""); }} title="Remove this block" className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold"><span>{commandData.find((c) => c.id === cmd)?.symbol}</span><span>{i + 1}. {commandData.find((c) => c.id === cmd)?.title}</span><X className="h-3 w-3"/></button>)}</div>{program.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Drop blocks here or tap the palette above.</p>}</div>
      {message && <p role="status" className="mt-3 rounded-xl bg-secondary p-3 text-sm font-semibold">{message}</p>}
      <div className="mt-4 flex flex-wrap gap-2"><Button className={action} onClick={() => void run()} disabled={program.length === 0 || saving}><Play className="h-4 w-4"/> Run code</Button><Button variant="outline" className={action} onClick={() => { setProgram([]); setResult(null); setMessage(""); }}><RotateCcw className="h-4 w-4"/> Reset</Button></div>
      <p className="mt-3 text-xs text-muted-foreground">Tip: a loop repeats steps; a condition checks whether the next tile is clear before moving.</p>
    </section>
  </div>;
}

export function RealWorldScienceHunt({ onComplete, onExit }: MissionProps) {
  const tasks = [
    { id: "leaf", title: "Find a leaf", text: "Look for veins and compare its shape without damaging the plant.", icon: "🍃" },
    { id: "shadow", title: "Find a shadow", text: "Notice how its direction changes with the light source.", icon: "🌤️" },
    { id: "water", title: "Spot water changing state", text: "Look for condensation on a cold cup or dew on grass.", icon: "💧" },
    { id: "material", title: "Compare two materials", text: "Compare paper, wood or metal by appearance; do not touch hot or unknown items.", icon: "🔎" },
    { id: "reuse", title: "Find something reusable", text: "Choose one safe item that can be used again instead of thrown away.", icon: "♻️" },
  ];
  const [done, setDone] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const allDone = done.length === tasks.length;
  const finish = async () => {
    if (!allDone || !onComplete || saving) return;
    setSaving(true);
    try { setMessage(await onComplete(done.length, tasks.length)); } catch { setMessage("Your result could not be saved. Your checklist is still complete on this screen."); }
    setSaving(false);
  };
  const toggle = (id: string) => { setDone((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]); setMessage(""); };
  return <div className="relative isolate space-y-5 before:pointer-events-none before:absolute before:inset-x-[-1rem] before:-top-8 before:-z-10 before:h-[28rem] before:rounded-[3rem] before:bg-gradient-to-br before:from-fuchsia-500/15 before:via-violet-400/10 before:to-transparent before:blur-2xl" data-tutor-context="Real-World Science Hunt: safe observation missions around the home or classroom; the Scanner can analyze a photo of an object.">
    <header className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/15 text-3xl">🔭</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-primary">Real-world discovery</p><h1 className="font-display text-2xl font-extrabold sm:text-3xl">Real-World Science Hunt</h1><p className="text-sm text-muted-foreground">Complete safe observation challenges, then use Scan & Learn to ask about what you found.</p></div><Button variant="ghost" className={action} onClick={onExit}><ArrowLeft className="h-4 w-4"/> Exit</Button></header>
    <section className={card}><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-bold">Your field checklist</h2><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">{done.length}/5 complete</span></div><div className="space-y-3">{tasks.map((task) => <label key={task.id} className={cn("flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition", done.includes(task.id) ? "border-emerald-500/50 bg-emerald-500/5" : "border-border bg-background/50 hover:border-primary/40")}><input type="checkbox" checked={done.includes(task.id)} onChange={() => toggle(task.id)} className="mt-1 h-4 w-4 accent-emerald-600"/><span className="text-2xl">{task.icon}</span><span className="flex-1"><span className="block font-extrabold">{task.title}</span><span className="mt-1 block text-sm text-muted-foreground">{task.text}</span></span>{done.includes(task.id) && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600"/>}</label>)}</div>
      <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">Safety first: observe only. Do not taste unknown substances or touch hot, sharp, chemical, electrical or unfamiliar objects. Ask a teacher or adult when unsure.</div>
      {message && <p role="status" className="mt-3 rounded-xl bg-secondary p-3 text-sm font-semibold">{message}</p>}
      <div className="mt-4 flex flex-wrap gap-2"><Button asChild className={action}><Link to="/app/scanner"><Sparkles className="h-4 w-4"/> Open Scan & Learn</Link></Button><Button variant="outline" className={action} disabled={!allDone || saving} onClick={() => void finish()}><CheckCircle2 className="h-4 w-4"/> Complete hunt</Button><Button variant="ghost" className={action} onClick={() => { setDone([]); setMessage(""); }}><RotateCcw className="h-4 w-4"/> Reset checklist</Button></div>
    </section>
  </div>;
}
