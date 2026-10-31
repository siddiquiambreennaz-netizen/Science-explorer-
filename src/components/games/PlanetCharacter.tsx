import { cn } from "@/lib/utils";

export type PlanetId = "mercury" | "venus" | "earth" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune";

const planetStyles: Record<PlanetId, { body: string; pattern: string }> = {
  mercury: { body: "bg-gradient-to-br from-stone-200 via-stone-400 to-stone-600", pattern: "mercury" },
  venus: { body: "bg-gradient-to-br from-amber-200 via-orange-400 to-orange-700", pattern: "venus" },
  earth: { body: "bg-gradient-to-br from-sky-300 via-blue-500 to-blue-800", pattern: "earth" },
  mars: { body: "bg-gradient-to-br from-rose-300 via-red-500 to-red-800", pattern: "mars" },
  jupiter: { body: "bg-gradient-to-br from-orange-200 via-orange-400 to-amber-700", pattern: "jupiter" },
  saturn: { body: "bg-gradient-to-br from-yellow-100 via-amber-300 to-yellow-700", pattern: "saturn" },
  uranus: { body: "bg-gradient-to-br from-teal-100 via-cyan-300 to-teal-600", pattern: "uranus" },
  neptune: { body: "bg-gradient-to-br from-blue-200 via-blue-500 to-indigo-900", pattern: "neptune" },
};

type Props = { planet: PlanetId; size?: "sm" | "md" | "lg"; className?: string };

/** Original CSS-drawn cartoon planet mascots inspired by the supplied reference (not a flattened poster). */
export function PlanetCharacter({ planet, size = "md", className }: Props) {
  const theme = planetStyles[planet];
  const dimension = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-24 w-24 sm:h-28 sm:w-28" : "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]";
  const faceScale = size === "sm" ? "scale-[0.68]" : size === "lg" ? "scale-110" : "";

  return (
    <div className={cn("relative isolate shrink-0", dimension, className)} aria-hidden="true">
      {planet === "saturn" && <div className="absolute left-[-14%] top-[35%] z-[-1] h-[34%] w-[128%] rotate-[-22deg] rounded-[50%] border-[5px] border-amber-100/90 shadow-[0_2px_3px_rgba(0,0,0,0.25)]" />}
      <div className={cn("absolute inset-[4%] overflow-hidden rounded-full border border-white/40 shadow-[inset_-6px_-8px_12px_rgba(0,0,0,0.22),inset_4px_4px_8px_rgba(255,255,255,0.34),0_5px_10px_rgba(0,0,0,0.18)]", theme.body)}>
        {(planet === "jupiter" || planet === "saturn" || planet === "neptune" || planet === "uranus") && <div className={cn("absolute inset-0 opacity-45", planet === "jupiter" ? "bg-[repeating-linear-gradient(0deg,transparent_0_12%,rgba(255,255,255,0.7)_13%_19%,rgba(115,47,22,0.28)_20%_27%)]" : planet === "saturn" ? "bg-[repeating-linear-gradient(0deg,transparent_0_16%,rgba(255,255,255,0.55)_17%_23%,rgba(130,75,17,0.25)_24%_31%)]" : planet === "neptune" ? "bg-[repeating-linear-gradient(0deg,transparent_0_16%,rgba(255,255,255,0.45)_17%_23%)]" : "bg-[repeating-linear-gradient(0deg,transparent_0_18%,rgba(255,255,255,0.5)_19%_27%)]")} />} 
        {planet === "earth" && <>
          <span className="absolute left-[15%] top-[19%] h-[25%] w-[35%] rotate-[-22deg] rounded-[55%_35%_55%_35%] bg-emerald-300 shadow-sm" />
          <span className="absolute right-[12%] top-[46%] h-[28%] w-[30%] rotate-[18deg] rounded-[45%_55%_38%_62%] bg-emerald-400 shadow-sm" />
          <span className="absolute left-[34%] bottom-[12%] h-[18%] w-[20%] rotate-[25deg] rounded-[55%_45%_60%_40%] bg-emerald-300" />
        </>}
        {planet === "mercury" && <>
          <span className="absolute left-[18%] top-[23%] h-[12%] w-[12%] rounded-full bg-stone-500/55" />
          <span className="absolute right-[21%] top-[62%] h-[8%] w-[8%] rounded-full bg-stone-700/45" />
          <span className="absolute left-[56%] top-[18%] h-[6%] w-[6%] rounded-full bg-stone-700/30" />
        </>}
        {planet === "venus" && <span className="absolute left-[12%] top-[25%] h-[18%] w-[80%] -rotate-12 rounded-full border-t-4 border-white/25" />}
        {planet === "mars" && <>
          <span className="absolute left-[10%] top-[28%] h-[13%] w-[25%] -rotate-12 rounded-full bg-orange-200/50" />
          <span className="absolute right-[16%] bottom-[24%] h-[16%] w-[18%] rounded-full bg-rose-200/40" />
        </>}
        <div className={cn("absolute inset-0", faceScale)}>
          <div className="absolute left-[29%] top-[34%] h-[12%] w-[10%] rounded-full bg-slate-950 shadow-[0_0_0_1.5px_rgba(255,255,255,0.28)]"><span className="absolute left-[24%] top-[14%] h-[25%] w-[25%] rounded-full bg-white/90" /></div>
          <div className="absolute right-[27%] top-[34%] h-[12%] w-[10%] rounded-full bg-slate-950 shadow-[0_0_0_1.5px_rgba(255,255,255,0.28)]"><span className="absolute left-[24%] top-[14%] h-[25%] w-[25%] rounded-full bg-white/90" /></div>
          <div className="absolute left-[17%] top-[50%] h-[10%] w-[18%] rounded-full bg-pink-300/75 blur-[1px]" />
          <div className="absolute right-[15%] top-[50%] h-[10%] w-[18%] rounded-full bg-pink-300/75 blur-[1px]" />
          <div className="absolute left-[39%] top-[50%] h-[13%] w-[23%] rounded-b-full border-b-[2px] border-slate-950" />
        </div>
      </div>
    </div>
  );
}
