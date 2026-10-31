import { useMemo, useState } from "react";
import { Magnet, RotateCcw, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MagnetExplorer() {
  const [leftPole, setLeftPole] = useState<"N" | "S">("N");
  const [rightPole, setRightPole] = useState<"N" | "S">("S");
  const [distance, setDistance] = useState(42);
  const [material, setMaterial] = useState<"iron" | "plastic">("iron");
  const [showDiscovery, setShowDiscovery] = useState(false);
  const attracts = leftPole !== rightPole;
  const strength = useMemo(() => distance < 25 ? "Strong interaction" : distance < 65 ? "Medium interaction" : "Weak interaction", [distance]);

  const reset = () => { setLeftPole("N"); setRightPole("S"); setDistance(42); setMaterial("iron"); setShowDiscovery(false); };

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-4 text-white shadow-2xl sm:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-14 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-200">PHYSICS WORLD · INTERACTIVE EXPERIMENT</p><h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Magnetic Field Lab</h2><p className="mt-2 max-w-2xl text-sm text-white/70">Change the poles, move the magnets and observe how magnetic forces behave.</p></div>
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/15 bg-white/10"><Magnet className="h-7 w-7 text-cyan-200" /></span>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/65 p-3 sm:p-5">
          <div className="relative flex min-h-[230px] items-center justify-between gap-2 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_center,rgba(34,211,238,.15),transparent_65%)] px-2 sm:px-8">
            <div aria-hidden="true" className={cn("pointer-events-none absolute inset-x-[15%] top-1/2 h-32 -translate-y-1/2 rounded-[50%] border transition-all duration-500", attracts ? "border-cyan-300/30 scale-x-100" : "border-rose-300/30 scale-x-110")} />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-[22%] top-1/2 h-24 -translate-y-1/2 rounded-[50%] border border-white/10" />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <span className="text-xs font-bold text-white/65">MAGNET A</span>
              <button type="button" onClick={() => setLeftPole((pole) => pole === "N" ? "S" : "N")} className="flex h-16 w-24 overflow-hidden rounded-xl border-2 border-white/50 text-sm font-black shadow-[0_0_32px_rgba(34,211,238,.2)] transition hover:scale-105 sm:h-20 sm:w-32" aria-label="Flip magnet A polarity">
                <span className={cn("grid flex-1 place-items-center", leftPole === "N" ? "bg-blue-500" : "bg-rose-500")}>{leftPole === "N" ? "S" : "N"}</span><span className={cn("grid flex-1 place-items-center", leftPole === "N" ? "bg-rose-500" : "bg-blue-500")}>{leftPole}</span>
              </button>
              <span className="text-[11px] text-white/55">Tap to flip</span>
            </div>
            <div className="relative z-10 flex min-w-16 flex-col items-center gap-1">
              <span className={cn("text-3xl font-black transition", attracts ? "text-cyan-200" : "text-rose-200")}>{attracts ? "↔" : "← →"}</span>
              <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-bold text-white/70">{distance}% gap</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <span className="text-xs font-bold text-white/65">MAGNET B</span>
              <button type="button" onClick={() => setRightPole((pole) => pole === "N" ? "S" : "N")} className="flex h-16 w-24 overflow-hidden rounded-xl border-2 border-white/50 text-sm font-black shadow-[0_0_32px_rgba(129,140,248,.2)] transition hover:scale-105 sm:h-20 sm:w-32" aria-label="Flip magnet B polarity">
                <span className={cn("grid flex-1 place-items-center", rightPole === "N" ? "bg-rose-500" : "bg-blue-500")}>{rightPole}</span><span className={cn("grid flex-1 place-items-center", rightPole === "N" ? "bg-blue-500" : "bg-rose-500")}>{rightPole === "N" ? "S" : "N"}</span>
              </button>
              <span className="text-[11px] text-white/55">Tap to flip</span>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <label className="text-xs font-bold text-white/75">Magnet distance <input type="range" min="10" max="90" value={distance} onChange={(event) => setDistance(Number(event.target.value))} className="mt-2 w-full accent-cyan-300" /></label>
            <div className={cn("rounded-2xl border px-4 py-3 text-center", attracts ? "border-cyan-300/25 bg-cyan-300/10" : "border-rose-300/25 bg-rose-300/10")}><p className="text-[10px] font-extrabold uppercase tracking-wide text-white/60">Observed force</p><p className={cn("mt-1 font-extrabold", attracts ? "text-cyan-200" : "text-rose-200")}>{attracts ? "Attraction" : "Repulsion"}</p><p className="mt-1 text-[10px] text-white/60">{strength}</p></div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="flex items-center gap-2 font-bold"><Zap className="h-4 w-4 text-amber-300" /> Test a material</h3>
            <p className="mt-1 text-xs text-white/60">Which object are you bringing near the magnet?</p>
            <div className="mt-3 flex gap-2"><Button size="sm" variant={material === "iron" ? "secondary" : "outline"} className="rounded-full" onClick={() => setMaterial("iron")}>Iron nail</Button><Button size="sm" variant={material === "plastic" ? "secondary" : "outline"} className="rounded-full" onClick={() => setMaterial("plastic")}>Plastic bead</Button></div>
            <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm">{material === "iron" ? "The iron nail is attracted to either pole because iron is ferromagnetic." : "The plastic bead is not attracted by an ordinary classroom magnet."}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="flex items-center gap-2 font-bold"><Sparkles className="h-4 w-4 text-cyan-200" /> Discovery challenge</h3>
            <p className="mt-1 text-xs text-white/60">Predict the result before revealing the science.</p>
            <Button className="mt-3 rounded-full bg-cyan-200 text-slate-950 hover:bg-cyan-100" onClick={() => setShowDiscovery((current) => !current)}>{showDiscovery ? "Hide discovery" : "Reveal discovery"}</Button>
            {showDiscovery && <p className="mt-3 rounded-2xl bg-cyan-300/10 p-3 text-sm text-cyan-50">{attracts ? "Opposite poles attract each other." : "Like poles repel each other."} Magnetic interaction is generally stronger at smaller distances.</p>}
          </div>
        </div>
        <div className="mt-4 flex justify-end"><Button variant="outline" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={reset}><RotateCcw className="h-4 w-4" /> Reset experiment</Button></div>
      </div>
    </section>
  );
}
