import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, Check, CheckCircle2, Circle, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, btnCls, cardCls, inputCls, studentNav } from "@/components/AppShell";
import { Mascot, type MascotState } from "@/components/Mascot";
import { SUBJECTS } from "@/data/topics";
import { useMe } from "@/lib/use-me";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/planner")({
  head: () => ({
    meta: [
      { title: "Study Planner — SCIENCE EXPLORER" },
      { name: "description", content: "Plan your science study sessions and tick them off." },
      { property: "og:title", content: "Study Planner — SCIENCE EXPLORER" },
      { property: "og:description", content: "Plan your science study sessions and tick them off." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlannerPage,
});

type Task = { id: string; title: string; subject: string; due_date: string | null; done: boolean };

function PlannerPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const qc = useQueryClient();
  const [mascot, setMascot] = useState<MascotState>("idle");
  const flash = (s: MascotState) => { setMascot(s); setTimeout(() => setMascot("idle"), 1500); };

  const tasks = useQuery({
    queryKey: ["planner", user.id],
    enabled: role === "student",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planner_tasks")
        .select("id,title,subject,due_date,done")
        .eq("student_id", user.id)
        .order("done")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) { setErr("Describe what you plan to study."); flash("sad"); return; }
    setBusy(true); setErr("");
    const { error } = await supabase.from("planner_tasks").insert({
      student_id: user.id, title: title.trim(), subject, due_date: due || null,
    });
    setBusy(false);
    if (error) { setErr("Couldn't add the task. Please try again."); flash("sad"); return; }
    setTitle(""); setDue(""); flash("happy");
    qc.invalidateQueries({ queryKey: ["planner", user.id] });
  };

  const toggle = async (t: Task) => {
    const { error } = await supabase.from("planner_tasks").update({ done: !t.done }).eq("id", t.id);
    if (error) { flash("sad"); return; }
    if (!t.done) flash("celebrating");
    qc.invalidateQueries({ queryKey: ["planner", user.id] });
  };

  const remove = async (id: string) => {
    await supabase.from("planner_tasks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["planner", user.id] });
  };

  if (role === "teacher") {
    return (
      <AppShell role={role} nav={studentNav}>
        <p className={cn(cardCls, "text-center text-muted-foreground")}>The study planner is a student feature.</p>
      </AppShell>
    );
  }

  const list = tasks.data ?? [];
  const open = list.filter((t) => !t.done);
  const done = list.filter((t) => t.done);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell role={role} nav={studentNav}>
      <div className="space-y-6">
        <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
          <Mascot state={mascot} className="w-24 shrink-0" />
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">Smart Study Planner</h1>
            <p className="mt-1 text-muted-foreground">Plan what to study and when — ticking tasks off keeps your momentum going.</p>
          </div>
        </header>

        <form onSubmit={add} className={cn(cardCls, "grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr_auto]")}>
          <input aria-label="Study task" placeholder="e.g. Revise photosynthesis" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          <select aria-label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls}>
            <option value="">Any subject</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input aria-label="Due date" type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputCls} />
          <button disabled={busy} className={cn(btnCls, "bg-gradient-primary text-primary-foreground")}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
          </button>
          {err && <p role="alert" className="text-sm font-semibold text-destructive sm:col-span-4">{err}</p>}
        </form>

        <section className={cn(cardCls, "space-y-3")}>
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground">
            <CalendarDays className="h-5 w-5 text-primary" /> Up next ({open.length})
          </h2>
          {open.length === 0 && <p className="text-sm text-muted-foreground">Nothing planned — add your first study task above.</p>}
          {open.map((t) => (
            <TaskRow key={t.id} t={t} today={today} onToggle={toggle} onRemove={remove} />
          ))}
        </section>

        {done.length > 0 && (
          <section className={cn(cardCls, "space-y-3")}>
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground">
              <Check className="h-5 w-5 text-success" /> Done ({done.length})
            </h2>
            {done.map((t) => (
              <TaskRow key={t.id} t={t} today={today} onToggle={toggle} onRemove={remove} />
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}

function TaskRow({ t, today, onToggle, onRemove }: { t: Task; today: string; onToggle: (t: Task) => void; onRemove: (id: string) => void }) {
  const overdue = !t.done && t.due_date !== null && t.due_date < today;
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-input bg-background/70 px-4 py-3">
      <button onClick={() => onToggle(t)} aria-label={t.done ? `Mark ${t.title} as not done` : `Mark ${t.title} as done`}
        className="shrink-0 text-primary">
        {t.done ? <CheckCircle2 className="h-6 w-6 text-success" /> : <Circle className="h-6 w-6" />}
      </button>
      <div className="flex-1">
        <p className={cn("font-bold", t.done ? "text-muted-foreground line-through" : "text-foreground")}>{t.title}</p>
        <p className="text-xs text-muted-foreground">
          {t.subject || "Any subject"}
          {t.due_date && <> · due {new Date(`${t.due_date}T00:00:00`).toLocaleDateString()}</>}
          {overdue && <span className="ml-1 font-bold text-destructive">(overdue)</span>}
        </p>
      </div>
      <button onClick={() => onRemove(t.id)} aria-label={`Delete ${t.title}`} className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
