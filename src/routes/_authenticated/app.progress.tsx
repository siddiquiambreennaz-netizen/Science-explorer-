import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, BookOpen, Flame, FlaskConical, Loader2, Lock, Medal, Star, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, btnCls, cardCls, studentNav } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { levelFromXp, streakFrom, xpFrom } from "@/lib/gamification";
import { useMe } from "@/lib/use-me";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/progress")({
  head: () => ({
    meta: [
      { title: "My Learning — SCIENCE EXPLORER" },
      { name: "description", content: "Your XP, level, streak, badges and completed science topics." },
      { property: "og:title", content: "My Learning — SCIENCE EXPLORER" },
      { property: "og:description", content: "Your XP, level, streak, badges and completed topics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;

  const results = useQuery({
    queryKey: ["quiz-results", "all", user.id],
    enabled: role === "student",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("id,score,total,created_at,quizzes(title)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const topics = useQuery({
    queryKey: ["topic-progress", user.id],
    enabled: role === "student",
    queryFn: async () => {
      const { data, error } = await supabase.from("topic_progress").select("topic_slug,completed_at").eq("student_id", user.id);
      if (error) throw error;
      return data;
    },
  });

  if (role === "teacher") {
    return (
      <AppShell role={role} nav={studentNav}>
        <p className={cn(cardCls, "text-center text-muted-foreground")}>
          Learning progress is tracked for student accounts. Open a classroom from <Link to="/app" className="font-bold text-primary underline">Home</Link> to see your students' results.
        </p>
      </AppShell>
    );
  }

  const list = results.data ?? [];
  const topicsDone = topics.data?.length ?? 0;
  const xp = xpFrom(list, topicsDone);
  const lvl = levelFromXp(xp);
  const streak = streakFrom([...list.map((r) => r.created_at), ...(topics.data ?? []).map((t) => t.completed_at)]);
  const quizzesTaken = list.length;
  const avg = quizzesTaken ? Math.round((list.reduce((s, r) => s + r.score / r.total, 0) / quizzesTaken) * 100) : 0;

  const badges = [
    { icon: Star, name: "First Steps", desc: "Complete your first quiz", earned: quizzesTaken >= 1 },
    { icon: Medal, name: "Perfect Score", desc: "Score 100% on any quiz", earned: list.some((r) => r.score === r.total) },
    { icon: BookOpen, name: "Topic Explorer", desc: "Complete 3 learning topics", earned: topicsDone >= 3 },
    { icon: FlaskConical, name: "Lab Regular", desc: "Take 5 quizzes", earned: quizzesTaken >= 5 },
    { icon: Flame, name: "On Fire", desc: "Keep a 3-day learning streak", earned: streak >= 3 },
    { icon: Trophy, name: "Point Collector", desc: "Earn 200 XP", earned: xp >= 200 },
    { icon: Award, name: "Science Star", desc: "Average 80% or more over 3+ quizzes", earned: quizzesTaken >= 3 && avg >= 80 },
  ];

  const loading = me.isLoading || results.isLoading || topics.isLoading;

  return (
    <AppShell role={role} nav={studentNav}>
      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          <section className={cn(cardCls, "flex flex-col items-center gap-4 sm:flex-row sm:gap-8")}>
            <Mascot state={xp > 0 ? "happy" : "idle"} className="w-28 shrink-0 sm:w-36" />
            <div className="flex-1 text-center sm:text-start">
              <h1 className="font-display text-3xl font-extrabold text-foreground">My Learning</h1>
              <p className="mt-1 text-muted-foreground">Everything here comes from your real completed activities.</p>
              <div className="mt-4 max-w-md">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-primary">Level {lvl.level}</span>
                  <span className="text-muted-foreground">{lvl.intoLevel}/{lvl.needed} XP to next level</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${Math.max(4, lvl.pct)}%` }} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Total XP" value={String(xp)} />
                <Stat label="Day streak" value={String(streak)} />
                <Stat label="Quizzes" value={String(quizzesTaken)} />
                <Stat label="Topics done" value={String(topicsDone)} />
              </div>
            </div>
          </section>

          <section className={cn(cardCls, "space-y-4")}>
            <h2 className="font-display text-xl font-extrabold text-foreground">Badges</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((b) => (
                <div key={b.name} className={cn("flex items-start gap-3 rounded-2xl border-2 p-4", b.earned ? "border-success/40 bg-success/5" : "border-input bg-background/60 opacity-70")}>
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl", b.earned ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                    {b.earned ? <b.icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="font-bold text-foreground">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={cn(cardCls, "space-y-3")}>
            <h2 className="font-display text-xl font-extrabold text-foreground">Quiz history</h2>
            {list.length === 0 && (
              <div className="text-center">
                <p className="text-muted-foreground">You haven't taken a quiz yet.</p>
                <Link to="/app/sciences" className={cn(btnCls, "mt-3 bg-gradient-primary text-primary-foreground")}>Start learning</Link>
              </div>
            )}
            {list.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-input bg-background/70 px-4 py-3">
                <div>
                  <p className="font-bold text-foreground">{r.quizzes?.title ?? "Quiz"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <span className={cn("rounded-full px-3 py-1 text-sm font-bold", r.score / r.total >= 0.6 ? "bg-success/10 text-success" : "bg-warning/15 text-foreground")}>
                  {r.score}/{r.total}
                </span>
              </div>
            ))}
          </section>
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary px-3 py-3 text-center">
      <p className="font-display text-2xl font-extrabold text-secondary-foreground">{value}</p>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
    </div>
  );
}
