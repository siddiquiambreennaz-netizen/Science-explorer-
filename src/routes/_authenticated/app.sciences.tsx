import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Atom, Check, Dna, Globe, Search, Zap } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, cardCls, inputCls, studentNav, teacherNav } from "@/components/AppShell";
import { useMe } from "@/lib/use-me";
import { SUBJECTS, TOPICS } from "@/data/topics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/sciences")({
  head: () => ({
    meta: [
      { title: "All Sciences — SCIENCE EXPLORER" },
      { name: "description", content: "Physics, Chemistry, Biology and Earth & Space — pick a subject and start learning." },
      { property: "og:title", content: "All Sciences — SCIENCE EXPLORER" },
      { property: "og:description", content: "Physics, Chemistry, Biology and Earth & Space topics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SciencesPage,
});

const SUBJECT_META: Record<(typeof SUBJECTS)[number], { icon: typeof Atom; tint: string; blurb: string }> = {
  Chemistry: { icon: Atom, tint: "bg-student-soft text-student", blurb: "Atoms, molecules and reactions" },
  Physics: { icon: Zap, tint: "bg-teacher-soft text-teacher", blurb: "Forces, energy and motion" },
  Biology: { icon: Dna, tint: "bg-success/10 text-success", blurb: "Cells, plants and life" },
  "Earth & Space": { icon: Globe, tint: "bg-accent text-accent-foreground", blurb: "Planets, weather and climate" },
};

function SciencesPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const [q, setQ] = useState("");

  const progress = useQuery({
    queryKey: ["topic-progress-slugs", user.id],
    enabled: role === "student",
    queryFn: async () => {
      const { data, error } = await supabase.from("topic_progress").select("topic_slug").eq("student_id", user.id);
      if (error) throw error;
      return data.map((r) => r.topic_slug);
    },
  });

  const needle = q.trim().toLowerCase();
  const matches = (t: (typeof TOPICS)[number]) =>
    !needle || t.title.toLowerCase().includes(needle) || t.description.toLowerCase().includes(needle);

  return (
    <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
      <div className="space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">All Sciences</h1>
            <p className="mt-1 text-muted-foreground">Choose a science, pick a topic, learn it, then quiz yourself.</p>
          </div>
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input aria-label="Search topics" placeholder="Search topics…" value={q} onChange={(e) => setQ(e.target.value)} className={cn(inputCls, "pl-12")} />
          </div>
        </header>

        {/* Subject entry points */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUBJECTS.map((s) => {
            const meta = SUBJECT_META[s];
            const count = TOPICS.filter((t) => t.subject === s).length;
            const doneCount = TOPICS.filter((t) => t.subject === s && progress.data?.includes(t.slug)).length;
            return (
              <a key={s} href={`#subject-${s.replace(/[^a-z]/gi, "")}`}
                className={cn(cardCls, "flex flex-col gap-3 transition hover:-translate-y-1")}>
                <span className={cn("grid h-12 w-12 place-items-center rounded-2xl", meta.tint)}><meta.icon className="h-6 w-6" /></span>
                <span className="font-display text-xl font-extrabold text-foreground">{s}</span>
                <span className="text-sm text-muted-foreground">{meta.blurb}</span>
                <span className="text-xs font-bold text-primary">{doneCount}/{count} topics completed</span>
              </a>
            );
          })}
        </section>

        {/* Topics grouped by subject */}
        {SUBJECTS.map((s) => {
          const topics = TOPICS.filter((t) => t.subject === s && matches(t));
          if (topics.length === 0) return null;
          const meta = SUBJECT_META[s];
          return (
            <section key={s} id={`subject-${s.replace(/[^a-z]/gi, "")}`} className="space-y-4 scroll-mt-24">
              <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold text-foreground">
                <span className={cn("grid h-9 w-9 place-items-center rounded-xl", meta.tint)}><meta.icon className="h-5 w-5" /></span>
                {s}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topics.map((t) => {
                  const done = progress.data?.includes(t.slug);
                  return (
                    <Link key={t.slug} to="/app/topic/$slug" params={{ slug: t.slug }}
                      className={cn(cardCls, "flex flex-col gap-3 transition hover:-translate-y-1")}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.subject}</p>
                        {done && (
                          <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                            <Check className="h-3.5 w-3.5" /> Completed
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-xl font-extrabold text-foreground">{t.title}</h3>
                      <p className="flex-1 text-sm text-muted-foreground">{t.description}</p>
                      <span className="flex items-center gap-1 text-sm font-bold text-primary">
                        Start learning <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        <p className="text-center text-sm text-muted-foreground">
          Looking for molecules like H₂O or CO₂? Open the <Link to="/app/compounds" className="font-bold text-primary underline">Compound Explorer</Link>.
        </p>
      </div>
    </AppShell>
  );
}
