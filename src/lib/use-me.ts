import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "student" | "teacher";

/** Signed-in user's role (from user_roles) and profile name. */
export function useMe(userId: string) {
  return useQuery({
    queryKey: ["me", userId],
    queryFn: async () => {
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
      ]);
      return { role: (roles?.[0]?.role ?? null) as Role | null, name: profile?.full_name ?? "" };
    },
  });
}
