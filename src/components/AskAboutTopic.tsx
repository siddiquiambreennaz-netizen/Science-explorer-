import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageCircleQuestion, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askTutor } from "@/lib/learn.functions";
import { useLang } from "@/lib/lang-store";
import { ReadAloud } from "@/components/ReadAloud";
import type { MascotState } from "@/components/Mascot";

type Msg = { role: "user" | "assistant"; content: string };
const QUICK = ["Explain this more simply", "Give me a different example", "Break it into smaller steps", "Give me a hint"];

/** In-lesson follow-up questions. Keeps its own thread so the lesson position is never lost. */
export function AskAboutTopic({ topic, context, onMascot }: { topic: string; context: string; onMascot?: (s: MascotState, ms?: number) => void }) {
  const ask = useServerFn(askTutor);
  const [lang] = useLang();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastQ, setLastQ] = useState("");
  const lock = useRef(false);

  const send = async (q: string, retry = false) => {
    const question = q.trim();
    if (question.length < 2 || lock.current) return;
    lock.current = true; setBusy(true); setError(""); setLastQ(question); onMascot?.("thinking", 0);
    const history = msgs.slice(-10);
    if (!retry) setMsgs((m) => [...m, { role: "user", content: question }]);
    setInput("");
    try {
      const r = await ask({ data: { question, topic: topic.slice(0, 120), context: context.slice(0, 6000), lang, history } });
      if (r.ok) { setMsgs((m) => [...m, { role: "assistant", content: r.answer }]); onMascot?.("explaining", 2500); }
      else { setError(r.error); onMascot?.("error", 2000); }
    } catch { setError("Couldn’t reach the tutor. Check your connection and retry."); onMascot?.("error", 2000); }
    finally { lock.current = false; setBusy(false); }
  };

  return (
    <section aria-label="Ask about this topic" className="glass space-y-3 rounded-[2rem] p-5">
      <h2 className="flex items-center gap-2 font-display text-xl font-extrabold"><MessageCircleQuestion className="h-5 w-5 text-primary" />Ask about this topic</h2>
      <p className="text-sm text-muted-foreground">Confused? Ask here — your place in the lesson stays put.</p>
      <div className="flex flex-wrap gap-2">{QUICK.map((q) => <Button key={q} size="sm" variant="secondary" className="rounded-full" disabled={busy} onClick={() => void send(q)}>{q}</Button>)}</div>
      <div className="max-h-96 space-y-3 overflow-y-auto" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-auto w-fit max-w-[90%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground" : "space-y-2 rounded-2xl bg-secondary/70 p-3 text-sm"}>
            <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            {m.role === "assistant" && <ReadAloud text={m.content} />}
          </div>
        ))}
        {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Thinking…</p>}
        {error && <div role="alert" className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error} <Button size="sm" variant="secondary" className="ml-2 rounded-full" onClick={() => void send(lastQ, true)}>Retry</Button></div>}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
        <input aria-label="Your question about this topic" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000} placeholder="Type your question…" className="h-11 min-w-0 flex-1 rounded-2xl border-2 border-input bg-background/70 px-3 text-sm outline-none focus:border-primary" />
        <Button type="submit" className="rounded-full" disabled={busy || input.trim().length < 2} aria-label="Ask"><Send /></Button>
      </form>
    </section>
  );
}
