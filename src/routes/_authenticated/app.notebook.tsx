import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, btnCls, cardCls, inputCls, studentNav } from "@/components/AppShell";
import { Mascot, type MascotState } from "@/components/Mascot";
import { TOPICS } from "@/data/topics";
import { useMe } from "@/lib/use-me";
import { cn } from "@/lib/utils";
import { saveOfflinePack } from "@/lib/offline-downloads";
import { Download, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/notebook")({
  head: () => ({
    meta: [
      { title: "Science Notebook — SCIENCE EXPLORER" },
      { name: "description", content: "Your personal science notebook — save notes, ideas and explanations." },
      { property: "og:title", content: "Science Notebook — SCIENCE EXPLORER" },
      { property: "og:description", content: "Your personal science notebook." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotebookPage,
});

type Note = { id: string; title: string; body: string; topic_slug: string | null; updated_at: string };

function NotebookPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const qc = useQueryClient();
  const [mascot, setMascot] = useState<MascotState>("idle");
  const flash = (s: MascotState) => { setMascot(s); setTimeout(() => setMascot("idle"), 1500); };

  const notes = useQuery({
    queryKey: ["notebook", user.id],
    enabled: role === "student",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notebook_notes")
        .select("id,title,body,topic_slug,updated_at")
        .eq("student_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Note[];
    },
  });

  const [editing, setEditing] = useState<Note | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [offlineSaved, setOfflineSaved] = useState<Record<string, boolean>>({});

  const openNew = () => { setEditing("new"); setTitle(""); setBody(""); setTopic(""); setErr(""); };
  const openEdit = (n: Note) => { setEditing(n); setTitle(n.title); setBody(n.body); setTopic(n.topic_slug ?? ""); setErr(""); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) { setErr("Give your note a title."); flash("sad"); return; }
    setBusy(true); setErr("");
    const row = { title: title.trim(), body: body.trim(), topic_slug: topic || null, updated_at: new Date().toISOString() };
    const { error } = editing === "new"
      ? await supabase.from("notebook_notes").insert({ ...row, student_id: user.id })
      : await supabase.from("notebook_notes").update(row).eq("id", (editing as Note).id);
    setBusy(false);
    if (error) { setErr("Couldn't save the note. Please try again."); flash("sad"); return; }
    setEditing(null); flash("happy");
    qc.invalidateQueries({ queryKey: ["notebook", user.id] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("notebook_notes").delete().eq("id", id);
    if (error) { flash("sad"); return; }
    flash("happy");
    qc.invalidateQueries({ queryKey: ["notebook", user.id] });
  };

  if (role === "teacher") {
    return (
      <AppShell role={role} nav={studentNav}>
        <p className={cn(cardCls, "text-center text-muted-foreground")}>The notebook is a student feature.</p>
      </AppShell>
    );
  }

  return (
    <AppShell role={role} nav={studentNav}>
      <div className="space-y-6">
        <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
          <Mascot state={mascot} className="w-24 shrink-0" />
          <div className="flex-1">
            <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">My Science Notebook</h1>
            <p className="mt-1 text-muted-foreground">Save explanations, ideas and things you want to remember. Only you can see your notes.</p>
          </div>
          <button onClick={openNew} className={cn(btnCls, "bg-gradient-primary text-primary-foreground")}>
            <Plus className="h-4 w-4" /> New note
          </button>
        </header>

        {editing !== null && (
          <form onSubmit={save} className={cn(cardCls, "space-y-3")}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold text-foreground">{editing === "new" ? "New note" : "Edit note"}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Cancel" className="rounded-full p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <input aria-label="Note title" placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            <select aria-label="Related topic (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} className={inputCls}>
              <option value="">No topic link</option>
              {TOPICS.map((t) => <option key={t.slug} value={t.slug}>{t.subject} — {t.title}</option>)}
            </select>
            <textarea aria-label="Note text" placeholder="Write what you learned…" value={body} onChange={(e) => setBody(e.target.value)} rows={5}
              className="w-full rounded-2xl border-2 border-input bg-background/70 p-4 outline-none transition focus:border-primary" />
            {err && <p role="alert" className="text-sm font-semibold text-destructive">{err}</p>}
            <button disabled={busy} className={cn(btnCls, "bg-gradient-primary text-primary-foreground")}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save note
            </button>
          </form>
        )}

        {notes.isLoading && <div className="grid place-items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
        {notes.data?.length === 0 && editing === null && (
          <p className={cn(cardCls, "text-center text-muted-foreground")}>Your notebook is empty — write your first note!</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.data?.map((n) => (
            <article key={n.id} className={cn(cardCls, "flex flex-col gap-2")}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-extrabold text-foreground">{n.title}</h3>
                <span className="flex gap-1">
                  <button onClick={() => openEdit(n)} aria-label={`Edit ${n.title}`} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(n.id)} aria-label={`Delete ${n.title}`} className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </span>
              </div>
              {n.topic_slug && (
                <span className="w-fit rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
                  {TOPICS.find((t) => t.slug === n.topic_slug)?.title ?? n.topic_slug}
                </span>
              )}
              <p className="flex-1 whitespace-pre-wrap text-sm text-muted-foreground">{n.body || "—"}</p>
              <p className="text-xs text-muted-foreground">Edited {new Date(n.updated_at).toLocaleDateString()}</p>
              <button type="button" onClick={async () => { try { await saveOfflinePack({ id: `note-${n.id}`, title: n.title, subject: "My Notebook", icon: "📝", theme: "from-slate-950 via-indigo-950 to-cyan-950", description: "Personal note saved for offline reading", story: n.body, objective: "Read your saved personal learning note anywhere, even without internet.", facts: n.body.split(/\n+/).filter(Boolean), lessonSections: [{ title: n.title, body: n.body }], questions: [], contentType: "note", savedAt: Date.now() }); setOfflineSaved((v) => ({ ...v, [n.id]: true })); } catch { setErr("Could not save this note offline. Check device storage."); } }} className="mt-2 inline-flex items-center gap-2 self-start rounded-full border px-3 py-2 text-xs font-bold hover:bg-secondary">{offlineSaved[n.id] ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Download className="h-4 w-4" />}{offlineSaved[n.id] ? "Saved offline" : "Save for offline"}</button>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
