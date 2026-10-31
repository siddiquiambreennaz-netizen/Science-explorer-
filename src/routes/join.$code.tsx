import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { PENDING_JOIN_KEY } from "@/lib/pending-join";

export const Route = createFileRoute("/join/$code")({
  head: () => ({
    meta: [
      { title: "Join a classroom — SCIENCE EXPLORER" },
      { name: "description", content: "You've been invited to a SCIENCE EXPLORER science classroom." },
      { property: "og:title", content: "Join a classroom — SCIENCE EXPLORER" },
      { property: "og:description", content: "Open this invitation to join your teacher's science classroom." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JoinLink,
});

function JoinLink() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  useEffect(() => {
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    sessionStorage.setItem(PENDING_JOIN_KEY, clean);
    supabase.auth.getUser().then(({ data }) => navigate({ to: data.user ? "/app/classrooms" : "/auth", replace: true }));
  }, [code, navigate]);
  return <main className="grid min-h-screen place-items-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /></main>;
}
