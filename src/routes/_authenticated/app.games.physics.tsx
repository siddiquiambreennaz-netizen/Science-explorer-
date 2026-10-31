import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Magnet, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { AppShell, studentNav, teacherNav } from "@/components/AppShell";
import { PhysicsPlaylab } from "@/components/games/PhysicsPlaylab";
import { MagnetExplorer } from "@/components/games/MagnetExplorer";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/use-me";
import { supabase } from "@/integrations/supabase/client";
import { physicsProgressSlug } from "@/lib/physics-playlab";

export const Route = createFileRoute("/_authenticated/app/games/physics")({
  head: () => ({ meta: [
    { title: "Physics Playlab — SCIENCE EXPLORER" },
    { name: "description", content: "Discover gravity, motion, circuits and light in six interactive physics missions." },
    { property: "og:title", content: "Physics Playlab — SCIENCE EXPLORER" },
    { property: "og:description", content: "Play six beginner physics missions with your science buddy." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: PhysicsPage,
});
function PhysicsPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const [worldTab, setWorldTab] = useState<"missions" | "magnets">("missions");
  const qc = useQueryClient();
  const progress = useQuery({ queryKey: ["topic-progress", user.id], enabled: role === "student", queryFn: async () => {
    const { data, error } = await supabase.from("topic_progress").select("topic_slug,completed_at").eq("student_id", user.id);
    if (error) throw error; return data;
  } });
  const complete = async (id: string) => {
    if (role !== "student") return "Teacher practice — no student rewards saved.";
    const slug = physicsProgressSlug(id);
    const { error } = await supabase.from("topic_progress").upsert({ student_id: user.id, topic_slug: slug }, { onConflict: "student_id,topic_slug", ignoreDuplicates: true });
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ["topic-progress", user.id] });
    return "Mission saved · 25 XP for first completion only. Replays earn no extra XP.";
  };
  return <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
    <div className="relative isolate before:pointer-events-none before:absolute before:inset-x-[-1rem] before:-top-8 before:-z-10 before:h-[32rem] before:rounded-[3rem] before:bg-gradient-to-br before:from-amber-500/15 before:via-blue-400/10 before:to-transparent before:blur-2xl">
    <Button asChild variant="ghost" className="mb-4 rounded-full"><Link to="/app"><ArrowLeft />Back to Dashboard</Link></Button>
    <section className="relative isolate mb-6 overflow-hidden rounded-[2rem] border border-blue-300/15 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-12 top-8 h-44 w-44 rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute right-20 top-16 h-28 w-28 rounded-full border border-white/10" />
      <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-200">ENTER THE PHYSICS WORLD</p><h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Physics Power Lab</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">Explore forces, motion, gravity, electricity, light and magnetism through hands-on experiments. Make a prediction, test it and discover the science.</p>
          <div className="mt-5 flex flex-wrap gap-2">{["Gravity", "Magnetism", "Circuits", "Motion", "Light"].map((label) => <span key={label} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/85">{label}</span>)}</div>
        </div>
        <div className="relative mx-auto grid h-36 w-36 place-items-center rounded-full border border-cyan-200/20 bg-cyan-300/5 shadow-[0_0_70px_rgba(34,211,238,.16)]"><div className="absolute inset-4 rounded-full border border-dashed border-cyan-200/30"/><Magnet className="h-16 w-16 text-cyan-200"/><span className="absolute -right-2 top-2 rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black text-slate-950">LAB 01</span></div>
      </div>
    </section>
    <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Physics world activities">
      <Button role="tab" aria-selected={worldTab === "missions"} variant={worldTab === "missions" ? "default" : "outline"} className="rounded-full" onClick={() => setWorldTab("missions")}><Zap className="h-4 w-4" /> Discovery missions</Button>
      <Button role="tab" aria-selected={worldTab === "magnets"} variant={worldTab === "magnets" ? "default" : "outline"} className="rounded-full" onClick={() => setWorldTab("magnets")}><Magnet className="h-4 w-4" /> Magnetic field lab</Button>
    </div>
    {progress.isError && <p role="alert" className="mb-4 text-destructive">Saved missions couldn’t load. Please refresh to see your progress.</p>}
    {worldTab === "magnets" ? <MagnetExplorer /> : <PhysicsPlaylab completed={(progress.data ?? []).map((p) => p.topic_slug.replace("physics-playlab-", ""))} onComplete={complete} />}
    </div>
  </AppShell>;
}