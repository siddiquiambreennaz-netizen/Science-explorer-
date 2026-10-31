import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FlaskConical, Search, Sparkles, X } from "lucide-react";
import { AppShell, cardCls, inputCls, studentNav, teacherNav } from "@/components/AppShell";
import { useMe } from "@/lib/use-me";
import { COMPOUNDS, type Compound } from "@/data/compounds";
import { cn } from "@/lib/utils";

type Search = { c?: string | undefined };

export const Route = createFileRoute("/_authenticated/app/compounds")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const c = s["c"];
    return typeof c === "string" ? { c } : {};
  },
  head: () => ({
    meta: [
      { title: "Compound Explorer — SCIENCE EXPLORER" },
      { name: "description", content: "Search chemical compounds, see their formulae and learn what they do." },
      { property: "og:title", content: "Compound Explorer — SCIENCE EXPLORER" },
      { property: "og:description", content: "Search chemical compounds and learn their formulae." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompoundsPage,
});

function CompoundsPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const { c: initial } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(initial ?? null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return COMPOUNDS;
    return COMPOUNDS.filter(
      (c) => c.name.toLowerCase().includes(needle) || c.formula.toLowerCase().includes(needle) || c.type.toLowerCase().includes(needle),
    );
  }, [q]);

  const current = COMPOUNDS.find((c) => c.slug === selected) ?? null;
  const pick = (slug: string | null) => {
    setSelected(slug);
    void navigate({ search: slug ? { c: slug } : {}, replace: true });
  };

  return (
    <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
      <div className="space-y-6">
        <header>
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            <FlaskConical className="h-8 w-8 text-teacher" /> Compound Explorer
          </h1>
          <p className="mt-1 text-muted-foreground">Search a compound to see its formula, atoms and what it does in everyday life.</p>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search compounds" placeholder="Try “water”, “CO₂” or “salt”…" value={q}
            onChange={(e) => setQ(e.target.value)} className={cn(inputCls, "pl-12")}
          />
        </div>

        {current ? (
          <CompoundDetail c={current} onClose={() => pick(null)} />
        ) : list.length === 0 ? (
          <p className={cn(cardCls, "text-center text-muted-foreground")}>
            No compound matches “{q}”. This library covers common school compounds — try water, salt or glucose.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <button
                key={c.slug} onClick={() => pick(c.slug)}
                className={cn(cardCls, "flex flex-col items-start gap-2 text-start transition hover:-translate-y-1 hover:border-primary/40")}
              >
                <span className="rounded-2xl bg-teacher-soft px-3 py-1.5 font-mono text-lg font-extrabold text-teacher">{c.formula}</span>
                <span className="font-display text-xl font-extrabold text-foreground">{c.name}</span>
                <span className="text-sm text-muted-foreground">{c.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function CompoundDetail({ c, onClose }: { c: Compound; onClose: () => void }) {
  return (
    <section className={cn(cardCls, "space-y-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rounded-2xl bg-teacher-soft px-4 py-2 font-mono text-2xl font-extrabold text-teacher">{c.formula}</span>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground">{c.name}</h2>
          <p className="text-sm font-bold text-muted-foreground">{c.type}</p>
        </div>
        <button onClick={onClose} aria-label="Back to all compounds" className="rounded-full bg-secondary p-2 text-secondary-foreground transition hover:bg-secondary/70">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Atoms in one molecule/formula unit</h3>
        <div className="flex flex-wrap gap-2">
          {c.atoms.map((a) => (
            <span key={a.symbol} className="flex items-center gap-2 rounded-full border-2 border-input bg-background/70 px-4 py-2 text-sm font-bold text-foreground">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary font-mono text-xs text-primary-foreground">{a.symbol}</span>
              {a.element} × {a.count}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted-foreground">What is it?</h3>
        <p className="text-foreground">{c.explanation}</p>
      </div>

      <div className="rounded-2xl bg-accent/60 p-4">
        <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-accent-foreground"><Sparkles className="h-4 w-4" /> Fun fact</h3>
        <p className="text-sm text-foreground">{c.funFact}</p>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted-foreground">Where you meet it</h3>
        <p className="text-sm text-foreground">{c.uses}</p>
      </div>
    </section>
  );
}
