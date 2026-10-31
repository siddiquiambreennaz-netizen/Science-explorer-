import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Mascot, type MascotState } from "@/components/Mascot";
import { AppShell, btnCls, cardCls, inputCls, studentNav, teacherNav } from "@/components/AppShell";
import { joinClassroom } from "@/lib/classroom.functions";
import { PENDING_JOIN_KEY } from "@/lib/pending-join";
import { cn } from "@/lib/utils";
import { useMe } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/app/classrooms")({
  head: () => ({
    meta: [
      { title: "My Classroom — SCIENCE EXPLORER" },
      { name: "description", content: "Join your teacher's classroom and see your quiz assignments." },
      { property: "og:title", content: "My Classroom — SCIENCE EXPLORER" },
      { property: "og:description", content: "Join your teacher's classroom and see your quiz assignments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClassroomsPage,
});

function ClassroomsPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const qc = useQueryClient();
  const join = useServerFn(joinClassroom);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [mascot, setMascot] = useState<MascotState>("idle");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const flash = (s: MascotState) => { setMascot(s); setTimeout(() => setMascot("idle"), 1600); };

  const classrooms = useQuery({
    queryKey: ["classrooms", "student", user.id],
    enabled: role === "student",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classroom_members")
        .select("joined_at, classrooms(id,name,subject)")
        .eq("student_id", user.id);
      if (error) throw error;
      return data;
    },
  });
  const joinedIds = (classrooms.data ?? []).map((m) => m.classrooms?.id).filter(Boolean) as string[];
  const assignments = useQuery({
    queryKey: ["assignments", "student", joinedIds.join(",")],
    enabled: role === "student" && joinedIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_assignments")
        .select("quiz_id,assigned_at,quizzes(id,title,subject),classrooms(name)")
        .in("classroom_id", joinedIds);
      if (error) throw error;
      return data;
    },
  });

  const doJoin = async (v: string) => {
    if (!/^[A-Za-z0-9]{6}$/.test(v)) {
      setMsg({ ok: false, text: "Classroom codes are 6 letters or numbers, e.g. ABC123." });
      flash("sad");
      return;
    }
    setBusy(true); setMsg(null);
    try {
      const r = await join({ data: { code: v } });
      if (r.ok) {
        setMsg({ ok: true, text: `You joined ${r.classroomName}!` });
        flash("celebrating"); setCode("");
        qc.invalidateQueries({ queryKey: ["classrooms", "student", user.id] });
      } else {
        setMsg({
          ok: false,
          text:
            r.reason === "invalid_code"
              ? "That code doesn't match any classroom. Check it with your teacher."
              : r.reason === "not_student"
                ? "Only student accounts can join classrooms."
                : "Something went wrong. Please try again.",
        });
        flash("sad");
      }
    } catch {
      setMsg({ ok: false, text: "Something went wrong. Please try again." });
      flash("sad");
    }
    setBusy(false);
  };
  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_JOIN_KEY);
    if (pending) { sessionStorage.removeItem(PENDING_JOIN_KEY); setCode(pending); void doJoin(pending); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (role === "teacher") {
    return (
      <AppShell role={role} nav={teacherNav}>
        <p className={cn(cardCls, "text-center text-muted-foreground")}>
          This page is for students. Manage your classrooms from <Link to="/app" className="font-bold text-primary underline">Home</Link>.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell role={role} nav={studentNav}>
      <div className="space-y-6">
        <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
          <Mascot state={mascot} className="w-24 shrink-0" />
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">My Classroom</h1>
            <p className="mt-1 text-muted-foreground">Join your teacher's classroom and complete the quizzes they assign.</p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={(e) => { e.preventDefault(); void doJoin(code.trim()); }} className={cn(cardCls, "h-fit space-y-3")}>
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground">
              <GraduationCap className="h-5 w-5 text-student" /> Join your classroom
            </h2>
            <p className="text-sm text-muted-foreground">Enter the code from your teacher, or open their invitation link.</p>
            <input
              aria-label="Classroom code" placeholder="ABC123" value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              className={cn(inputCls, "font-mono tracking-widest")}
            />
            <button disabled={busy} className={cn(btnCls, "w-full bg-gradient-primary text-primary-foreground")}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Join Classroom
            </button>
            {msg && <p role="status" className={cn("text-sm font-semibold", msg.ok ? "text-success" : "text-destructive")}>{msg.text}</p>}
            {(classrooms.data?.length ?? 0) > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-bold text-muted-foreground">My classrooms</h3>
                {classrooms.data!.map((m) => m.classrooms && (
                  <div key={m.classrooms.id} className="rounded-2xl border-2 border-input bg-background/70 px-4 py-2.5">
                    <span className="font-bold text-foreground">{m.classrooms.name}</span>
                    {m.classrooms.subject && <span className="ml-2 text-sm text-muted-foreground">{m.classrooms.subject}</span>}
                  </div>
                ))}
              </div>
            )}
          </form>

          <section className={cn(cardCls, "h-fit space-y-3")}>
            <h2 className="font-display text-xl font-extrabold text-foreground">Assigned by your teacher</h2>
            {joinedIds.length === 0 && <p className="text-sm text-muted-foreground">Join a classroom to receive quizzes from your teacher.</p>}
            {joinedIds.length > 0 && (assignments.data?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">No quizzes assigned yet.</p>
            )}
            {assignments.data?.map((a) => a.quizzes && (
              <div key={`${a.quiz_id}-${a.classrooms?.name ?? ""}`} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-input bg-background/70 px-4 py-3">
                <div>
                  <p className="font-bold text-foreground">{a.quizzes.title}</p>
                  <p className="text-xs text-muted-foreground">{a.quizzes.subject}{a.classrooms?.name ? ` · ${a.classrooms.name}` : ""}</p>
                </div>
                <Link to="/app/quiz/$quizId" params={{ quizId: a.quiz_id }} className={cn(btnCls, "min-h-9 bg-student px-4 text-sm text-primary-foreground")}>Start</Link>
              </div>
            ))}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
