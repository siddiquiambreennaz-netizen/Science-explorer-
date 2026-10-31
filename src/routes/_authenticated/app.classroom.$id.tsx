import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, CalendarCheck, Check, Copy, Loader2, Minus, Plus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, btnCls, cardCls, teacherNav } from "@/components/AppShell";
import { Mascot, type MascotState } from "@/components/Mascot";
import { useMe } from "@/lib/use-me";
import { assignQuiz, unassignQuiz } from "@/lib/learn.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/classroom/$id")({
  head: () => ({
    meta: [
      { title: "Classroom — SCIENCE EXPLORER" },
      { name: "description", content: "Manage your classroom, students and quiz assignments." },
      { property: "og:title", content: "Classroom — SCIENCE EXPLORER" },
      { property: "og:description", content: "Manage your classroom, students and quiz assignments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClassroomPage,
});

function ClassroomPage() {
  const { id } = Route.useParams();
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const qc = useQueryClient();
  const assign = useServerFn(assignQuiz);
  const unassign = useServerFn(unassignQuiz);
  const [mascot, setMascot] = useState<MascotState>("idle");
  const [copied, setCopied] = useState("");
  const [actErr, setActErr] = useState("");
  const [busyQuiz, setBusyQuiz] = useState<string | null>(null);
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [attBusy, setAttBusy] = useState<string | null>(null);
  const flash = (s: MascotState) => { setMascot(s); setTimeout(() => setMascot("idle"), 1600); };

  const classroom = useQuery({
    queryKey: ["classroom", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("classrooms").select("id,name,subject,code,teacher_id").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const students = useQuery({
    queryKey: ["classroom-students", id],
    enabled: !!classroom.data && classroom.data.teacher_id === user.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("classroom_students", { _classroom: id });
      if (error) throw error;
      return data;
    },
  });
  const quizzes = useQuery({
    queryKey: ["quizzes", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quizzes").select("id,title,subject,description").order("title");
      if (error) throw error;
      return data;
    },
  });
  const assignments = useQuery({
    queryKey: ["assignment-quiz-ids", "classroom", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("quiz_assignments").select("quiz_id,assigned_at").eq("classroom_id", id);
      if (error) throw error;
      return data.map((a) => a.quiz_id);
    },
  });
  const results = useQuery({
    queryKey: ["classroom-results", id],
    enabled: !!classroom.data && classroom.data.teacher_id === user.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("id,student_id,score,total,created_at,quizzes(title)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
  const attendance = useQuery({
    queryKey: ["attendance", id, day],
    enabled: !!classroom.data && classroom.data.teacher_id === user.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("student_id,present")
        .eq("classroom_id", id)
        .eq("day", day);
      if (error) throw error;
      return new Map(data.map((a) => [a.student_id, a.present]));
    },
  });

  if (classroom.isLoading || me.isLoading)
    return <main className="grid min-h-screen place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>;

  const c = classroom.data;
  const isOwner = !!c && c.teacher_id === user.id;

  const copy = async (v: string, k: string) => {
    await navigator.clipboard.writeText(v).catch(() => {});
    setCopied(k); setTimeout(() => setCopied(""), 1500);
  };
  const toggleAssign = async (quizId: string, assigned: boolean) => {
    setBusyQuiz(quizId); setActErr("");
    try {
      const r = assigned
        ? await unassign({ data: { classroomId: id, quizId } })
        : await assign({ data: { classroomId: id, quizId } });
      if (r.ok) {
        flash(assigned ? "idle" : "happy");
        qc.invalidateQueries({ queryKey: ["assignment-quiz-ids", "classroom", id] });
      } else {
        setActErr(r.error); flash("sad");
      }
    } catch {
      setActErr("Something went wrong. Please try again."); flash("sad");
    }
    setBusyQuiz(null);
  };

  const mark = async (studentId: string, present: boolean) => {
    setAttBusy(studentId); setActErr("");
    const { error } = await supabase
      .from("attendance")
      .upsert({ classroom_id: id, student_id: studentId, day, present }, { onConflict: "classroom_id,student_id,day" });
    setAttBusy(null);
    if (error) { setActErr("Couldn't save attendance. Please try again."); flash("sad"); return; }
    flash(present ? "happy" : "idle");
    qc.invalidateQueries({ queryKey: ["attendance", id, day] });
  };

  const nameOf = (sid: string) => students.data?.find((s) => s.student_id === sid)?.full_name || "A student";
  // Only results from students who are members of THIS classroom.
  const memberIds = new Set((students.data ?? []).map((s) => s.student_id));
  const classResults = (results.data ?? []).filter((r) => memberIds.has(r.student_id));
  // Per-student average across their quizzes (learning insight for the teacher).
  const avgOf = (sid: string) => {
    const mine = classResults.filter((r) => r.student_id === sid);
    if (!mine.length) return null;
    return Math.round((mine.reduce((s, r) => s + r.score / r.total, 0) / mine.length) * 100);
  };

  return (
    <AppShell role={role} nav={teacherNav}>
      {!c || !isOwner ? (
        <p className={cn(cardCls, "text-center text-destructive")}>Classroom not found, or you don't have access to it.</p>
      ) : (
        <div className="space-y-6">
          <Link to="/app" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <section className={cn(cardCls, "flex flex-col items-center gap-4 sm:flex-row sm:gap-8")}>
            <Mascot state={mascot} className="w-24 shrink-0 sm:w-32" />
            <div className="flex-1 text-center sm:text-start">
              <h1 className="font-display text-3xl font-extrabold text-foreground">{c.name}</h1>
              {c.subject && <p className="mt-1 text-muted-foreground">{c.subject}</p>}
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <button onClick={() => copy(c.code, "code")} className={cn(btnCls, "min-h-9 bg-secondary text-sm text-secondary-foreground")}>
                  {copied === "code" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Code: <span className="font-mono">{c.code}</span>
                </button>
                <button onClick={() => copy(`${window.location.origin}/join/${c.code}`, "link")} className={cn(btnCls, "min-h-9 bg-secondary text-sm text-secondary-foreground")}>
                  {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy invite link
                </button>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Students */}
            <section className={cn(cardCls, "space-y-3")}>
              <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground">
                <Users className="h-5 w-5 text-teacher" /> Students ({students.data?.length ?? 0})
              </h2>
              {(students.data?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">No students have joined yet. Share the code or invite link above.</p>
              )}
              {students.data?.map((s) => {
                const avg = avgOf(s.student_id);
                return (
                  <div key={s.student_id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-input bg-background/70 px-4 py-3">
                    <div>
                      <span className="font-bold text-foreground">{s.full_name || "Student"}</span>
                      <span className="ml-2 text-xs text-muted-foreground">Joined {new Date(s.joined_at).toLocaleDateString()}</span>
                    </div>
                    {avg !== null && (
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", avg >= 60 ? "bg-success/10 text-success" : "bg-warning/15 text-foreground")}>
                        avg {avg}%
                      </span>
                    )}
                  </div>
                );
              })}
            </section>

            {/* Assign quizzes */}
            <section className={cn(cardCls, "space-y-3")}>
              <h2 className="font-display text-xl font-extrabold text-foreground">Assign a quiz</h2>
              <p className="text-sm text-muted-foreground">Assigned quizzes appear on your students' dashboards.</p>
              {actErr && <p role="alert" className="text-sm font-semibold text-destructive">{actErr}</p>}
              {quizzes.data?.map((qz) => {
                const assigned = assignments.data?.includes(qz.id) ?? false;
                return (
                  <div key={qz.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-input bg-background/70 px-4 py-3">
                    <div>
                      <p className="font-bold text-foreground">{qz.title}</p>
                      <p className="text-xs text-muted-foreground">{qz.subject}</p>
                    </div>
                    <button
                      onClick={() => void toggleAssign(qz.id, assigned)} disabled={busyQuiz === qz.id}
                      className={cn(btnCls, "min-h-9 px-4 text-sm", assigned ? "bg-destructive/10 text-destructive" : "bg-teacher text-primary-foreground")}
                    >
                      {busyQuiz === qz.id ? <Loader2 className="h-4 w-4 animate-spin" /> : assigned ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {assigned ? "Remove" : "Assign"}
                    </button>
                  </div>
                );
              })}
            </section>
          </div>

          {/* Attendance register */}
          <section className={cn(cardCls, "space-y-3")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground">
                <CalendarCheck className="h-5 w-5 text-teacher" /> Attendance register
              </h2>
              <input
                type="date" aria-label="Attendance date" value={day} onChange={(e) => setDay(e.target.value)}
                className="h-10 rounded-xl border-2 border-input bg-background/70 px-3 text-sm font-bold outline-none focus:border-primary"
              />
            </div>
            {(students.data?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">Students appear here once they join your classroom.</p>
            )}
            {students.data?.map((s) => {
              const present = attendance.data?.get(s.student_id);
              return (
                <div key={s.student_id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-input bg-background/70 px-4 py-3">
                  <span className="font-bold text-foreground">{s.full_name || "Student"}</span>
                  <div className="flex gap-2">
                    {attBusy === s.student_id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <>
                        <button
                          onClick={() => void mark(s.student_id, true)}
                          aria-pressed={present === true}
                          className={cn("rounded-full px-3.5 py-1.5 text-sm font-bold transition", present === true ? "bg-success text-primary-foreground" : "bg-secondary text-secondary-foreground")}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => void mark(s.student_id, false)}
                          aria-pressed={present === false}
                          className={cn("rounded-full px-3.5 py-1.5 text-sm font-bold transition", present === false ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground")}
                        >
                          Absent
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Results */}
          <section className={cn(cardCls, "space-y-3")}>
            <h2 className="font-display text-xl font-extrabold text-foreground">Student quiz results</h2>
            {classResults.length === 0 && (
              <p className="text-sm text-muted-foreground">No quiz results yet. Results appear here when your students complete quizzes.</p>
            )}
            {classResults.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-input bg-background/70 px-4 py-3">
                <div>
                  <p className="font-bold text-foreground">{nameOf(r.student_id)}</p>
                  <p className="text-xs text-muted-foreground">{r.quizzes?.title ?? "Quiz"} · {new Date(r.created_at).toLocaleString()}</p>
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
