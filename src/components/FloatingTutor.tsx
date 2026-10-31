import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Minus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/Mascot";
import { askTutor } from "@/lib/learn.functions";
import { useLang } from "@/lib/lang-store";
import { ReadAloud } from "@/components/ReadAloud";

export function FloatingTutor({ page }: { page: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const ask = useServerFn(askTutor);
  const [lang] = useLang();
  const labels = {
    en: { title: "Science Buddy", minimize: "Minimize chat", close: "Close chat", curious: "What are you curious about?", thinking: "Thinking…", placeholder: "Ask for a hint…", send: "Send to Science Buddy", open: "Open Science Buddy", hide: "Hide Science Buddy", retry: "Retry", connectError: "The tutor couldn’t connect. Please try again." },
    ur: { title: "سائنس ساتھی", minimize: "چیٹ چھوٹی کریں", close: "چیٹ بند کریں", curious: "آپ کیا جاننا چاہتے ہیں؟", thinking: "سوچ رہا ہے…", placeholder: "اشارہ پوچھیں…", send: "سائنس ساتھی کو بھیجیں", open: "سائنس ساتھی کھولیں", hide: "سائنس ساتھی چھپائیں", retry: "دوبارہ کوشش", connectError: "ٹیوٹر سے رابطہ نہیں ہو سکا۔ دوبارہ کوشش کریں۔" },
    roman: { title: "Science Buddy", minimize: "Chat minimize karein", close: "Chat band karein", curious: "Aap kya jaan-na chahte hain?", thinking: "Soch raha hai…", placeholder: "Hint poochein…", send: "Science Buddy ko bhejein", open: "Science Buddy kholein", hide: "Science Buddy chhupayein", retry: "Dobara koshish", connectError: "Tutor se rabta nahi ho saka. Dobara koshish karein." },
    sd: { title: "سائنس ساٿي", minimize: "چيٽ ننڍي ڪريو", close: "چيٽ بند ڪريو", curious: "توهان ڇا ڄاڻڻ چاهيو ٿا؟", thinking: "سوچي رهيو آهي…", placeholder: "اشارو پڇو…", send: "سائنس ساٿي ڏانهن موڪليو", open: "سائنس ساٿي کوليو", hide: "سائنس ساٿي لڪايو", retry: "ٻيهر ڪوشش", connectError: "ٽيوٽر سان رابطو نه ٿيو. ٻيهر ڪوشش ڪريو." },
  }[lang];
  const [lastQ, setLastQ] = useState("");
  const send = async (retry?: string) => {
    const question = (retry ?? input).trim();
    if (question.length < 2 || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    const history = messages.slice(-4).map((message) => ({ ...message, content: message.content.slice(0, 900) }));
    if (!retry) setMessages((m) => [...m, { role: "user", content: question }]); setInput(""); setLastQ(question);
    const activity = document.querySelector("[data-tutor-context]")?.getAttribute("data-tutor-context") ?? page;
    try {
      const result = await ask({ data: { question, topic: page.slice(0, 120), context: activity.slice(0, 2500), lang, history } });
      if (result.ok) setMessages((m) => [...m, { role: "assistant", content: result.answer }]);
      else setError(result.error);
    } catch { setError(labels.connectError); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
    {open && <section aria-label="Science buddy chat" className="mb-3 flex max-h-[70dvh] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-border bg-popover shadow-soft">
      <header className="flex items-center gap-2 border-b border-border p-3">
        <Mascot state={busy ? "thinking" : error ? "sad" : "idle"} className="w-12" />
        <h2 className="flex-1 font-display text-lg font-bold">{labels.title}</h2>
        <Button variant="ghost" size="icon" title={labels.minimize} aria-label={labels.minimize} onClick={() => setOpen(false)}><Minus /></Button>
        <Button variant="ghost" size="icon" title={labels.close} aria-label={labels.close} onClick={() => { setOpen(false); setMessages([]); setError(""); }}><X /></Button>
      </header>
      <div className="flex min-h-32 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        {!messages.length && <p className="text-sm text-muted-foreground">{labels.curious}</p>}
        {messages.map((m, i) => <div key={i} className={`max-w-[95%] whitespace-pre-wrap rounded-2xl p-3 text-sm ${m.role === "user" ? "self-end bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{m.content}{m.role === "assistant" && <span className="mt-2 block"><ReadAloud text={m.content} /></span>}</div>)}
        {busy && <p className="text-sm text-muted-foreground">{labels.thinking}</p>}
        {error && <div role="alert" className="text-sm text-destructive">{error} <Button size="sm" variant="secondary" className="ml-1 rounded-full" disabled={busy} onClick={() => void send(lastQ)}>{labels.retry}</Button></div>}
      </div>
      <form className="flex gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); void send(); }}>
        <input aria-label="Ask Science Buddy" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000} placeholder={labels.placeholder} className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm" />
        <Button type="submit" size="icon" aria-label={labels.send} disabled={busy || input.trim().length < 2}><Send /></Button>
      </form>
    </section>}
    <Button size="icon" className="h-12 w-12 rounded-full shadow-button" aria-label={open ? labels.hide : labels.open} title={labels.title} onClick={() => setOpen(!open)}><MessageCircle /></Button>
  </div>;
}