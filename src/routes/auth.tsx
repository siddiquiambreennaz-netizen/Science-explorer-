import { createFileRoute } from "@tanstack/react-router";
import { Onboarding } from "@/components/Onboarding";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SCIENCE EXPLORER" },
      { name: "description", content: "Sign in or create your SCIENCE EXPLORER student or teacher account." },
      { property: "og:title", content: "Sign in — SCIENCE EXPLORER" },
      { property: "og:description", content: "Student and teacher sign-in for SCIENCE EXPLORER." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Onboarding initial="role" />,
});
