export type TopicGameWorld = "space" | "physics" | "chemistry" | "biology" | "math" | "earth" | "coding" | "general";
export type TopicGameMechanic = "sequence" | "sort" | "match";

export type TopicGameItem = {
  id: string;
  label: string;
  icon: string;
  correctTarget: string;
  hint: string;
  feedback: string;
};

export type TopicGameTarget = {
  id: string;
  label: string;
  icon: string;
  hint: string;
};

export type TopicGameQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

/** Safe, declarative game instructions only. AI is never allowed to supply executable code. */
export type TopicGameSpec = {
  title: string;
  world: TopicGameWorld;
  story: string;
  mission: string;
  objective: string;
  mechanic: TopicGameMechanic;
  items: TopicGameItem[];
  targets: TopicGameTarget[];
  hints: string[];
  reward: string;
  quiz: TopicGameQuestion[];
};
