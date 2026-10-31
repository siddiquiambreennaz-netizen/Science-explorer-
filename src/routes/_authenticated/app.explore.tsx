import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, Atom, Check, Dna, Globe, Search, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, cardCls, inputCls, studentNav, teacherNav } from "@/components/AppShell";
import { useMe } from "@/lib/use-me";
import { SUBJECTS, TOPICS } from "@/data/topics";
import { cn } from "@/lib/utils";
import { LessonLauncher } from "@/components/LessonLauncher";

export const Route = createFileRoute("/_authenticated/app/explore")({
  head: () => ({
    meta: [
      { title: "Explore Science — SCIENCE EXPLORER" },
      { name: "description", content: "Browse Chemistry, Physics and Biology topics with learning objectives." },
      { property: "og:title", content: "Explore Science — SCIENCE EXPLORER" },
      { property: "og:description", content: "Browse Chemistry, Physics and Biology topics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExplorePage,
});

const SUBJECT_ICON: Record<(typeof SUBJECTS)[number], typeof Atom> = { Chemistry: Atom, Physics: Zap, Biology: Dna, "Earth & Space": Globe };

function ExplorePage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<string | null>(null);

  const progress = useQuery({
    queryKey: ["topic-progress-slugs", user.id],
    enabled: role === "student",
    queryFn: async () => {
      const { data, error } = await supabase.from("topic_progress").select("topic_slug").eq("student_id", user.id);
      if (error) throw error;
      return data.map((r) => r.topic_slug);
    },
  });

  const topics = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return TOPICS.filter(
      (t) =>
        (!subject || t.subject === subject) &&
        (!needle || t.title.toLowerCase().includes(needle) || t.description.toLowerCase().includes(needle)),
    );
  }, [q, subject]);

  return (
    <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">Explore Science</h1>
          <p className="mt-1 text-muted-foreground">Pick a topic, learn the key ideas, then test yourself with a quiz.</p>
        </header>
        <LessonLauncher />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label="Search topics" placeholder="Search topics…" value={q}
              onChange={(e) => setQ(e.target.value)} className={cn(inputCls, "pl-12")}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSubject(null)}
              className={cn("rounded-full px-4 py-2 text-sm font-bold transition", !subject ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}
            >
              All
            </button>
            {SUBJECTS.map((s) => (
              <button
                key={s} onClick={() => setSubject(subject === s ? null : s)}
                className={cn("rounded-full px-4 py-2 text-sm font-bold transition", subject === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {topics.length === 0 && (
          <p className={cn(cardCls, "text-center text-muted-foreground")}>No topics match your search. Try a different word.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => {
            const Icon = SUBJECT_ICON[t.subject];
            const done = progress.data?.includes(t.slug);
            return (
              <Link
                key={t.slug} to="/app/topic/$slug" params={{ slug: t.slug }}
                className={cn(cardCls, "flex flex-col gap-3 transition hover:-translate-y-1")}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "grid h-11 w-11 place-items-center rounded-2xl",
                    t.subject === "Chemistry" && "bg-student-soft text-student",
                    t.subject === "Physics" && "bg-teacher-soft text-teacher",
                    t.subject === "Biology" && "bg-success/10 text-success",
                  )}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {done && (
                    <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                      <Check className="h-3.5 w-3.5" /> Completed
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.subject}</p>
                  <h2 className="font-display text-xl font-extrabold text-foreground">{t.title}</h2>
                </div>
                <p className="flex-1 text-sm text-muted-foreground">{t.description}</p>
                <span className="flex items-center gap-1 text-sm font-bold text-primary">
                  Start learning <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
