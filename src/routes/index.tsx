import { createFileRoute } from "@tanstack/react-router";
import { Onboarding } from "@/components/Onboarding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SCIENCE EXPLORER — Start Your Science Journey" },
      { name: "description", content: "Meet your robot science buddy, choose your language and sign in as a student or teacher." },
      { property: "og:title", content: "SCIENCE EXPLORER — Start Your Science Journey" },
      { property: "og:description", content: "Interactive science learning for students and teachers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});
