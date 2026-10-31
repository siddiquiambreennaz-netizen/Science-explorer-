import { useEffect, useRef, useState } from "react";
import idle from "@/assets/mascot/idle.png";
import happy from "@/assets/mascot/happy.png";
import thinking from "@/assets/mascot/thinking.png";
import sad from "@/assets/mascot/sad.png";
import sleeping from "@/assets/mascot/sleeping.png";
import celebrating from "@/assets/mascot/celebrating.png";
import { cn } from "@/lib/utils";

export type MascotState =
  | "idle" | "welcome" | "thinking" | "explaining" | "happy" | "sad" | "sleeping"
  | "celebrating" | "scanning" | "excited" | "error";

// Every image is the user's supplied robot PNG (transparent) — never generated or redrawn.
const IMAGES: Record<MascotState, string> = {
  idle, welcome: happy, thinking, explaining: happy, happy, sad, sleeping,
  celebrating, scanning: thinking, excited: happy, error: sad,
};
const MOTION: Record<MascotState, string> = {
  idle: "mascot-idle", welcome: "mascot-wave", thinking: "mascot-pulse", explaining: "mascot-speak",
  happy: "mascot-bounce", sad: "mascot-droop", sleeping: "mascot-breathe", celebrating: "mascot-celebrate",
  scanning: "mascot-pulse", excited: "mascot-bounce", error: "mascot-shake",
};
const INACTIVE_MS = 60_000;

/** Event-driven mascot. Idle drifts to sleeping after a minute without interaction. */
export function Mascot({ state, className }: { state: MascotState; className?: string }) {
  const [sleepy, setSleepy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (state !== "idle") { setSleepy(false); return; }
    const wake = () => { setSleepy(false); clearTimeout(timer.current); timer.current = setTimeout(() => setSleepy(true), INACTIVE_MS); };
    wake();
    const evts = ["pointerdown", "keydown", "scroll", "pointermove"] as const;
    evts.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => { clearTimeout(timer.current); evts.forEach((e) => window.removeEventListener(e, wake)); };
  }, [state]);
  const shown: MascotState = state === "idle" && sleepy ? "sleeping" : state;
  return (
    <div className={cn("relative aspect-square shrink-0", className)} aria-hidden>
      <img key={shown} src={IMAGES[shown] ?? idle} alt="" draggable={false}
        className={cn("mascot-img relative h-full w-full object-contain", MOTION[shown])} />
      {(shown === "thinking" || shown === "explaining") && (
        <span className="absolute -right-1 top-1 flex gap-0.5 rounded-full bg-card px-2 py-1 shadow-soft">
          {[0, 1, 2].map((i) => <span key={i} className="think-dot h-1.5 w-1.5 rounded-full bg-primary" />)}
        </span>
      )}
      {shown === "scanning" && <span className="scan-line absolute inset-x-[10%] h-0.5 rounded-full bg-primary/70" />}
      {shown === "sleeping" && <span className="absolute right-0 top-0 font-display text-sm font-bold text-primary">z z</span>}
    </div>
  );
}

/** Show a short reaction, then return to idle. */
export function useMascot(initial: MascotState = "idle") {
  const [state, setState] = useState<MascotState>(initial);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  const react = (s: MascotState, ms = 1800) => { clearTimeout(t.current); setState(s); if (ms > 0) t.current = setTimeout(() => setState("idle"), ms); };
  return [state, react] as const;
}
