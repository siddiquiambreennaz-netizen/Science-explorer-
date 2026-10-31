import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowRight, Atom, BookOpen, Check, CheckCircle2, Circle, Copy, FlaskConical,
  Flame, GraduationCap, Loader2, Presentation, ScanLine, Send, Sigma, Sparkles, Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Mascot, type MascotState } from "@/components/Mascot";
import { AppShell, btnCls, cardCls, inputCls, studentNav, teacherNav } from "@/components/AppShell";
import { sendClassInvite } from "@/lib/classroom.functions";
import { dailyQuests, levelFromXp, streakFrom, xpFrom } from "@/lib/gamification";
import { TOPICS } from "@/data/topics";
import { cn } from "@/lib/utils";
import { useMe } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Home — SCIENCE EXPLORER" },
      { name: "description", content: "Your SCIENCE EXPLORER learning home: quests, XP, science activities and classrooms." },
      { property: "og:title", content: "Home — SCIENCE EXPLORER" },
      { property: "og:description", content: "Your SCIENCE EXPLORER learning home." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppHome,
});

function AppHome() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const [mascot, setMascot] = useState<MascotState>("idle");
  const flash = (s: MascotState) => { setMascot(s); setTimeout(() => setMascot("idle"), 1600); };

  if (me.isLoading)
    return <main className="grid min-h-screen place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>;
  const role = me.data?.role ?? null;

  return (
    <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
      {role === "teacher" ? (
        <TeacherHome userId={user.id} name={me.data?.name ?? ""} mascot={mascot} flash={flash} />
      ) : role === "student" ? (
        <StudentHome userId={user.id} name={me.data?.name ?? ""} mascot={mascot} />
      ) : (
        <p className={cn(cardCls, "text-destructive")}>Your account has no role yet. Please contact support.</p>
      )}
    </AppShell>
  );
}

/* ---------------- Student home (gamified) ---------------- */

function StudentHome({ userId, name, mascot }: { userId: string; name: string; mascot: MascotState }) {
  const results = useQuery({
    queryKey: ["quiz-results", "all", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("id,score,total,created_at,quizzes(title)")
        .eq("student_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const topics = useQuery({
    queryKey: ["topic-progress", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("topic_progress").select("topic_slug,completed_at").eq("student_id", userId);
      if (error) throw error;
      return data;
    },
  });
  const classrooms = useQuery({
    queryKey: ["classrooms", "student", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("classroom_members").select("classrooms(id,name)").eq("student_id", userId);
      if (error) throw error;
      return data;
    },
  });

  const list = results.data ?? [];
  const doneSlugs = new Set((topics.data ?? []).map((t) => t.topic_slug));
  const xp = xpFrom(list, doneSlugs.size);
  const lvl = levelFromXp(xp);
  const streak = streakFrom([
    ...list.map((r) => r.created_at),
    ...(topics.data ?? []).map((t) => t.completed_at),
  ]);
  const quests = dailyQuests(list, topics.data ?? []);
  const nextTopic = TOPICS.find((t) => !doneSlugs.has(t.slug));
  const classCount = classrooms.data?.length ?? 0;

  const activities = [
    { to: "/app/sciences", icon: BookOpen, title: "All Sciences", desc: "Physics, Chemistry, Biology, Earth & Space", tint: "bg-student-soft text-student" },
    { to: "/app/games", icon: Atom, title: "Molecule Builder", desc: "Build H₂O, CO₂ and more", tint: "bg-teacher-soft text-teacher" },
    { to: "/app/games", icon: Sigma, title: "Formula Balancing", desc: "Balance equations, beat the clock", tint: "bg-accent text-accent-foreground" },
    { to: "/app/games", icon: FlaskConical, title: "Virtual Lab", desc: "Safe simulated experiments", tint: "bg-success/10 text-success" },
    { to: "/app/tutor", icon: Sparkles, title: "AI Science Tutor", desc: "Ask your robot buddy anything", tint: "bg-secondary text-secondary-foreground" },
    { to: "/app/scanner", icon: ScanLine, title: "Smart Scanner", desc: "Scan a diagram or equation", tint: "bg-warning/15 text-foreground" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero: welcome + mascot + streak + XP */}
      <section className={cn(cardCls, "flex flex-col items-center gap-4 sm:flex-row sm:gap-8")}>
        <Mascot state={mascot} className="w-32 shrink-0 sm:w-44" />
        <div className="flex-1 text-center sm:text-start">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="font-display text-3xl font-extrabold text-foreground">Hi{name ? `, ${name}` : ""}! 👋</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
              <Flame className="h-3.5 w-3.5" /> {streak} day streak
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">Ready to explore science today?</p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-primary">Level {lvl.level}</span>
              <span className="text-muted-foreground">{lvl.intoLevel}/{lvl.needed} XP</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={lvl.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Level progress">
              <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${Math.max(4, lvl.pct)}%` }} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            {nextTopic ? (
              <Link to="/app/topic/$slug" params={{ slug: nextTopic.slug }} className={cn(btnCls, "bg-gradient-primary text-primary-foreground shadow-button")}>
                Continue Learning <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link to="/app/sciences" className={cn(btnCls, "bg-gradient-primary text-primary-foreground shadow-button")}>
                Explore All Sciences <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link to="/app/tutor" className={cn(btnCls, "bg-secondary text-secondary-foreground")}>Ask the AI Tutor</Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Science activities */}
        <section className="grid content-start gap-4 sm:grid-cols-2">
          {activities.map((t) => (
            <Link key={t.title} to={t.to} className={cn(cardCls, "group flex flex-col gap-3 transition hover:-translate-y-1")}>
              <span className={cn("grid h-12 w-12 place-items-center rounded-2xl", t.tint)}><t.icon className="h-6 w-6" /></span>
              <span className="font-display text-lg font-extrabold text-foreground">{t.title}</span>
              <span className="text-sm text-muted-foreground">{t.desc}</span>
            </Link>
          ))}
        </section>

        <div className="space-y-6">
          {/* Daily quests */}
          <section className={cn(cardCls, "space-y-3")}>
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground">
              <Trophy className="h-5 w-5 text-accent-foreground" /> Daily quests
            </h2>
            {quests.map((q) => (
              <div key={q.id} className="flex items-center gap-3 rounded-2xl border-2 border-input bg-background/70 px-4 py-3">
                {q.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" /> : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
                <span className={cn("flex-1 text-sm font-bold", q.done ? "text-muted-foreground line-through" : "text-foreground")}>{q.label}</span>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">+{q.reward} XP</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Quests reset every day and are checked against your real activity.</p>
          </section>

          {/* Classroom teaser */}
          <section className={cn(cardCls, "space-y-3")}>
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground">
              <GraduationCap className="h-5 w-5 text-student" /> My classroom
            </h2>
            <p className="text-sm text-muted-foreground">
              {classCount > 0
                ? `You're in ${classCount} classroom${classCount === 1 ? "" : "s"}. See assignments from your teacher.`
                : "Join your teacher's classroom with a code or invitation link to get assignments."}
            </p>
            <Link to="/app/classrooms" className={cn(btnCls, "w-full bg-student text-primary-foreground")}>
              {classCount > 0 ? "Open classroom" : "Join a classroom"} <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          {/* Recent activity */}
          <section className={cn(cardCls, "space-y-3")}>
            <h2 className="font-display text-xl font-extrabold text-foreground">Recent activity</h2>
            {list.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet — take your first quiz in <Link to="/app/sciences" className="font-bold text-primary underline">All Sciences</Link>!</p>
            )}
            {list.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-input bg-background/70 px-4 py-3">
                <div>
                  <p className="font-bold text-foreground">{r.quizzes?.title ?? "Quiz"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <span className={cn("rounded-full px-3 py-1 text-sm font-bold", r.score / r.total >= 0.6 ? "bg-success/10 text-success" : "bg-warning/15 text-foreground")}>
                  {r.score}/{r.total}
                </span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Teacher dashboard ---------------- */

type Classroom = { id: string; name: string; subject: string; code: string; teacher_id: string };

function TeacherHome({ userId, name, mascot, flash }: { userId: string; name: string; mascot: MascotState; flash: (s: MascotState) => void }) {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["classrooms", "teacher", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classrooms")
        .select("id,name,subject,code,teacher_id,classroom_members(count)")
        .eq("teacher_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Classroom & { classroom_members: { count: number }[] })[];
    },
  });
  const [cName, setCName] = useState("");
  const [subject, setSubject] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cName.trim().length < 2) { setErr("Please enter a classroom name."); flash("sad"); return; }
    setBusy(true); setErr("");
    const { error } = await supabase.from("classrooms").insert({ teacher_id: userId, name: cName.trim(), subject: subject.trim(), code: "" });
    setBusy(false);
    if (error) { setErr(error.message); flash("sad"); return; }
    setCName(""); setSubject(""); flash("celebrating");
    qc.invalidateQueries({ queryKey: ["classrooms", "teacher", userId] });
  };

  return (
    <div className="space-y-6">
      <section className={cn(cardCls, "flex flex-col items-center gap-4 sm:flex-row sm:gap-8")}>
        <Mascot state={mascot} className="w-32 shrink-0 sm:w-44" />
        <div className="flex-1 text-center sm:text-start">
          <h1 className="font-display text-3xl font-extrabold text-foreground">Welcome{name ? `, ${name}` : ""}!</h1>
          <p className="mt-1 text-muted-foreground">Create classrooms, invite students and follow their science progress.</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <form onSubmit={create} className={cn(cardCls, "h-fit space-y-3")}>
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground">
            <Presentation className="h-5 w-5 text-teacher" /> Create a classroom
          </h2>
          <input aria-label="Classroom name" placeholder="Class 8 — Science" value={cName} onChange={(e) => setCName(e.target.value)} className={inputCls} />
          <input aria-label="Subject (optional)" placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
          {err && <p role="alert" className="text-sm font-semibold text-destructive">{err}</p>}
          <button disabled={busy} className={cn(btnCls, "w-full bg-teacher text-primary-foreground")}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create Classroom
          </button>
        </form>

        <div className="space-y-4">
          {list.data?.length === 0 && <p className="text-center text-muted-foreground">No classrooms yet — create your first one.</p>}
          {list.data?.map((c) => <ClassCard key={c.id} c={c} students={c.classroom_members[0]?.count ?? 0} flash={flash} />)}
        </div>
      </div>
    </div>
  );
}

function ClassCard({ c, students, flash }: { c: Classroom; students: number; flash: (s: MascotState) => void }) {
  const invite = useServerFn(sendClassInvite);
  const link = `${window.location.origin}/join/${c.code}`;
  const [copied, setCopied] = useState("");
  const [emails, setEmails] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const copy = async (v: string, k: string) => {
    await navigator.clipboard.writeText(v).catch(() => {});
    setCopied(k); setTimeout(() => setCopied(""), 1500);
  };
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const list = emails.split(/[\s,;]+/).filter(Boolean);
    if (!list.length || list.some((x) => !/^\S+@\S+\.\S+$/.test(x))) {
      setMsg({ ok: false, text: "Enter one or more valid email addresses." }); flash("sad"); return;
    }
    setBusy(true); setMsg(null);
    try {
      const r = await invite({ data: { classroomId: c.id, emails: list.slice(0, 20) } });
      setMsg(r.ok ? { ok: true, text: `Invitation sent to ${list.length} address${list.length > 1 ? "es" : ""}.` } : { ok: false, text: r.error });
      flash(r.ok ? "happy" : "sad");
      if (r.ok) setEmails("");
    } catch { setMsg({ ok: false, text: "Couldn't send the invitation." }); flash("sad"); }
    setBusy(false);
  };
  const Row = ({ label, value, k }: { label: string; value: string; k: string }) => (
    <div className="flex items-center gap-2 rounded-2xl border-2 border-input bg-background/70 p-2 ps-4">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      <span className="flex-1 truncate font-mono font-bold text-foreground">{value}</span>
      <button type="button" onClick={() => copy(value, k)} className={cn(btnCls, "min-h-9 bg-secondary px-3 text-sm text-secondary-foreground")}>
        {copied === k ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied === k ? "Copied" : "Copy"}
      </button>
    </div>
  );
  return (
    <div className={cn(cardCls, "space-y-3")}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-xl font-extrabold text-foreground">{c.name}</h3>
        <span className="text-sm text-muted-foreground">{students} student{students === 1 ? "" : "s"}</span>
      </div>
      {c.subject && <p className="text-sm text-muted-foreground">{c.subject}</p>}
      <Row label="Code" value={c.code} k="code" />
      <Row label="Link" value={link} k="link" />
      <form onSubmit={send} className="flex flex-col gap-2 sm:flex-row">
        <input aria-label="Student emails" placeholder="student@email.com, …" value={emails} onChange={(e) => setEmails(e.target.value)} className={inputCls} />
        <button disabled={busy} className={cn(btnCls, "bg-teacher text-primary-foreground")}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Email invite
        </button>
      </form>
      {msg && <p role="status" className={cn("text-sm font-semibold", msg.ok ? "text-success" : "text-destructive")}>{msg.text}</p>}
      <Link to="/app/classroom/$id" params={{ id: c.id }} className={cn(btnCls, "w-full bg-secondary text-secondary-foreground")}>
        Open classroom <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
