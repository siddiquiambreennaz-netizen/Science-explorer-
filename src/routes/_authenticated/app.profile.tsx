import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { GraduationCap, Loader2, Mail, Presentation, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, btnCls, cardCls, studentNav, teacherNav } from "@/components/AppShell";
import { Mascot, type MascotState } from "@/components/Mascot";
import { useMe } from "@/lib/use-me";
import { sendTestEmail } from "@/lib/classroom.functions";
import { DICT, LANGS, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const LANG_KEY = "sciex-lang";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — SCIENCE EXPLORER" },
      { name: "description", content: "Your account, language preference and classrooms." },
      { property: "og:title", content: "Profile & Settings — SCIENCE EXPLORER" },
      { property: "og:description", content: "Your account, language preference and classrooms." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const [mascot, setMascot] = useState<MascotState>("idle");
  const [lang, setLang] = useState<Lang>(() => {
    const v = typeof window !== "undefined" ? window.localStorage.getItem(LANG_KEY) : null;
    return LANGS.some((l) => l.id === v) ? (v as Lang) : "en";
  });

  const classrooms = useQuery({
    queryKey: ["classrooms", role, user.id],
    enabled: !!role,
    queryFn: async () => {
      if (role === "teacher") {
        const { data, error } = await supabase.from("classrooms").select("id,name,subject,code").eq("teacher_id", user.id);
        if (error) throw error;
        return data.map((c) => ({ id: c.id, name: c.name, subject: c.subject }));
      }
      const { data, error } = await supabase.from("classroom_members").select("classrooms(id,name,subject)").eq("student_id", user.id);
      if (error) throw error;
      return (data ?? []).map((m) => m.classrooms).filter(Boolean) as { id: string; name: string; subject: string }[];
    },
  });

  const pickLang = (l: Lang) => {
    setLang(l);
    window.localStorage.setItem(LANG_KEY, l);
  };

  return (
    <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
      <div className="mx-auto max-w-2xl space-y-6">
        <section className={cn(cardCls, "flex flex-col items-center gap-4 text-center")}>
          <Mascot state={mascot} className="w-28" />
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">{me.data?.name || "My Profile"}</h1>
            <p className="break-all text-sm text-muted-foreground">{user.email}</p>
            <span className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", role === "student" ? "bg-student-soft text-student" : "bg-teacher-soft text-teacher")}>
              {role === "student" ? <GraduationCap className="h-3.5 w-3.5" /> : <Presentation className="h-3.5 w-3.5" />}
              {role === "student" ? "Student account" : "Teacher account"}
            </span>
          </div>
        </section>

        <section className={cn(cardCls, "space-y-3")}>
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground"><User className="h-5 w-5 text-primary" /> Language preference</h2>
          <p className="text-sm text-muted-foreground">Used for the welcome and sign-in screens. Full translated content arrives with future updates.</p>
          <div className="grid grid-cols-2 gap-2">
            {LANGS.map((l) => (
              <button
                key={l.id} onClick={() => pickLang(l.id)}
                className={cn(
                  "rounded-2xl border-2 px-4 py-3 text-start transition",
                  lang === l.id ? "border-primary bg-secondary shadow-soft" : "border-input bg-background/70 hover:border-primary/60",
                )}
              >
                <span className="block font-bold text-foreground" dir={l.rtl ? "rtl" : "ltr"}>{l.label}</span>
                <span className="block text-xs text-muted-foreground" dir="ltr">{l.sub}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Preview: {DICT[lang].startGuide} · {DICT[lang].continue} · {DICT[lang].back}</p>
        </section>

        <section className={cn(cardCls, "space-y-3")}>
          <h2 className="font-display text-xl font-extrabold text-foreground">{role === "teacher" ? "My classrooms" : "Joined classrooms"}</h2>
          {(classrooms.data?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">No classrooms yet.</p>}
          {classrooms.data?.map((c) => (
            <div key={c.id} className="rounded-2xl border-2 border-input bg-background/70 px-4 py-3">
              <span className="font-bold text-foreground">{c.name}</span>
              {c.subject && <span className="ml-2 text-sm text-muted-foreground">{c.subject}</span>}
            </div>
          ))}
        </section>

        <section className={cn(cardCls, "space-y-3")}>
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground"><Mail className="h-5 w-5 text-primary" /> Email delivery check</h2>
          <p className="text-sm text-muted-foreground">Send yourself a real test email through the connected email service.</p>
          <TestEmail onResult={(s) => { setMascot(s); setTimeout(() => setMascot("idle"), 1600); }} />
        </section>
      </div>
    </AppShell>
  );
}

function TestEmail({ onResult }: { onResult: (s: MascotState) => void }) {
  const send = useServerFn(sendTestEmail);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="space-y-2">
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true); setMsg(null);
          try {
            const r = await send();
            setMsg(r.ok ? { ok: true, text: `Test email sent to ${r.to}. Check your inbox (and spam).` } : { ok: false, text: r.error });
            onResult(r.ok ? "happy" : "sad");
          } catch {
            setMsg({ ok: false, text: "Couldn't reach the email service." });
            onResult("sad");
          }
          setBusy(false);
        }}
        className={cn(btnCls, "bg-secondary text-secondary-foreground")}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Send me a test email
      </button>
      {msg && <p role="status" className={cn("text-sm font-semibold", msg.ok ? "text-success" : "text-destructive")}>{msg.text}</p>}
    </div>
  );
}
