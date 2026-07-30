import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { visibleNotifications } from "@/lib/notificationVisibility";

export const useUnreadNotifications = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<{ kind: string; actor_id: string | null; link: string | null }[]>([]);
  // A notification the viewer is not allowed to see must not sit in the badge
  // count either, or they tap through to a list that is one shorter than the
  // number promised. Blocking clears these server-side; this covers the rows
  // that predate that rule.
  const { data: blocks } = useBlockedUsers();

  const load = useCallback(async () => {
    if (!user) {
      setRows([]);
      return;
    }
    const { data } = await supabase
      .from("business_notifications")
      .select("kind,actor_id,link")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .limit(200);
    setRows((data ?? []) as unknown as { kind: string; actor_id: string | null; link: string | null }[]);
  }, [user]);

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("unread-notif-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "business_notifications", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, load]);

  return visibleNotifications(rows, blocks).length;
};
