import { createFileRoute, Link, notFound, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, btnCls, cardCls, studentNav, teacherNav } from "@/components/AppShell";
import { Mascot, type MascotState } from "@/components/Mascot";
import { useMe } from "@/lib/use-me";
import { findTopic } from "@/data/topics";
import { findCompound } from "@/data/compounds";
import { markTopicComplete } from "@/lib/learn.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/topic/$slug")({
  loader: ({ params }) => {
    const topic = findTopic(params.slug);
    if (!topic) throw notFound();
    return { topic };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.topic.title ?? "Topic"} — SCIENCE EXPLORER` },
      { name: "description", content: loaderData?.topic.description ?? "Science learning topic." },
      { property: "og:title", content: `${loaderData?.topic.title ?? "Topic"} — SCIENCE EXPLORER` },
      { property: "og:description", content: loaderData?.topic.description ?? "Science learning topic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TopicPage,
});

function TopicPage() {
  const { topic } = Route.useLoaderData();
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const qc = useQueryClient();
  const mark = useServerFn(markTopicComplete);
  const [mascot, setMascot] = useState<MascotState>("idle");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const progress = useQuery({
    queryKey: ["topic-progress-slugs", user.id],
    enabled: role === "student",
    queryFn: async () => {
      const { data, error } = await supabase.from("topic_progress").select("topic_slug").eq("student_id", user.id);
      if (error) throw error;
      return data.map((r) => r.topic_slug);
    },
  });
  const done = progress.data?.includes(topic.slug) ?? false;

  const complete = async () => {
    setBusy(true); setErr(""); setMascot("thinking");
    try {
      const r = await mark({ data: { topicSlug: topic.slug } });
      if (r.ok) {
        setMascot("celebrating");
        setTimeout(() => setMascot("idle"), 1600);
        qc.invalidateQueries({ queryKey: ["topic-progress-slugs", user.id] });
      } else {
        setErr(r.error); setMascot("sad"); setTimeout(() => setMascot("idle"), 1600);
      }
    } catch {
      setErr("Could not save your progress. Please try again.");
      setMascot("sad"); setTimeout(() => setMascot("idle"), 1600);
    }
    setBusy(false);
  };

  return (
    <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
      <div className="space-y-6">
        <Link to="/app/explore" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Explore
        </Link>

        <section className={cn(cardCls, "flex flex-col items-center gap-4 sm:flex-row sm:gap-8")}>
          <Mascot state={mascot} className="w-28 shrink-0 sm:w-36" />
          <div className="text-center sm:text-start">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{topic.subject}</p>
            <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">{topic.title}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">{topic.description}</p>
            <Link to="/app/lesson" search={{ subject: topic.subject, topic: topic.title, grade: 9, level: "beginner" }} className={cn(btnCls, "mt-4 bg-gradient-primary text-primary-foreground")}><Play className="h-4 w-4" /> Start full interactive lesson</Link>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={cn(cardCls, "space-y-3")}>
            <h2 className="font-display text-xl font-extrabold text-foreground">What you will learn</h2>
            <ul className="space-y-2">
              {topic.objectives.map((o) => (
                <li key={o} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {o}
                </li>
              ))}
            </ul>
            {role === "student" && (
              <div className="pt-2">
                {done ? (
                  <p className="flex items-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-sm font-bold text-success">
                    <Check className="h-4 w-4" /> Topic completed — great work!
                  </p>
                ) : (
                  <button onClick={complete} disabled={busy} className={cn(btnCls, "w-full bg-gradient-primary text-primary-foreground")}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Mark as completed
                  </button>
                )}
                {err && <p role="alert" className="mt-2 text-sm font-semibold text-destructive">{err}</p>}
              </div>
            )}
          </section>

          <div className="space-y-6">
            {topic.compounds.length > 0 && (
              <section className={cn(cardCls, "space-y-3")}>
                <h2 className="font-display text-xl font-extrabold text-foreground">Related compounds</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {topic.compounds.map((slug) => {
                    const c = findCompound(slug);
                    if (!c) return null;
                    return (
                      <Link
                        key={slug} to="/app/compounds" search={{ c: slug }}
                        className="flex items-center justify-between gap-2 rounded-2xl border-2 border-input bg-background/70 px-4 py-3 transition hover:border-primary/60"
                      >
                        <span className="font-bold text-foreground">{c.name}</span>
                        <span className="font-mono text-sm font-bold text-primary">{c.formula}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {topic.quizId && (
              <section className={cn(cardCls, "space-y-3")}>
                <h2 className="font-display text-xl font-extrabold text-foreground">Test yourself</h2>
                <p className="text-sm text-muted-foreground">Take the quiz for this topic and earn points.</p>
                <Link to="/app/quiz/$quizId" params={{ quizId: topic.quizId }} className={cn(btnCls, "w-full bg-student text-primary-foreground")}>
                  <Play className="h-4 w-4" /> Start quiz <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
