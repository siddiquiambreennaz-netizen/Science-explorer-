import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { AppShell, cardCls, inputCls, studentNav, teacherNav } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Mascot, type MascotState } from "@/components/Mascot";
import { useMe } from "@/lib/use-me";
import { askTutor, getAiOverview, testAiConnection, type AiOverview } from "@/lib/learn.functions";
import { TOPICS } from "@/data/topics";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-store";

export const Route = createFileRoute("/_authenticated/app/tutor")({
  head: () => ({
    meta: [
      { title: "AI Science Tutor — SCIENCE EXPLORER" },
      { name: "description", content: "Ask your AI science buddy questions and get simple explanations." },
      { property: "og:title", content: "AI Science Tutor — SCIENCE EXPLORER" },
      { property: "og:description", content: "Ask your AI science buddy questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TutorPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain photosynthesis in simple words",
  "Why is the sky blue?",
  "What is the difference between an atom and a molecule?",
  "Why does ice float on water?",
  "Give me a fun science fact",
];

function TutorPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const ask = useServerFn(askTutor);
  const loadOverview = useServerFn(getAiOverview);
  const testConnection = useServerFn(testAiConnection);
  const [lang] = useLang();

  const [overview, setOverview] = useState<AiOverview | null>(null);
  const [overviewError, setOverviewError] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ ok: boolean; elapsedMs: number; message: string } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [mascot, setMascot] = useState<MascotState>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void loadOverview({ data: {} }).then((value) => { if (active) setOverview(value); }).catch(() => { if (active) setOverviewError(true); });
    return () => { active = false; };
  }, []); // load once when opening the tutor

  const runConnectionTest = async () => {
    if (testingConnection) return;
    setTestingConnection(true); setConnectionResult(null);
    try {
      const result = await testConnection({ data: {} });
      setConnectionResult({ ok: result.ok, elapsedMs: result.elapsedMs, message: result.ok ? "Live request succeeded." : result.error });
    } catch {
      setConnectionResult({ ok: false, elapsedMs: 0, message: "Could not run the AI test. Check the server log and key configuration." });
    } finally { setTestingConnection(false); }
  };

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setMascot("thinking");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    try {
      const r = await ask({
        data: {
          question,
          lang,
          ...(topic ? { topic } : {}),
          history: next.slice(-5, -1).map((m) => ({ role: m.role, content: m.content.slice(0, 700) })),
        },
      });
      if (r.ok) {
        setMessages([...next, { role: "assistant", content: r.answer }]);
        setMascot("happy");
        setTimeout(() => setMascot("idle"), 1500);
      } else {
        setMessages([...next, { role: "assistant", content: `⚠️ ${r.error}` }]);
        setMascot("sad");
        setTimeout(() => setMascot("idle"), 1800);
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "⚠️ Could not reach the tutor. Check your connection and try again." }]);
      setMascot("sad");
      setTimeout(() => setMascot("idle"), 1800);
    }
    setBusy(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
  };

  return (
    <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="flex items-center gap-4">
          <Mascot state={mascot} className="w-20 shrink-0 sm:w-24" />
          <div>
            <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold text-foreground">
              AI Science Tutor <Sparkles className="h-6 w-6 text-accent-foreground" />
            </h1>
            <p className="text-sm text-muted-foreground">Ask in English, Urdu, Roman Urdu or Sindhi. I will follow the language you use.</p>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="topic" className="text-sm font-bold text-muted-foreground">Topic (optional):</label>
          <select
            id="topic" value={topic} onChange={(e) => setTopic(e.target.value)}
            className="h-10 rounded-full border-2 border-input bg-background/70 px-4 text-sm font-semibold outline-none focus:border-primary"
          >
            <option value="">Any science topic</option>
            {TOPICS.map((t) => <option key={t.slug} value={t.title}>{t.subject}: {t.title}</option>)}
          </select>
        </div>

        <section className={cn(cardCls, "space-y-3")} aria-label="AI Overview">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-display text-lg font-extrabold">AI Overview</h2><p className="text-xs text-muted-foreground">Live diagnostics for the tutor and voice setup.</p></div>
            <Button onClick={() => void runConnectionTest()} disabled={testingConnection} variant="outline" className="rounded-full">
              {testingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {testingConnection ? "Testing…" : "Test live AI response"}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background/60 p-3"><p className="text-xs text-muted-foreground">AI provider</p><p className="mt-1 font-bold">{overviewError ? "Status unavailable" : overview?.provider ?? "Checking…"}</p><p className={cn("mt-1 text-xs font-semibold", overview?.providerKeyConfigured ? "text-emerald-600" : "text-amber-600")}>{overview?.providerKeyConfigured ? "Key detected · live test below" : overview ? "Server key missing — copy .env.example to .env" : "Checking configuration"}</p></div>
            <div className="rounded-2xl border border-border bg-background/60 p-3"><p className="text-xs text-muted-foreground">Gemini models</p><p className="mt-1 break-all text-sm font-bold">{overview?.primaryModel ?? "Checking…"}</p><p className="mt-1 break-all text-xs text-muted-foreground">Fallback: {overview?.fallbackModel ?? "Checking…"}</p></div>
            <div className="rounded-2xl border border-border bg-background/60 p-3"><p className="text-xs text-muted-foreground">ElevenLabs voice</p><p className="mt-1 font-bold">{overview?.elevenLabsKeyConfigured ? "Key detected" : overview ? "Not configured" : "Checking…"}</p><p className="mt-1 text-xs text-muted-foreground">Use Listen on an answer to test speech authentication and voice access.</p></div>
          </div>
          {connectionResult && <p role="status" className={cn("rounded-2xl p-3 text-sm font-semibold", connectionResult.ok ? "bg-emerald-500/10 text-emerald-700" : "bg-destructive/10 text-destructive")}>{connectionResult.ok ? `✅ ${connectionResult.message} Response time: ${connectionResult.elapsedMs} ms.` : `⚠️ ${connectionResult.message}${connectionResult.elapsedMs ? ` (after ${connectionResult.elapsedMs} ms)` : ""}`}</p>}
          {overviewError && <p role="alert" className="text-xs text-destructive">AI configuration status could not be loaded. Copy .env.example to a real .env file beside package.json, add the real server-side API key, restart npm run dev, then test again.</p>}
          <p className="text-xs text-muted-foreground">The model setting is configuration only; “connected” is shown only when the live test passes. API keys are never displayed here.</p>
        </section>

        <section className={cn(cardCls, "flex min-h-[320px] flex-col gap-3")}>
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <p className="max-w-sm text-muted-foreground">Hi! I'm your AI buddy. Ask me a science question, or try one of these:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s} onClick={() => void send(s)} disabled={busy}
                    className="rounded-full border-2 border-input bg-background/70 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/60"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed",
                m.role === "user" ? "self-end bg-primary text-primary-foreground" : "self-start bg-secondary text-secondary-foreground",
              )}
            >
              {m.content}
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 self-start rounded-3xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </section>

        <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="flex gap-2">
          <input
            aria-label="Ask a science question" placeholder="Ask me anything about science…" value={input}
            onChange={(e) => setInput(e.target.value)} className={cn(inputCls, "flex-1")} maxLength={1000}
          />
          <button
            type="submit" disabled={busy || input.trim().length < 2} aria-label="Send question"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-button transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
