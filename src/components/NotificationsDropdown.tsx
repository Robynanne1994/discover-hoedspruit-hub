import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, X, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollowRequestActors, actorForNotif, isFollowActorKind } from "@/hooks/useFollowRequestActors";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { visibleNotifications } from "@/lib/notificationVisibility";
import { titleCaseSubject } from "@/lib/titleCaseSubject";

const INK = "#2A2A24";
const CREAM = "#EEE8DA";
const MUTED = "#6B6A5E";
const LINE = "#D9D2C0";
const RUST = "#9B5A3C";
const SERIF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
  kind: string;
  ref_table: string | null;
  ref_id: string | null;
  actor_id: string | null;
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

interface Props {
  background?: string;
}

export const NotificationsBell = ({ background = CREAM }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: blocks } = useBlockedUsers();
  const [allNotifs, setAllNotifs] = useState<Notif[]>([]);
  // follows.id values with an accept/decline in flight, so a double-tap can't
  // fire the RPC twice and the buttons show they're working.
  const [responding, setResponding] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setAllNotifs([]); setLoaded(true); return; }
    const { data } = await supabase
      .from("business_notifications")
      .select("id,title,body,link,is_read,created_at,kind,ref_table,ref_id,actor_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setAllNotifs((data ?? []) as unknown as Notif[]);
    setLoaded(true);
  }, [user]);

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase
      .channel("notif-bell")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "business_notifications", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  // Close on back. Pop the dummy history entry when closed any other way
  // so the next back press navigates instead of being swallowed.
  useEffect(() => {
    if (!open) return;
    let poppedByBrowser = false;
    const onPop = () => {
      poppedByBrowser = true;
      setOpen(false);
    };
    window.history.pushState({ notifBell: true }, "");
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (!poppedByBrowser && window.history.state?.notifBell) {
        window.history.back();
      }
    };
  }, [open]);

  // Blocking deletes the notifications between two people server-side. This
  // keeps a card that outlived its block — old history, or a panel that was
  // already open — from showing that person's name or avatar in the bell.
  const notifs = visibleNotifications(allNotifs, blocks);

  const unread = notifs.filter((n) => !n.is_read).length;

  // Resolved kinds (declined / withdrawn) are included on purpose: their
  // follows row is deleted, so the actor is resolved from the notification's
  // '/profile/<id>' link instead and the avatar stays put.
  const followActorRefs = notifs
    .filter((n) => isFollowActorKind(n.kind) && n.ref_id)
    .map((n) => ({ ref_id: n.ref_id, link: n.link }));
  const actorMap = useFollowRequestActors(followActorRefs);

  const feedbackRefIds = notifs.filter((n) => n.kind === "feedback_reply" && n.ref_id).map((n) => n.ref_id as string);
  const [feedbackSubjects, setFeedbackSubjects] = useState<Record<string, string>>({});
  useEffect(() => {
    const missing = feedbackRefIds.filter((id) => !(id in feedbackSubjects));
    if (missing.length === 0) return;
    (async () => {
      const { data } = await supabase.from("feedback").select("id,subject").in("id", missing);
      if (data) {
        setFeedbackSubjects((prev) => {
          const next = { ...prev };
          (data as any[]).forEach((r) => { next[r.id] = r.subject || ""; });
          return next;
        });
      }
    })();
  }, [feedbackRefIds.join(","), feedbackSubjects]);

  const onRowClick = async (n: Notif) => {
    setOpen(false);
    if (!n.is_read) {
      await supabase.from("business_notifications").update({ is_read: true }).eq("id", n.id);
      setAllNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    if (!user) return;
    const ids = notifs.filter((n) => !n.is_read).map((n) => n.id);
    if (ids.length === 0) return;
    await supabase.from("business_notifications").update({ is_read: true }).in("id", ids);
    setAllNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  // The follower count, "pending requests" line, followers list and the
  // Following pills are all React Query caches keyed independently of this
  // component's local state. Responding to a request here writes straight to
  // Supabase, so those caches must be invalidated or they stay stale until a
  // manual refresh.
  const invalidateFollowCaches = () => {
    qc.invalidateQueries({ queryKey: ["follow-counts"] });
    qc.invalidateQueries({ queryKey: ["followers"] });
    qc.invalidateQueries({ queryKey: ["following"] });
    qc.invalidateQueries({ queryKey: ["follow-requests"] });
    qc.invalidateQueries({ queryKey: ["follow-request-count"] });
    qc.invalidateQueries({ queryKey: ["my-following-ids"] });
    qc.invalidateQueries({ queryKey: ["is-following"] });
  };

  const respondFollowRequest = async (n: Notif, accept: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!n.ref_id) return;
    if (responding.has(n.ref_id)) return;
    setResponding((prev) => new Set(prev).add(n.ref_id!));

    // Authoritative server-side accept/decline. Surface failures — silently
    // bailing here is what made these buttons look dead.
    const { error } = await supabase.rpc("respond_to_follow_request", {
      _request_id: n.ref_id,
      _accept: accept,
    });

    setResponding((prev) => {
      const next = new Set(prev);
      next.delete(n.ref_id!);
      return next;
    });

    if (error) {
      toast.error(error.message || "Could not respond to that follow request. Please try again.");
      return;
    }

    invalidateFollowCaches();
    // The server trigger converts the notification into a resolved record.
    // Mirror that locally so the row updates instantly — including the
    // '/profile/<id>' link, which is how the row keeps showing this person's
    // avatar once the follows row is deleted by a decline.
    const actor = actorMap[n.ref_id];
    setAllNotifs((prev) =>
      prev.map((x) =>
        x.id === n.id
          ? {
              ...x,
              kind: accept ? "follow_request_accepted" : "follow_request_declined",
              title: accept ? "You accepted this follow request" : "You declined this follow request",
              body: accept ? "They are now following you." : "Their follow request was declined.",
              link: actor ? `/profile/${actor.id}` : x.link,
              is_read: true,
            }
          : x
      )
    );
    toast.success(accept ? "Follow request accepted" : "Follow request declined");
  };


  return (
    <>
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 44, height: 44, borderRadius: 999,
          background: open ? INK : background,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "none", cursor: "pointer", position: "relative", flexShrink: 0,
          transition: "background 180ms ease-out",
        }}
      >
        {open ? (
          <X size={16} color={CREAM} strokeWidth={1.8} />
        ) : (
          <Bell size={18} color={INK} strokeWidth={1.6} />
        )}
        {!open && unread > 0 && (
          <span
            style={{
              position: "absolute", top: -2, right: -2,
              minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999,
              background: RUST, color: CREAM, fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${background}`, lineHeight: 1,
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(20, 20, 18, 0.45)",
              zIndex: 90,
              animation: "nb-fade 200ms ease-out",
            }}
          />
          <div
            role="dialog"
            aria-label="Notifications"
            style={{
              position: "fixed",
              top: 88,
              right: 20,
              width: 340,
              maxWidth: "calc(100vw - 40px)",
              maxHeight: "70vh",
              background: CREAM,
              borderRadius: 24,
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.18)",
              overflow: "hidden",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              animation: "nb-panel 200ms ease-out",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px 12px",
                borderBottom: `1px solid ${LINE}`,
              }}
            >
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 10.5,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: MUTED,
                }}
              >
                Notifications
              </span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontFamily: SANS,
                    fontSize: 11,
                    color: RUST,
                    textTransform: "lowercase",
                  }}
                >
                  mark all read
                </button>
              )}
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {loaded && notifs.length === 0 && (
                <div
                  style={{
                    padding: "44px 24px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Bell size={22} strokeWidth={1.4} color={MUTED} style={{ opacity: 0.5 }} />
                  <p
                    style={{
                      margin: 0,
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontSize: 16,
                      color: INK,
                      opacity: 0.7,
                    }}
                  >
                    nothing new just yet.
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: MUTED }}>
                    We'll let you know when something happens.
                  </p>
                </div>
              )}

              {notifs.map((n, i) => {
                const rowActor = isFollowActorKind(n.kind) && n.ref_id
                  ? actorForNotif(n.kind, actorMap[n.ref_id])
                  : undefined;
                return (
                <button
                  key={n.id}
                  onClick={() => onRowClick(n)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "14px 20px",
                    background: "transparent",
                    border: "none",
                    borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                    cursor: n.link ? "pointer" : "default",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    {!n.is_read && (
                      <span
                        style={{
                          width: 7, height: 7, borderRadius: 999,
                          background: RUST, flexShrink: 0, marginTop: 6,
                        }}
                      />
                    )}
                    {rowActor && (
                      <div
                        style={{
                          width: 32, height: 32, borderRadius: 999, overflow: "hidden", flexShrink: 0,
                          background: "linear-gradient(135deg, #8a6f4d, #c4a374)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontFamily: SANS, fontSize: 12, fontWeight: 600,
                        }}
                      >
                        {rowActor.avatar_url ? (
                          <img
                            src={rowActor.avatar_url}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          (rowActor.display_name || "·")
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((p) => p[0]?.toUpperCase() ?? "")
                            .join("")
                        )}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0, paddingLeft: n.is_read && !rowActor ? 17 : 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          alignItems: "baseline",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: SANS,
                            fontSize: 13,
                            fontWeight: n.is_read ? 400 : 600,
                            color: INK,
                            lineHeight: 1.3,
                            flex: 1,
                          }}
                        >
                          {n.title}
                        </span>
                        <span
                          style={{
                            fontSize: 10.5,
                            color: MUTED,
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      {n.kind === "feedback_reply" && n.ref_id && feedbackSubjects[n.ref_id] && (
                        <p
                          style={{
                            margin: "3px 0 0",
                            fontFamily: SANS,
                            fontSize: 11.5,
                            color: INK,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Subject:</span>{" "}
                          <span style={{ fontWeight: 500 }}>{titleCaseSubject(feedbackSubjects[n.ref_id])}</span>
                        </p>
                      )}
                      {n.body && (
                        <p
                          style={{
                            margin: "3px 0 0",
                            fontFamily: SANS,
                            fontSize: 12,
                            color: MUTED,
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {n.body}
                        </p>
                      )}
                      {n.kind === "follow_request" && n.ref_id && (
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <button
                            disabled={responding.has(n.ref_id)}
                            onClick={(e) => respondFollowRequest(n, true, e)}
                            style={{
                              height: 30,
                              padding: "0 14px",
                              borderRadius: 999,
                              background: "#423324",
                              color: "#FFFFFF",
                              border: "none",
                              cursor: responding.has(n.ref_id) ? "default" : "pointer",
                              opacity: responding.has(n.ref_id) ? 0.6 : 1,
                              fontFamily: SANS,
                              fontSize: 12,
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Check size={13} strokeWidth={2.4} /> Accept
                          </button>
                          <button
                            disabled={responding.has(n.ref_id)}
                            onClick={(e) => respondFollowRequest(n, false, e)}
                            style={{
                              height: 30,
                              padding: "0 14px",
                              borderRadius: 999,
                              background: "transparent",
                              color: INK,
                              border: `1px solid ${LINE}`,
                              cursor: responding.has(n.ref_id) ? "default" : "pointer",
                              opacity: responding.has(n.ref_id) ? 0.6 : 1,
                              fontFamily: SANS,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          </div>

          <style>{`
            @keyframes nb-fade { from { opacity: 0 } to { opacity: 1 } }
            @keyframes nb-panel {
              from { opacity: 0; transform: translateY(-8px) }
              to { opacity: 1; transform: translateY(0) }
            }
          `}</style>
        </>
      )}
    </>
  );
};

export default NotificationsBell;
