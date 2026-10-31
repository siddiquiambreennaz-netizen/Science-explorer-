import { useEffect, useState } from "react";
import { Clock3, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/lang-store";
import { cn } from "@/lib/utils";

const SESSION_SECONDS = 20 * 60;
type Lang = "en" | "ur" | "roman" | "sd";
const copy = {
  en: { title: "20-minute focus session", intro: "Optional focus timer. Your game keeps running when time is up.", start: "Start", pause: "Pause", resume: "Resume", reset: "Reset", done: "20 minutes complete! Great focus. Take a short break or keep exploring." },
  ur: { title: "20 منٹ کا فوکس سیشن", intro: "اختیاری ٹائمر۔ وقت پورا ہونے پر گیم بند نہیں ہوگی۔", start: "شروع", pause: "روکیں", resume: "جاری رکھیں", reset: "ری سیٹ", done: "20 منٹ مکمل! تھوڑا وقفہ لیں یا سیکھنا جاری رکھیں۔" },
  roman: { title: "20-minute focus session", intro: "Optional timer hai. Waqt khatam ho to game band nahi hogi.", start: "Start", pause: "Pause", resume: "Resume", reset: "Reset", done: "20 minutes complete! Chhota break lein ya explore karte rahen." },
  sd: { title: "20 منٽن جو فوڪس سيشن", intro: "هي اختياري ٽائمر آهي؛ وقت ختم ٿيڻ تي راند بند نه ٿيندي.", start: "شروع", pause: "روڪيو", resume: "جاري رکو", reset: "ري سيٽ", done: "20 منٽ مڪمل! ٿورو وقفو وٺو يا سکڻ جاري رکو." },
} as const;

/** Optional 20-minute study timer for every ready-made and AI-generated game. */
export function FocusSessionTimer() {
  const [lang] = useLang();
  const t = copy[lang as Lang] ?? copy.en;
  const [seconds, setSeconds] = useState(SESSION_SECONDS);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (seconds === 0) setRunning(false);
  }, [seconds]);

  const display = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-indigo-300/20 bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-sky-500/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4" aria-label={t.title}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600"><Clock3 className="h-5 w-5" /></span>
        <div className="min-w-0"><h2 className="text-sm font-extrabold">{t.title}</h2><p className="mt-0.5 text-xs text-muted-foreground">{seconds === 0 ? t.done : t.intro}</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className={cn("min-w-[5.2rem] rounded-xl border bg-background/70 px-3 py-2 text-center font-mono text-lg font-extrabold tabular-nums", seconds === 0 ? "border-emerald-500/30 text-emerald-600" : "border-border")}>{display}</span>
        <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setRunning((value) => !value)} disabled={seconds === 0}>
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{running ? t.pause : seconds === SESSION_SECONDS ? t.start : t.resume}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => { setRunning(false); setSeconds(SESSION_SECONDS); }} aria-label={t.reset}><RotateCcw className="h-4 w-4" />{t.reset}</Button>
      </div>
    </section>
  );
}
