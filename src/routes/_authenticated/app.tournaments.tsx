import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { Swords, Timer, Trophy, Users } from "lucide-react";
import { AppShell, btnCls, cardCls, studentNav, teacherNav } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { useMe } from "@/lib/use-me";
import { cn } from "@/lib/utils";
import { DemoTournament } from "@/components/DemoTournament";

export const Route = createFileRoute("/_authenticated/app/tournaments")({
  head: () => ({
    meta: [
      { title: "Tournaments — SCIENCE EXPLORER" },
      { name: "description", content: "Live multiplayer science tournaments — coming to SCIENCE EXPLORER." },
      { property: "og:title", content: "Tournaments — SCIENCE EXPLORER" },
      { property: "og:description", content: "Live multiplayer science tournaments — coming soon." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TournamentsPage,
});

function TournamentsPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;

  return (
    <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
      <div className="space-y-6">
        <section className={cn(cardCls, "flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start")}>
          <Mascot state="thinking" className="w-28 shrink-0" />
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">Science Tournaments</h1>
            <p className="mt-1 text-muted-foreground">Practise now in the Demo Tournament. Live battles with real classmates need real-time multiplayer, which isn’t connected yet.</p>
          </div>
        </section>

        <DemoTournament playerName={me.data?.name?.split(" ")[0] || "You"} />

        <section className={cn(cardCls, "space-y-4")}>
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground">
            <Trophy className="h-5 w-5 text-accent-foreground" /> Real multiplayer: where things stand
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time multiplayer needs a live connection service that synchronises every player's screen at once.
            That infrastructure isn't connected to SCIENCE EXPLORER yet, so there is no tournament lobby to join today —
            we won't show you a fake one. When it's ready, this page will host the real thing.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Users, title: "Join a room", desc: "Enter a code from your teacher to play together." },
              { icon: Timer, title: "Race the clock", desc: "Answer science questions live, fastest correct wins." },
              { icon: Trophy, title: "Climb the board", desc: "See the classroom leaderboard update in real time." },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border-2 border-input bg-background/70 p-4">
                <s.icon className="h-6 w-6 text-primary" />
                <p className="mt-2 font-bold text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={cn(cardCls, "flex flex-col items-center gap-3 text-center")}>
          <p className="font-bold text-foreground">Want to practise while you wait?</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/app/sciences" className={cn(btnCls, "bg-gradient-primary text-primary-foreground")}>Take a quiz</Link>
            <Link to="/app/games" className={cn(btnCls, "bg-secondary text-secondary-foreground")}>
              <Swords className="h-4 w-4" /> Play science games
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
