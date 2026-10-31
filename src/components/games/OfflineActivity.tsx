import { useState } from "react";
import { CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import type { OfflineActivity as Activity } from "@/lib/offline-downloads";
import { Button } from "@/components/ui/button";

type Props = { activity: Activity; onComplete: () => void };

export function OfflineActivity({ activity, onComplete }: Props) {
  const [challenge, setChallenge] = useState(0);
  const [atoms, setAtoms] = useState<string[]>([]);
  const [coefficients, setCoefficients] = useState(activity.kind === "molecule" && activity.equation ? activity.equation.coefficients : [1,1,1]);
  const [north, setNorth] = useState<"N"|"S">("N");
  const [south, setSouth] = useState<"N"|"S">("N");
  const [material, setMaterial] = useState("iron");
  const [distance, setDistance] = useState(2);
  const [order, setOrder] = useState<string[]>(activity.kind === "planet-order" ? activity.planets.map(p=>p.name).sort(()=>Math.random()-.5) : []);
  const [assignments, setAssignments] = useState<Record<string,string>>({});
  const [feedback, setFeedback] = useState("");
  const [done, setDone] = useState(false);
  const [moleculeDone, setMoleculeDone] = useState(false);
  const [equationDone, setEquationDone] = useState(false);
  const complete = activity.kind === "molecule" ? moleculeDone && equationDone : done;

  const checkMolecule = () => {
    if (activity.kind !== "molecule") return;
    const target = activity.challenges[challenge]!;
    const actual = atoms.reduce<Record<string,number>>((a, atom)=>({...a,[atom]:(a[atom]??0)+1}),{});
    const ok = Object.keys({...target.atoms,...actual}).every(k=>(target.atoms[k]??0)===(actual[k]??0));
    setFeedback(ok ? `Correct! ${target.fact}` : "Not quite. Count each atom and try again.");
    if (ok && challenge === activity.challenges.length-1) setMoleculeDone(true);
    else if (ok) { setAtoms([]); setChallenge(v=>v+1); }
  };
  const checkEquation = () => {
    if (activity.kind !== "molecule" || !activity.equation) return;
    const ok = coefficients.every((v,i)=>v===activity.equation!.balanced[i]);
    setFeedback(ok ? `Balanced! ${activity.equation.fact}` : "The atoms do not balance yet. Adjust the coefficients and try again.");
    if(ok) setEquationDone(true);
  };
  const checkMagnet = () => {
    if(activity.kind !== "magnet") return;
    const c=activity.challenges[challenge]!;
    const attraction = north !== south;
    const ok = attraction === (c.north !== c.south) && material === c.material && (material === "iron") === c.magnetic && distance === c.distance;
    setFeedback(ok ? `Experiment correct! ${c.explanation}` : "Check the pole interaction, material and distance, then test again.");
    if(ok && challenge===activity.challenges.length-1) setDone(true);
    else if(ok) setChallenge(v=>v+1);
  };
  const checkPlanets=()=>{
    if(activity.kind!=="planet-order") return;
    const correct=[...activity.planets].sort((a,b)=>a.order-b.order).map(p=>p.name);
    const ok=order.every((name,i)=>name===correct[i]);
    setFeedback(ok?"Excellent! You arranged all eight planets from the Sun outward.":"Not yet. Remember Mercury is closest to the Sun. Try again.");
    if(ok)setDone(true);
  };
  const movePlanet=(name:string,delta:number)=>setOrder(prev=>{const a=[...prev];const i=a.indexOf(name);const j=Math.max(0,Math.min(a.length-1,i+delta));[a[i],a[j]]=[a[j]!,a[i]!];return a;});

  const title = activity.kind === "molecule" ? "Molecule Builder & Equation Balancer" : activity.kind === "magnet" ? "Magnetic Field Experiment" : activity.kind === "planet-order" ? "Solar System Planet Mission" : "Cell Explorer Sorting Lab";
  return <section className="space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-extrabold uppercase tracking-widest text-primary">REAL OFFLINE GAMEPLAY</p><h3 className="mt-1 text-xl font-extrabold">{title}</h3></div><span className="rounded-full bg-secondary px-3 py-1 text-xs">Interactive mission</span></div>
    {activity.kind === "molecule" && <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-secondary p-4"><p className="text-xs font-bold uppercase text-primary">Mission {Math.min(challenge+1,activity.challenges.length)} · Build a molecule</p><h4 className="mt-1 text-2xl font-black">{activity.challenges[challenge]!.name} · {activity.challenges[challenge]!.formula}</h4><p className="mt-1 text-sm text-muted-foreground">Add the required atoms to construct the molecule.</p></div>
      <div className="flex flex-wrap gap-2">{["H","O","C","Na","Cl","N"].map(atom=><Button key={atom} variant="secondary" onClick={()=>setAtoms(a=>[...a,atom])}>{atom}</Button>)}</div>
      <div className="flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border border-dashed border-border p-3">{atoms.length?atoms.map((a,i)=><button key={`${a}-${i}`} onClick={()=>setAtoms(v=>v.filter((_,j)=>j!==i))} className="rounded-full bg-cyan-200 px-4 py-2 font-black text-primary-foreground">{a} ×</button>):<span className="text-sm text-muted-foreground">Your atoms appear here…</span>}</div>
      <div className="flex flex-wrap gap-2"><Button onClick={checkMolecule}>Check molecule</Button><Button variant="outline" onClick={()=>{setAtoms([]);setFeedback("")}}>Reset atoms</Button></div>
      {activity.equation && <div className="space-y-3 rounded-2xl border border-border bg-background p-4"><p className="text-xs font-bold uppercase text-primary">Bonus challenge · Balance the equation</p><p className="text-center text-xl font-black">{activity.equation.equation}</p><div className="flex flex-wrap justify-center gap-3">{coefficients.map((v,i)=><div key={i} className="flex items-center gap-2 rounded-xl bg-secondary p-2"><Button size="sm" variant="outline" onClick={()=>setCoefficients(c=>c.map((n,j)=>j===i?Math.max(1,n-1):n))}>−</Button><b className="min-w-5 text-center">{v}</b><Button size="sm" variant="outline" onClick={()=>setCoefficients(c=>c.map((n,j)=>j===i?Math.min(8,n+1):n))}>+</Button></div>)}</div><Button onClick={checkEquation}>Check balanced equation</Button></div>}
    </div>}
    {activity.kind === "magnet" && <div className="space-y-4"><div className="rounded-2xl border border-border bg-secondary p-4"><p className="text-xs font-bold uppercase text-primary">Experiment {challenge+1} of {activity.challenges.length}</p><p className="mt-1 text-sm">Predict what happens when two magnets and a material interact.</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Left pole<select className="mt-1 w-full rounded-xl bg-background p-3" value={north} onChange={e=>setNorth(e.target.value as "N"|"S")}><option>N</option><option>S</option></select></label><label className="text-sm">Right pole<select className="mt-1 w-full rounded-xl bg-background p-3" value={south} onChange={e=>setSouth(e.target.value as "N"|"S")}><option>N</option><option>S</option></select></label><label className="text-sm">Test material<select className="mt-1 w-full rounded-xl bg-background p-3" value={material} onChange={e=>setMaterial(e.target.value)}><option value="iron">Iron</option><option value="plastic">Plastic</option></select></label><label className="text-sm">Distance<select className="mt-1 w-full rounded-xl bg-background p-3" value={distance} onChange={e=>setDistance(Number(e.target.value))}><option value={1}>Close</option><option value={2}>Far</option></select></label></div><div className="rounded-2xl border border-border bg-secondary p-4 text-center text-3xl">{north} 🧲 {south}<p className="mt-2 text-sm text-muted-foreground">{north===south?"Like poles repel":"Opposite poles attract"}</p></div><Button onClick={checkMagnet}>Test experiment</Button></div>}
    {activity.kind === "planet-order" && <div className="space-y-3"><p className="text-sm text-muted-foreground">Arrange the planets in order, starting nearest to the Sun. Use the arrows to move each planet.</p>{order.map((name,i)=>{const p=activity.planets.find(x=>x.name===name)!;return <div key={name} className="flex items-center gap-3 rounded-xl bg-secondary p-3"><span className="w-6 text-primary">{i+1}.</span><span className="text-2xl">{p.emoji}</span><b className="flex-1">{name}</b><Button size="sm" variant="outline" disabled={i===0} onClick={()=>movePlanet(name,-1)}>↑</Button><Button size="sm" variant="outline" disabled={i===order.length-1} onClick={()=>movePlanet(name,1)}>↓</Button></div>})}<Button onClick={checkPlanets}>Check planet order</Button></div>}
    {activity.kind === "cell-sort" && <div className="space-y-3"><p className="text-sm text-muted-foreground">Match each cell part to its function zone.</p>{activity.parts.map(part=><div key={part.name} className="grid gap-2 rounded-xl bg-secondary p-3 sm:grid-cols-2"><b>{part.name}</b><select className="rounded-lg bg-background p-2" value={assignments[part.name]??""} onChange={e=>setAssignments(a=>({...a,[part.name]:e.target.value}))}><option value="">Choose function</option><option value="control">Controls cell activities / DNA</option><option value="boundary">Controls entry and exit</option><option value="energy">Photosynthesis / light energy</option></select></div>)}<Button onClick={()=>{const ok=activity.parts.every(p=>assignments[p.name]===p.zone);setFeedback(ok?"All cell parts matched correctly!":"Some functions need another look.");if(ok)setDone(true)}}>Check cell model</Button></div>}
    {feedback && <p role="status" className="rounded-xl bg-secondary p-3 text-sm">{feedback}</p>}
    {complete ? <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3"><span className="flex items-center gap-2 font-bold text-emerald-700"><CheckCircle2/> Mission complete!</span><Button onClick={onComplete}>Continue to lesson & knowledge check</Button></div> : <p className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-4 w-4"/> Complete the interactive activity to unlock the knowledge check.</p>}
    <Button variant="ghost" className="text-foreground" onClick={()=>{setChallenge(0);setAtoms([]);setFeedback("");setDone(false);setMoleculeDone(false);setEquationDone(false);setCoefficients(activity.kind === "molecule" && activity.equation ? activity.equation.coefficients : [1,1,1]);setAssignments({});if(activity.kind==="planet-order")setOrder(activity.planets.map(p=>p.name).sort(()=>Math.random()-.5));}}> <RotateCcw className="mr-2 h-4 w-4"/>Restart activity</Button>
  </section>;
}
