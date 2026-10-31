import { readLang, saveLang } from "@/lib/lang-store";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Atom, Check, Eye, EyeOff, GraduationCap,
  Loader2, Mail, Lock, User, Presentation, AlertCircle, Info, Sparkles,
} from "lucide-react";
import { Mascot, type MascotState } from "@/components/Mascot";
import { DICT, LANGS, isEmail, type Lang, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type Screen = "welcome" | "language" | "role" | "auth" | "verify";
type Role = "student" | "teacher";
const PREV: Record<Screen, Screen | null> = { welcome: null, language: "welcome", role: "language", auth: "role", verify: "auth" };
const SLEEP_AFTER_MS = 45_000;

/* ---------- shared UI ---------- */
function Btn({ children, variant = "primary", className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "ghost" }) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-gradient-primary text-primary-foreground shadow-button hover:-translate-y-0.5 hover:brightness-105",
        variant === "soft" && "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        variant === "ghost" && "text-primary hover:bg-secondary/60",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success" | "warning"; children: ReactNode }) {
  const Icon = tone === "error" ? AlertCircle : tone === "success" ? Check : Info;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn(
      "flex items-start gap-2 rounded-2xl px-4 py-3 text-sm",
      tone === "info" && "bg-secondary text-secondary-foreground",
      tone === "error" && "bg-destructive/10 text-destructive",
      tone === "success" && "bg-success/10 text-success",
      tone === "warning" && "bg-warning/15 text-foreground",
    )}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" /> <div>{children}</div>
    </div>
  );
}

function Field({ id, label, icon, error, type = "text", value, onChange, right, placeholder, autoComplete }: {
  id: string; label: string; icon: ReactNode; error?: string | undefined; type?: string; value: string;
  onChange: (v: string) => void; right?: ReactNode; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-bold text-foreground">{label}</label>
      <div className={cn("flex items-center gap-2 rounded-2xl border-2 bg-background/70 px-4 transition focus-within:border-primary", error ? "border-destructive" : "border-input")}>
        <span className="text-muted-foreground">{icon}</span>
        <input id={id} type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
          className="h-12 w-full min-w-0 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/70" />
        {right}
      </div>
      {error && <p id={`${id}-err`} className="text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}

/* ---------- main flow ---------- */
export function Onboarding({ initial = "welcome" }: { initial?: Screen } = {}) {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>(initial);
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => setLangState(readLang()), []);
  const setLang = (l: Lang) => { setLangState(l); saveLang(l); };
  const [role, setRole] = useState<Role | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [mascot, setMascot] = useState<MascotState>("idle");
  const [busy, setBusy] = useState(false);
  const flash = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastActive = useRef(Date.now());

  const t = useCallback((k: TKey) => DICT[lang][k], [lang]);
  const rtl = LANGS.find((l) => l.id === lang)!.rtl;

  // Short reaction, then back to the normal expression.
  const react = useCallback((s: MascotState, ms = 1600) => {
    clearTimeout(flash.current);
    setMascot(s);
    flash.current = setTimeout(() => setMascot("idle"), ms);
  }, []);
  const go = (s: Screen) => { setScreen(s); window.scrollTo({ top: 0 }); };

  // Sleep after inactivity — never while a form is focused or a request is running.
  useEffect(() => {
    const wake = () => { lastActive.current = Date.now(); setMascot((m) => (m === "sleeping" ? "idle" : m)); };
    const evs = ["pointerdown", "keydown", "scroll", "pointermove"] as const;
    evs.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    const iv = setInterval(() => {
      const typing = document.activeElement instanceof HTMLInputElement;
      if (!busy && !typing && Date.now() - lastActive.current > SLEEP_AFTER_MS) setMascot((m) => (m === "idle" ? "sleeping" : m));
    }, 5000);
    return () => { evs.forEach((e) => window.removeEventListener(e, wake)); clearInterval(iv); };
  }, [busy]);

  const back = () => { const p = PREV[screen]; if (p) { setMascot("idle"); go(p); } };
  const ctx = { t, react, setMascot, busy, setBusy, go, role, lang };

  return (
    <main dir={rtl ? "rtl" : "ltr"} lang={lang === "roman" ? "ur-Latn" : lang} className="min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        {screen !== "welcome" && (
          <header className="mb-6 flex items-center justify-between gap-3">
            <Btn variant="ghost" onClick={back} className="px-3" aria-label={t("back")}>
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" /> <span className="hidden sm:inline">{t("back")}</span>
            </Btn>
            <div className="flex items-center gap-2 font-display text-lg font-extrabold text-primary" dir="ltr">
              <Atom className="h-5 w-5" /> SCIENCE EXPLORER
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{LANGS.find((l) => l.id === lang)!.label}</span>
              {role && ["auth", "verify"].includes(screen) && (
                <span className={cn("hidden rounded-full px-3 py-1 text-xs font-bold sm:inline", role === "student" ? "bg-student-soft text-student" : "bg-teacher-soft text-teacher")}>
                  {t(role)}
                </span>
              )}
            </div>
          </header>
        )}

        <div key={screen} className="screen-in">
          {screen === "welcome" && <Welcome {...ctx} mascot={mascot} />}
          {screen === "language" && <Language {...ctx} mascot={mascot} setLang={setLang} />}
          {screen === "role" && <RoleSelect {...ctx} mascot={mascot} setRole={setRole} />}
          {screen === "auth" && role && <Auth {...ctx} mascot={mascot} role={role} onNeedsVerify={(e) => { setPendingEmail(e); go("verify"); }} onSignedIn={() => navigate({ to: "/app" })} />}
          {screen === "verify" && <Verify {...ctx} mascot={mascot} email={pendingEmail} />}
        </div>
      </div>
    </main>
  );
}

type Ctx = {
  t: (k: TKey) => string; react: (s: MascotState, ms?: number) => void; setMascot: (s: MascotState) => void;
  busy: boolean; setBusy: (b: boolean) => void; go: (s: Screen) => void; mascot: MascotState; role: Role | null; lang: Lang;
};

/** Two-column layout: mascot in its own fixed box so it never overlaps content. */
function Split({ mascot, children, mascotSize = "w-40 sm:w-52 lg:w-72" }: { mascot: MascotState; children: ReactNode; mascotSize?: string }) {
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
      <div className="flex justify-center"><Mascot state={mascot} className={mascotSize} /></div>
      <div className="glass rounded-[2rem] p-6 sm:p-8">{children}</div>
    </div>
  );
}

function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-6 space-y-2">
      <h1 className="font-display text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">{children}</h1>
      {sub && <p className="text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ---------- screens ---------- */
function Welcome({ t, go, mascot }: Ctx) {
  return (
    <section className="flex min-h-[85vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-sm font-bold text-primary shadow-soft">
        <Sparkles className="h-4 w-4 text-accent-foreground" /> {t("tagline")}
      </div>
      <Mascot state={mascot} className="w-52 sm:w-64 md:w-72" />
      <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight text-primary sm:text-6xl" dir="ltr">
        SCIENCE EXPLORER
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">{t("intro")}</p>
      <Btn onClick={() => go("language")} className="min-h-14 px-10 text-lg">
        {t("startGuide")} <ArrowRight className="h-5 w-5 rtl:rotate-180" />
      </Btn>
    </section>
  );
}

function Language({ t, go, mascot, react, lang, setLang }: Ctx & { setLang: (l: Lang) => void }) {
  return (
    <Split mascot={mascot}>
      <Title sub={t("chooseLangSub")}>{t("chooseLang")}</Title>
      <div role="radiogroup" aria-label={t("chooseLang")} className="grid gap-3 sm:grid-cols-2">
        {LANGS.map((l) => {
          const on = l.id === lang;
          return (
            <button key={l.id} role="radio" aria-checked={on} onClick={() => { setLang(l.id); react("happy", 1000); }}
              className={cn("flex items-center justify-between gap-3 rounded-2xl border-2 bg-background/70 p-4 text-start transition hover:border-primary/60",
                on ? "border-primary bg-secondary shadow-soft" : "border-input")}>
              <span>
                <span className="block text-xl font-bold text-foreground" dir={l.rtl ? "rtl" : "ltr"}>{l.label}</span>
                <span className="block text-xs text-muted-foreground" dir="ltr">{l.sub}</span>
              </span>
              <span className={cn("grid h-7 w-7 place-items-center rounded-full border-2", on ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                {on && <Check className="h-4 w-4" />}
              </span>
            </button>
          );
        })}
      </div>
      <Btn onClick={() => go("role")} className="mt-6 w-full">{t("continue")} <ArrowRight className="h-5 w-5 rtl:rotate-180" /></Btn>
    </Split>
  );
}

function RoleSelect({ t, go, mascot, setRole }: Ctx & { setRole: (r: Role) => void }) {
  const cards: { r: Role; icon: ReactNode; desc: TKey }[] = [
    { r: "student", icon: <GraduationCap className="h-7 w-7" />, desc: "studentDesc" },
    { r: "teacher", icon: <Presentation className="h-7 w-7" />, desc: "teacherDesc" },
  ];
  return (
    <section>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Mascot state={mascot} className="w-28 sm:w-36" />
        <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">{t("roleTitle")}</h1>
        <p className="text-muted-foreground">{t("roleSub")}</p>
      </div>
      <div className="mx-auto grid max-w-3xl gap-4">
        {cards.map(({ r, icon, desc }) => (
          <button
            key={r}
            onClick={() => { setRole(r); go("auth"); }}
            className="glass group flex items-center gap-4 rounded-[2rem] p-5 text-start transition hover:-translate-y-0.5 sm:p-6"
          >
            <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl", r === "student" ? "bg-student-soft text-student" : "bg-teacher-soft text-teacher")}>{icon}</span>
            <span className="flex-1">
              <span className="block font-display text-2xl font-extrabold text-foreground">{t(r)}</span>
              <span className="block text-sm font-semibold text-muted-foreground">{t(desc)}</span>
            </span>
            <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full text-primary-foreground shadow-button transition group-hover:scale-110", r === "student" ? "bg-gradient-primary" : "bg-teacher")}>
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Auth({ t, mascot, react, setMascot, busy, setBusy, role, onNeedsVerify, onSignedIn }: Ctx & { role: Role; onNeedsVerify: (e: string) => void; onSignedIn: () => void }) {
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<Partial<Record<"name" | "email" | "pw", string>>>({});
  const [msg, setMsg] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null);
  const teacher = role === "teacher";
  const fail = (text: string) => { setMsg({ tone: "error", text }); react("sad", 1500); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    const n: Partial<Record<"name" | "email" | "pw", string>> = {};
    if (mode === "up" && name.trim().length < 2) n.name = t("errName");
    if (!email.trim()) n.email = t("errRequired"); else if (!isEmail(email)) n.email = t("errEmail");
    if (mode !== "forgot") { if (!pw) n.pw = t("errRequired"); else if (pw.length < 8) n.pw = t("errPassword"); }
    setErr(n);
    if (Object.keys(n).length) { react("sad", 1500); return; }
    const addr = email.trim();
    setBusy(true); setMascot("thinking");
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(addr, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) return fail(error.message);
        setMsg({ tone: "success", text: "If an account exists for this email, a password-reset link is on its way. Check your inbox and spam folder." });
        react("happy", 1400);
      } else if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email: addr, password: pw,
          options: { emailRedirectTo: `${window.location.origin}/app`, data: { role, full_name: name.trim() } },
        });
        if (error) return fail(error.message);
        if (data.user && data.user.identities?.length === 0) return fail("An account with this email already exists. Please sign in instead.");
        setPw(""); react("happy", 1400); onNeedsVerify(addr);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: addr, password: pw });
        if (error) {
          if (/not confirmed/i.test(error.message)) { setMascot("idle"); onNeedsVerify(addr); return; }
          return fail(/invalid login/i.test(error.message) ? "Email or password is incorrect." : error.message);
        }
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
        const actual = roles?.[0]?.role;
        if (actual && actual !== role) {
          await supabase.auth.signOut();
          return fail(`This is a ${actual} account. Go back and choose "${t(actual)}" to sign in.`);
        }
        setPw(""); react("happy", 1200); onSignedIn();
      }
    } catch { fail("Couldn't reach the server. Check your connection and try again."); }
    finally { setBusy(false); }
  };

  const accent = teacher ? "text-teacher" : "text-student";
  const switchMode = (m: typeof mode) => { setMode(m); setErr({}); setMsg(null); };
  return (
    <Split mascot={mascot}>
      <div className={cn("mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold", teacher ? "bg-teacher-soft text-teacher" : "bg-student-soft text-student")}>
        {teacher ? <Presentation className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />} {t("roleBadge")}: {t(role)}
      </div>
      <Title sub={`${t("buddyTag")} · ${t(role)}`}>
        {mode === "forgot" ? "Reset your password" : (
          <>Welcome to <span className="bg-gradient-primary bg-clip-text text-transparent" dir="ltr">SCIENCE EXPLORER</span></>
        )}
      </Title>
      {mode !== "forgot" && (
        <div role="tablist" className="mb-5 grid grid-cols-2 rounded-full bg-muted p-1">
          {(["in", "up"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
              className={cn("rounded-full py-2.5 text-sm font-bold transition", mode === m ? cn("bg-card shadow-soft", accent) : "text-muted-foreground")}>
              {t(m === "in" ? "signIn" : "createAccount")}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={submit} noValidate className="space-y-4">
        {mode === "up" && <Field id="name" label={t("fullName")} icon={<User className="h-5 w-5" />} value={name} onChange={setName} error={err.name} autoComplete="name" />}
        <Field id="email" type="email" label={t("email")} icon={<Mail className="h-5 w-5" />} value={email} onChange={setEmail} error={err.email} placeholder="name@school.edu" autoComplete="email" />
        {mode !== "forgot" && <Field id="pw" type={showPw ? "text" : "password"} label={t("password")} icon={<Lock className="h-5 w-5" />} value={pw} onChange={setPw} error={err.pw}
          autoComplete={mode === "up" ? "new-password" : "current-password"}
          right={<button type="button" onClick={() => setShowPw((s) => !s)} aria-label={t(showPw ? "hide" : "show")} className="rounded-full p-1 text-muted-foreground hover:text-primary">
            {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>} />}
        {mode === "in" && <button type="button" onClick={() => switchMode("forgot")} className={cn("text-sm font-bold underline", accent)}>Forgot password?</button>}
        <Btn type="submit" disabled={busy} className={cn("w-full", teacher && "bg-none bg-teacher")}>
          {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> {t("loading")}</> : mode === "forgot" ? "Send reset link" : t(mode === "in" ? "signIn" : "createAccount")}
        </Btn>
      </form>

      {msg && <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {mode === "forgot" ? <button onClick={() => switchMode("in")} className={cn("font-bold underline", accent)}>{t("back")} — {t("signIn")}</button> : <>
          {t(mode === "in" ? "noAccount" : "haveAccount")}{" "}
          <button onClick={() => switchMode(mode === "in" ? "up" : "in")} className={cn("font-bold underline", accent)}>{t(mode === "in" ? "createAccount" : "signIn")}</button>
        </>}
      </p>
    </Split>
  );
}

function Verify({ t, go, mascot, react, setMascot, busy, setBusy, email, role }: Ctx & { email: string }) {
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const resend = async () => {
    setBusy(true); setMascot("thinking"); setMsg(null);
    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/app` } });
    setBusy(false);
    if (error) { setMsg({ tone: "error", text: error.message }); react("sad"); }
    else { setMsg({ tone: "success", text: "A new verification email was sent." }); react("happy"); }
  };
  return (
    <Split mascot={mascot}>
      <div className={cn("mb-4 grid h-14 w-14 place-items-center rounded-2xl", role === "teacher" ? "bg-teacher-soft text-teacher" : "bg-student-soft text-student")}><Mail className="h-7 w-7" /></div>
      <Title sub="We sent a verification link to this address. Open it to activate your account — you'll be signed in automatically.">{t("verifyTitle")}</Title>
      {email && <p className="mb-5 break-all rounded-2xl bg-muted px-4 py-3 font-bold text-foreground" dir="ltr">{email}</p>}
      <div className="space-y-3">
        <Btn variant="soft" disabled={busy || !email} onClick={resend} className="w-full">
          {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> {t("loading")}</> : t("resend")}
        </Btn>
        <Btn variant="ghost" onClick={() => go("auth")} className="w-full">{t("verified")} — {t("signIn")}</Btn>
      </div>
      {msg && <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      <p className="mt-4 text-xs text-muted-foreground">Can't find it? Check your spam folder. Links expire after a while — use resend to get a fresh one.</p>
    </Split>
  );
}
