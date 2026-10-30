import { supabase } from "@/integrations/supabase/client";

// Cached staff check so multiple components can ask without refetching.
let staffPromise: Promise<boolean> | null = null;

export function isCurrentUserStaff(): Promise<boolean> {
  if (!staffPromise) {
    staffPromise = (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return false;
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        return data?.role === "admin" || data?.role === "editor";
      } catch {
        return false;
      }
    })();
  }
  return staffPromise;
}

// Reset the cache on login/logout so visibility reacts to auth changes.
supabase.auth.onAuthStateChange(() => {
  staffPromise = null;
});
