import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Offline mode can still open device-saved learning packs from the last signed-in session.
    const { data: sessionData } = await supabase.auth.getSession();
    if (typeof navigator !== "undefined" && !navigator.onLine && sessionData.session?.user) {
      return { user: sessionData.session.user };
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      if (sessionData.session?.user) return { user: sessionData.session.user };
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
