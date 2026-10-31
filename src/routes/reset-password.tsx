import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Mascot } from "@/components/Mascot";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — SCIENCE EXPLORER" },
      { name: "description", content: "Choose a new password for your SCIENCE EXPLORER account." },
      { property: "og:title", content: "Reset your password — SCIENCE EXPLORER" },
      { property: "og:description", content: "Set a new SCIENCE EXPLORER password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY") setReady(true); });
    supabase.auth.getSession().then(({ data: s }) => { if (s.session && isRecovery) setReady(true); else if (s.session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setErr("The two passwords don't match.");
    setBusy(true); setErr("");
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(error.message);
    setDone(true);
    setTimeout(() => navigate({ to: "/app" }), 1500);
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="glass w-full max-w-md rounded-[2rem] p-6 sm:p-8">
        <div className="mb-4 flex justify-center"><Mascot state={done ? "celebrating" : err ? "sad" : "idle"} className="w-28" /></div>
        <h1 className="mb-4 font-display text-3xl font-extrabold text-foreground">Set a new password</h1>
        {!ready ? (
          <p className="text-muted-foreground">Open this page from the password-reset link in your email. If the link has expired, request a new one from the sign-in page.</p>
        ) : done ? (
          <p role="status" className="rounded-2xl bg-success/10 px-4 py-3 font-semibold text-success">Password updated. Taking you to your classroom…</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {[["New password", pw, setPw], ["Repeat new password", pw2, setPw2]].map(([label, v, set], i) => (
              <label key={i} className="block space-y-1.5 text-sm font-bold text-foreground">
                {label as string}
                <span className="flex items-center gap-2 rounded-2xl border-2 border-input bg-background/70 px-4 focus-within:border-primary">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <input type="password" autoComplete="new-password" value={v as string} onChange={(e) => (set as (s: string) => void)(e.target.value)} className="h-12 w-full bg-transparent font-normal outline-none" />
                </span>
              </label>
            ))}
            {err && <p role="alert" className="text-sm font-semibold text-destructive">{err}</p>}
            <button disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-primary font-bold text-primary-foreground shadow-button disabled:opacity-60">
              {busy && <Loader2 className="h-5 w-5 animate-spin" />} Save new password
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
