import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Compass, Atom, LogOut, PanelLeftClose, PanelLeftOpen, Home, BookOpen, Sparkles, ScanLine, Gamepad2, Trophy, NotebookPen, CalendarDays, Users, UserRound, Download, Wifi, WifiOff, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FloatingTutor } from "@/components/FloatingTutor";
import { useLang } from "@/lib/lang-store";
import { LANGS, type Lang } from "@/lib/i18n";

export type NavItem = { to: string; label: string };

const icons = [Home, BookOpen, Compass, Sparkles, ScanLine, Gamepad2, Trophy, NotebookPen, CalendarDays, Trophy, Users, UserRound, Download];

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/** Shared signed-in layout: brand, role-aware nav, role badge and sign out. */
export function AppShell({ role, nav, children }: { role: "student" | "teacher" | null; nav: NavItem[]; children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return true;
    try { return window.localStorage.getItem("science-explorer-sidebar-collapsed") !== "false"; }
    catch { return true; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = role === "teacher" ? teacherNav : nav;
  const [lang, setLang] = useLang();
  useEffect(() => {
    try { window.localStorage.setItem("science-explorer-sidebar-collapsed", String(collapsed)); } catch { /* keep the current session preference */ }
  }, [collapsed]);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onInstall);
    };
  }, []);
  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <div className="min-h-screen">
      {mobileOpen && <div className="fixed inset-0 z-40 bg-foreground/20 md:hidden" onClick={() => setMobileOpen(false)} />}
      <aside aria-label="Primary navigation" className={cn("fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-popover/95 p-3 backdrop-blur-xl transition-[width,transform]", collapsed ? "md:w-20" : "md:w-60", mobileOpen ? "w-60 translate-x-0" : "w-60 -translate-x-full md:translate-x-0")}>
        <div className="mb-6 flex min-h-12 items-center gap-2 px-2 font-display font-extrabold text-primary"><Atom className="h-6 w-6 shrink-0" />{!collapsed && <span>SCIENCE EXPLORER</span>}</div>
        <nav className="scrollbar-soft flex-1 space-y-1 overflow-y-auto overscroll-contain">
          {items.map((n) => {
            const Icon = icons[studentNav.findIndex((item) => item.to === n.to)] ?? BookOpen;
            return <Link key={n.to} to={n.to} title={n.label} onClick={() => setMobileOpen(false)} activeOptions={{ exact: n.to === "/app" }} activeProps={{ className: "bg-primary text-primary-foreground shadow-button" }} inactiveProps={{ className: "text-muted-foreground hover:bg-secondary" }} className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition"><Icon className="h-5 w-5 shrink-0" />{!collapsed && n.label}</Link>;
          })}
        </nav>
        <Button variant="ghost" onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} title={collapsed ? "Expand navigation" : "Collapse navigation"} className="mt-4 rounded-full">{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}{!collapsed && <span className="hidden md:inline">Collapse</span>}</Button>
      </aside>
      <main className={cn("min-w-0 px-4 py-5 pb-24 transition-[margin] sm:px-6 sm:py-8 sm:pb-24", collapsed ? "md:ml-20" : "md:ml-60")}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between gap-3">
          <Button variant="secondary" size="icon" className="rounded-full" aria-label="Toggle navigation" title="Toggle navigation" onClick={() => { if (window.matchMedia("(min-width: 768px)").matches) setCollapsed(!collapsed); else setMobileOpen(!mobileOpen); }}><PanelLeftOpen /></Button>
          <Link to="/app" className="flex items-center gap-2 font-display text-lg font-extrabold text-primary" dir="ltr">
            <Atom className="h-5 w-5" /> SCIENCE EXPLORER
          </Link>
          <div className="flex items-center gap-2">
            <span title={online ? "Online" : "Offline"} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-2 text-[11px] font-extrabold sm:px-2.5", online ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700")}>{online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}<span className="hidden sm:inline">{online ? "Online" : "Offline"}</span></span>
            {installPrompt && <><Button variant="outline" size="icon" aria-label="Install Science Explorer" title="Install Science Explorer" className="rounded-full sm:hidden" onClick={() => void installApp()}><Smartphone className="h-4 w-4" /></Button><Button variant="outline" size="sm" className="hidden rounded-full sm:inline-flex" onClick={() => void installApp()}><Smartphone className="h-4 w-4" /> Install</Button></>}
            <select aria-label="Learning language" value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="h-10 rounded-full border border-input bg-card px-3 text-xs font-bold">
              {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            {role && (
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold", role === "student" ? "bg-student-soft text-student" : "bg-teacher-soft text-teacher")}>
                {role === "student" ? "Student" : "Teacher"}
              </span>
            )}
            <Button onClick={signOut} variant="secondary" className="rounded-full" aria-label="Sign out">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>
        {children}
      </div>
      </main>
      {role === "student" && pathname !== "/app/tutor" && <FloatingTutor page={items.find((n) => pathname.startsWith(n.to) && n.to !== "/app")?.label ?? "Science learning"} />}
    </div>
  );
}

export const studentNav: NavItem[] = [
  { to: "/app", label: "Home" },
  { to: "/app/sciences", label: "All Sciences" },
  { to: "/app/explore", label: "Explore" },
  { to: "/app/tutor", label: "AI Tutor" },
  { to: "/app/scanner", label: "Scanner" },
  { to: "/app/games", label: "Games" },
  { to: "/app/progress", label: "My Learning" },
  { to: "/app/notebook", label: "Notebook" },
  { to: "/app/planner", label: "Planner" },
  { to: "/app/tournaments", label: "Tournaments" },
  { to: "/app/classrooms", label: "Classroom" },
  { to: "/app/profile", label: "Profile" },
  { to: "/app/downloads", label: "My Downloads" },
];

export const teacherNav: NavItem[] = [
  { to: "/app", label: "Home" },
  { to: "/app/tutor", label: "AI Tutor" },
  { to: "/app/profile", label: "Profile" },
  { to: "/app/downloads", label: "My Downloads" },
];

export const cardCls = "glass rounded-[2rem] p-6";
export const inputCls = "h-12 w-full rounded-2xl border-2 border-input bg-background/70 px-4 outline-none transition focus:border-primary";
export const btnCls = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-bold transition disabled:opacity-60";
