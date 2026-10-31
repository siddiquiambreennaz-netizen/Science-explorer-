import { createFileRoute, notFound, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell, studentNav, teacherNav } from "@/components/AppShell";
import { QuestionGame } from "@/components/games/QuestionGame";
import { TopicGameCreator } from "@/components/games/TopicGameCreator";
import { FocusSessionTimer } from "@/components/games/FocusSessionTimer";
import { BodyDetectiveMission, BuildCellMission, CodeLogicLab, EcoRescueMission, RealWorldScienceHunt, SpaceMissionGame } from "@/components/games/InteractiveMissions";
import { findGame, gameProgressSlug } from "@/data/game-banks";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/app/games/$gameId")({
  loader: ({ params }) => { const game = findGame(params.gameId); if (!game) throw notFound(); return { id: game.id, title: game.title, description: game.description }; },
  head: ({ loaderData }) => ({ meta: [
    { title: `${loaderData?.title ?? "Game"} — SCIENCE EXPLORER` },
    { name: "description", content: loaderData?.description ?? "A SCIENCE EXPLORER learning game." },
    { property: "og:title", content: `${loaderData?.title ?? "Game"} — SCIENCE EXPLORER` },
    { property: "og:description", content: loaderData?.description ?? "A SCIENCE EXPLORER learning game." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: GamePage,
});

function GamePage() {
  const { id } = Route.useLoaderData();
  const game = findGame(id)!;
  const { user } = useRouteContext({ from: "/_authenticated" });
  const me = useMe(user.id);
  const role = me.data?.role ?? null;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const complete = async (score: number, total: number) => {
    if (role !== "student") return "Teacher practice — results aren’t saved.";
    if (score < Math.ceil(total * 0.6)) return `Score ${Math.ceil(total * 0.6)}+ to complete this challenge and earn 25 XP.`;
    const { data, error } = await supabase.from("topic_progress")
      .upsert({ student_id: user.id, topic_slug: gameProgressSlug(game.id) }, { onConflict: "student_id,topic_slug", ignoreDuplicates: true }).select("topic_slug");
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ["topic-progress", user.id] });
    return data && data.length > 0 ? "Challenge complete · +25 XP saved to My Learning! 🎉" : "Challenge complete! You already earned this game’s 25 XP — replays don’t add more.";
  };
  return (
    <AppShell role={role} nav={role === "teacher" ? teacherNav : studentNav}>
      <FocusSessionTimer />
      {id === "custom-topic-game" ? <TopicGameCreator key={game.id} onComplete={complete} onExit={() => navigate({ to: "/app/games" })} />
        : id === "build-the-cell" ? <BuildCellMission key={game.id} onComplete={complete} onExit={() => navigate({ to: "/app/games" })} />
        : id === "body-detective" ? <BodyDetectiveMission key={game.id} onComplete={complete} onExit={() => navigate({ to: "/app/games" })} />
        : id === "space-mission" ? <SpaceMissionGame key={game.id} onComplete={complete} onExit={() => navigate({ to: "/app/games" })} />
        : id === "eco-rescue" ? <EcoRescueMission key={game.id} onComplete={complete} onExit={() => navigate({ to: "/app/games" })} />
        : id === "real-world-science-hunt" ? <RealWorldScienceHunt key={game.id} onComplete={complete} onExit={() => navigate({ to: "/app/games" })} />
        : id === "code-logic" ? <CodeLogicLab key={game.id} onComplete={complete} onExit={() => navigate({ to: "/app/games" })} />
        : <QuestionGame key={game.id} game={game} onComplete={complete} onExit={() => navigate({ to: "/app/games" })} />}
    </AppShell>
  );
}
