import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type ModerationStatus = "active" | "warned" | "suspended" | "banned";

export type ModerationInfo = {
  status: ModerationStatus;
  suspended_until: string | null;
  reason: string | null;
};

/**
 * Returns the current user's moderation status. `warned` is non-blocking;
 * `suspended` (while `suspended_until` is in the future) and `banned`
 * block destructive actions through `requireActiveAccount` below.
 */
export const useModerationStatus = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-moderation-status", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<ModerationInfo | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("moderation_status, suspended_until, moderation_reason")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) return null;
      return {
        status: ((data as any)?.moderation_status as ModerationStatus) ?? "active",
        suspended_until: (data as any)?.suspended_until ?? null,
        reason: (data as any)?.moderation_reason ?? null,
      };
    },
  });
};

/**
 * Throws a toast and returns false if the signed-in user is currently
 * suspended or banned. Use as a one-line guard at the top of any mutation
 * that creates content (reviews, follows, reports, submissions).
 */
export const requireActiveAccount = (info?: ModerationInfo | null): boolean => {
  if (!info) return true;
  if (info.status === "banned") {
    toast.error("Your account is banned and cannot perform this action.");
    return false;
  }
  if (info.status === "suspended" && info.suspended_until && new Date(info.suspended_until) > new Date()) {
    const until = new Date(info.suspended_until).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    toast.error(`Your account is suspended until ${until}.`);
    return false;
  }
  return true;
};
