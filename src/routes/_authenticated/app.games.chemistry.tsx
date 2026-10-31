import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Atom, FlaskConical, Sparkles } from "lucide-react";
import { AppShell, studentNav, teacherNav } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MoleculeBuilder } from "@/components/games/MoleculeBuilder";
import { FormulaBalancer } from "@/components/games/FormulaBalancer";
import { VirtualLab } from "@/components/games/VirtualLab";
import { useMe } from "@/lib/use-me";
export const Route = createFileRoute("/_authenticated/app/games/chemistry")({
  head: () => ({ meta: [
    { title: "Chemistry Lab — SCIENCE EXPLORER" }, { name: "description", content: "Build molecules, balance equations and explore safe virtual chemistry." },
    { property: "og:title", content: "Chemistry Lab — SCIENCE EXPLORER" }, { property: "og:description", content: "Interactive molecules, equations and simulated reactions." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: ChemistryPage,
});
function ChemistryPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const role = useMe(user.id).data?.role ?? null;
  const [tab, setTab] = useState("Molecules");
  return <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}><div className="relative isolate before:pointer-events-none before:absolute before:inset-x-[-1rem] before:-top-8 before:-z-10 before:h-[32rem] before:rounded-[3rem] before:bg-gradient-to-br before:from-cyan-500/15 before:via-emerald-400/10 before:to-transparent before:blur-2xl" data-tutor-context={`Chemistry Lab: ${tab}`}>
    <Button asChild variant="ghost" className="mb-4 rounded-full"><Link to="/app/games"><ArrowLeft />Back to Science Games</Link></Button>
    <section className="relative isolate mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 text-slate-800 shadow-sm sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-20 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">ENTER THE CHEMISTRY WORLD</p><h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Molecular Discovery Lab</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">Build molecules, balance chemical equations and explore safe virtual reactions. Every experiment helps you connect atoms, bonds and reactions.</p><div className="mt-5 flex flex-wrap gap-2">{["Atoms", "Molecules", "Bonding", "Reactions", "Elements"].map((label) => <span key={label} className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-700">{label}</span>)}</div></div>
        <div className="relative mx-auto grid h-36 w-36 place-items-center rounded-full border border-emerald-200 bg-white shadow-sm"><div className="absolute inset-4 rounded-full border border-dashed border-emerald-300"/><Atom className="h-16 w-16 text-emerald-600"/><span className="absolute -right-2 top-2 rounded-full bg-cyan-200 px-2 py-1 text-[10px] font-black text-slate-950">LAB 02</span></div>
      </div>
    </section>
    <div className="my-5 flex flex-wrap gap-2" role="tablist">{["Molecules", "Balancing", "Virtual reactions"].map((t) => <Button role="tab" aria-selected={tab === t} key={t} variant={t === tab ? "default" : "secondary"} className="rounded-full" onClick={() => setTab(t)}>{t}</Button>)}</div>
    {tab === "Molecules" ? <MoleculeBuilder /> : tab === "Balancing" ? <FormulaBalancer /> : <VirtualLab />}
  </div></AppShell>;
}