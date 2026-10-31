import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Prefer the persisted local session first. A transient getUser network
    // failure should not turn a successful sign-in into a generic route crash.
    let sessionUser: User | null = null;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      sessionUser = sessionData.session?.user ?? null;
    } catch (error) {
      console.warn("[Auth] Could not read the persisted Supabase session:", error);
    }

    if (typeof navigator !== "undefined" && !navigator.onLine && sessionUser) {
      return { user: sessionUser };
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) return { user: data.user };
      if (sessionUser) return { user: sessionUser };
    } catch (error) {
      console.warn("[Auth] Session verification failed; using the saved session if available:", error);
      if (sessionUser) return { user: sessionUser };
    }

    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
