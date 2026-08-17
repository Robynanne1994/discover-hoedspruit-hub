import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bell, Calendar, Clock, Heart, MapPin, Store, Sun, Tag, CheckCheck, Settings, Check, UserPlus, Megaphone, MoreHorizontal, Send } from "lucide-react";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import {
  channelImage,
  eventImage,
  listingImage,
  specialSurfaceImage,
  CHANNEL_IMAGE_COLUMNS,
  EVENT_IMAGE_COLUMNS,
  LISTING_IMAGE_COLUMNS,
  SPECIAL_IMAGE_COLUMNS,
} from "@/lib/imageFallback";
import { useAuth } from "@/hooks/useAuth";
import { useFollowRequestActors, actorForNotif, isFollowActorKind, FollowActor } from "@/hooks/useFollowRequestActors";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { visibleNotifications } from "@/lib/notificationVisibility";
import { titleCaseSubject } from "@/lib/titleCaseSubject";
import hhLogo from "@/assets/hh-logo.png";
import { MUTED as TOKEN_MUTED } from "@/lib/type";

// The notification thumbnail is the saved-card crop, with the rest of the row's
// pictures behind it so a row that only has one never shows a blank circle.
const REF_IMAGE_COLUMNS: Record<string, string> = {
  listings: LISTING_IMAGE_COLUMNS,
  events: EVENT_IMAGE_COLUMNS,
  specials: SPECIAL_IMAGE_COLUMNS,
  bush_telegraph_resources: CHANNEL_IMAGE_COLUMNS,
};

const REF_IMAGE_PICKER: Record<string, (row: any) => string | null> = {
  listings: (r) => listingImage(r, "saved"),
  events: (r) => eventImage(r, "saved"),
  specials: (r) => specialSurfaceImage(r, "saved"),
  bush_telegraph_resources: (r) => channelImage(r, "saved"),
};

const isAdminKind = (k: string) => {
  const s = (k || "").toLowerCase();
  return s.includes("app_update") || s.includes("announcement") || s.includes("news") || s.includes("broadcast") || s.includes("feedback") || s.includes("moderation") || s.includes("report");
};

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BG = "#E6E0CC";
const CARD = "#ffffff";
const INK = "#1A1A1A";
const MUTED = TOKEN_MUTED;
const BODY = "#3A332B";
const HAIRLINE = "rgba(0,0,0,0.06)";
const DOT = "#E0322B";
const BROWN = "#423324";
const AVATAR_BG = "#E9E1D3";

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

const iconFor = (kind: string) => {
  const k = (kind || "").toLowerCase();
  if (k.includes("feedback")) return Send;
  if (k.includes("app_update") || k.includes("announcement") || k.includes("news")) return Megaphone;
  if (k.includes("follow")) return UserPlus;
  if (k.includes("save") || k.includes("favourite") || k.includes("favorite")) return Heart;
  if (k.includes("special") || k.includes("deal") || k.includes("offer")) return Tag;
  if (k.includes("listing") || k.includes("place")) return Tag;
  if (k.includes("reminder")) return Clock;
  if (k.includes("event")) return Calendar;
  if (k.includes("tip")) return Sun;
  if (k.includes("location") || k.includes("hours")) return MapPin;
  return Bell;
};

const relativeShort = (iso: string): string => {
  const then = new Date(iso).getTime();
  const diffMin = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (diffMin < 60) return `${Math.max(1, diffMin)}m`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const bucketOf = (iso: string): "today" | "yesterday" | "week" | "month" | "earlier" => {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const todayStart = startOfDay(now);
  const dStart = startOfDay(d);
  const dayDiff = Math.round((todayStart - dStart) / 86400000);
  if (dayDiff <= 0) return "today";
  if (dayDiff === 1) return "yesterday";
  if (dayDiff < 7) return "week";
  if (dayDiff < 30) return "month";
  return "earlier";
};

export default function MyNotifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [allNotifs, setAllNotifs] = useState<Notif[]>([]);
  const [loaded, setLoaded] = useState(false);
  const initialUnreadRef = useRef<Set<string> | null>(null);
  const [, force] = useState(0);
  // Follow requests currently being accepted/declined, keyed by follows.id, so a
  // double-tap can't fire the RPC twice and the buttons show they're working.
  const respondingRef = useRef<Set<string>>(new Set());
  const [responding, setResponding] = useState<Set<string>>(new Set());

  // Blocking clears the notifications between two people server-side, so this
  // normally has nothing to do. It is the fallback for cards written before
  // that rule existed, and for a list already on screen when a block lands.
  const { data: blocks } = useBlockedUsers();

  const load = useCallback(async () => {
    if (!user) {
      setAllNotifs([]);
      setLoaded(true);
      return;
    }
    const { data, error } = await supabase
      .from("business_notifications")
      .select("id,title,body,link,is_read,created_at,kind,ref_table,ref_id,actor_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error) {
      const rows = (data ?? []) as unknown as Notif[];
      if (initialUnreadRef.current === null) {
        initialUnreadRef.current = new Set(rows.filter((n) => !n.is_read).map((n) => n.id));
      } else {
        rows.forEach((n) => {
          if (!n.is_read) initialUnreadRef.current!.add(n.id);
        });
      }
      setAllNotifs(rows);
      force((x) => x + 1);
    }
    setLoaded(true);
  }, [user]);

  // Anything about someone on either side of a block never reaches the list,
  // so a card that outlived its block cannot show that person's name or avatar
  // and cannot be tapped through to their profile.
  const notifs = useMemo(() => visibleNotifications(allNotifs, blocks), [allNotifs, blocks]);

  useEffect(() => {
    load();
    if (!user) return;
    const channel = supabase
      .channel("my-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "business_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  useEffect(() => {
    if (!loaded || notifs.length === 0 || !user) return;
    const t = setTimeout(async () => {
      const unread = notifs.filter((n) => !n.is_read).map((n) => n.id);
      if (unread.length > 0) {
        await supabase.from("business_notifications").update({ is_read: true }).in("id", unread);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [loaded, notifs, user]);

  // Counts what is still on screen: a notification that has since been hidden
  // or deleted must not keep inflating the "N Unread" line.
  const unreadCount = useMemo(() => {
    const initial = initialUnreadRef.current;
    if (!initial) return 0;
    return notifs.filter((n) => initial.has(n.id)).length;
  }, [notifs]);

  const buckets = useMemo(() => {
    const groups: Record<string, Notif[]> = { today: [], yesterday: [], week: [], month: [], earlier: [] };
    notifs.forEach((n) => groups[bucketOf(n.created_at)].push(n));
    return groups;
  }, [notifs]);

  // Includes the resolved kinds (declined / withdrawn / accepted): their
  // follows row may be gone, but the card still shows the person, so the
  // actor lookup has to cover them or the avatar blanks out.
  const followActorRefs = useMemo(
    () =>
      notifs
        .filter((n) => isFollowActorKind(n.kind) && n.ref_id)
        .map((n) => ({ ref_id: n.ref_id, link: n.link })),
    [notifs]
  );
  const actorMap = useFollowRequestActors(followActorRefs);


  const feedbackRefIds = useMemo(
    () => notifs.filter((n) => n.kind === "feedback_reply" && n.ref_id).map((n) => n.ref_id as string),
    [notifs]
  );
  const [feedbackSubjects, setFeedbackSubjects] = useState<Record<string, string>>({});
  useEffect(() => {
    if (feedbackRefIds.length === 0) return;
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
  }, [feedbackRefIds, feedbackSubjects]);

  // Fetch cover images for listing/event/special/resource notifications
  const [refImages, setRefImages] = useState<Record<string, string>>({});
  const refKeysToFetch = useMemo(() => {
    const keys: Record<string, Set<string>> = {};
    notifs.forEach((n) => {
      if (!n.ref_table || !n.ref_id) return;
      if (isAdminKind(n.kind)) return;
      if (isFollowActorKind(n.kind)) return;
      const t = n.ref_table;
      if (t !== "listings" && t !== "events" && t !== "specials" && t !== "bush_telegraph_resources") return;
      if (!keys[t]) keys[t] = new Set();
      keys[t].add(n.ref_id);
    });
    return keys;
  }, [notifs]);
  useEffect(() => {
    const tables = Object.keys(refKeysToFetch);
    if (tables.length === 0) return;
    (async () => {
      const updates: Record<string, string> = {};
      for (const t of tables) {
        const ids = Array.from(refKeysToFetch[t]).filter((id) => !(`${t}:${id}` in refImages));
        if (ids.length === 0) continue;
        const { data } = await supabase.from(t as any).select(`id, ${REF_IMAGE_COLUMNS[t]}`).in("id", ids);
        (data as any[] | null)?.forEach((r) => {
          const url = REF_IMAGE_PICKER[t](r);
          if (url) updates[`${t}:${r.id}`] = url;
        });
      }
      if (Object.keys(updates).length > 0) setRefImages((prev) => ({ ...prev, ...updates }));
    })();
  }, [refKeysToFetch]);


  const markAllRead = useCallback(async () => {
    if (!user) return;
    const unread = notifs.filter((n) => !n.is_read).map((n) => n.id);
    if (unread.length === 0) return;
    await supabase.from("business_notifications").update({ is_read: true }).in("id", unread);
    initialUnreadRef.current = new Set();
    load();
  }, [user, notifs, load]);

  const respondFollowRequest = useCallback(async (n: Notif, accept: boolean) => {
    if (!n.ref_id) return;
    if (respondingRef.current.has(n.ref_id)) return;
    respondingRef.current.add(n.ref_id);
    setResponding((prev) => new Set(prev).add(n.ref_id!));

    // Authoritative server-side accept/decline. If it fails we must say so —
    // silently bailing here is what made these buttons look dead.
    const { error } = await supabase.rpc("respond_to_follow_request", {
      _request_id: n.ref_id,
      _accept: accept,
    });

    respondingRef.current.delete(n.ref_id);
    setResponding((prev) => {
      const next = new Set(prev);
      next.delete(n.ref_id!);
      return next;
    });

    if (error) {
      toast.error(error.message || "Could not respond to that follow request. Please try again.");
      return;
    }

    // Refresh follow state everywhere: the accepter's follower count/list and
    // the requester's "Following" status all key off these queries.
    queryClient.invalidateQueries({ queryKey: ["follow-counts"] });
    queryClient.invalidateQueries({ queryKey: ["followers"] });
    queryClient.invalidateQueries({ queryKey: ["following"] });
    queryClient.invalidateQueries({ queryKey: ["my-following-ids"] });
    queryClient.invalidateQueries({ queryKey: ["is-following"] });
    queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
    queryClient.invalidateQueries({ queryKey: ["follow-request-count"] });

    // The server trigger converts the notification into a resolved record.
    // Mirror that locally so the card updates instantly — including the
    // '/profile/<id>' link, which is how the card keeps showing this person's
    // avatar once the follows row is deleted by a decline.
    const actor = actorMap[n.ref_id];
    // Word it exactly the way the trigger will, so the card does not visibly
    // rewrite itself when the real row arrives a moment later.
    const who = actor?.display_name?.trim() || "this person";
    initialUnreadRef.current?.delete(n.id);
    setAllNotifs((prev) =>
      prev.map((x) =>
        x.id === n.id
          ? {
              ...x,
              kind: accept ? "follow_request_accepted" : "follow_request_declined",
              title: accept
                ? `You accepted ${who}'s follow request`
                : `You declined ${who}'s follow request`,
              body: accept ? "They are now following you." : "Their follow request was declined.",
              link: actor ? `/profile/${actor.id}` : x.link,
              is_read: true,
            }
          : x
      )
    );
    toast.success(accept ? "Follow request accepted" : "Follow request declined");
  }, [queryClient, actorMap]);

  const deleteNotif = useCallback(async (id: string) => {
    initialUnreadRef.current?.delete(id);
    setAllNotifs((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("business_notifications").delete().eq("id", id);
  }, []);




  const isEmpty = loaded && notifs.length === 0;
  const hasUnread = unreadCount > 0;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, color: INK }}>
      {/* Top bar */}
      <PageHeader
        title="Notifications"
        subtitle={
          hasUnread ? (
            <div
              style={{
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 11,
                letterSpacing: "1.4px",
                textTransform: "uppercase",
                color: MUTED,
              }}
            >
              {unreadCount} Unread
            </div>
          ) : undefined
        }
        right={
          <>
            {hasUnread && (
              <button
                onClick={markAllRead}
                aria-label="Mark all as read"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: CARD,
                  border: `1px solid ${HAIRLINE}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <CheckCheck size={20} strokeWidth={2} color={INK} />
              </button>
            )}
            <button
              onClick={() => navigate("/notification-preferences")}
              aria-label="Notification settings"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: CARD,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <Settings size={18} strokeWidth={1.8} color={INK} />
            </button>
          </>
        }
      />

      {/* List */}
      <div style={{ padding: "0 20px 100px" }}>
        {(["today", "yesterday", "week", "month", "earlier"] as const).map((key) => {
          const items = buckets[key];
          if (items.length === 0) return null;
          const label =
            key === "today" ? "Today"
            : key === "yesterday" ? "Yesterday"
            : key === "week" ? "This Week"
            : key === "month" ? "This Month"
            : "Earlier";
          return (
            <div key={key}>
              <div
                style={{
                  padding: "18px 0 10px",
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: 15,
                  color: INK,
                  letterSpacing: "-0.1px",
                }}
              >
                {label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {items.map((n) => (
                  <NotifCard
                    key={n.id}
                    n={n}
                    isUnread={initialUnreadRef.current?.has(n.id) ?? false}
                    onClick={n.link ? () => navigate(n.link!) : undefined}
                    onRespond={respondFollowRequest}
                    isResponding={!!n.ref_id && responding.has(n.ref_id)}
                    onDelete={deleteNotif}
                    actor={n.ref_id ? actorMap[n.ref_id] : undefined}
                    feedbackSubject={n.kind === "feedback_reply" && n.ref_id ? feedbackSubjects[n.ref_id] : undefined}
                    imageOverride={
                      isAdminKind(n.kind)
                        ? hhLogo
                        : n.ref_table && n.ref_id
                        ? refImages[`${n.ref_table}:${n.ref_id}`]
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}

        {isEmpty && (
          <div style={{ padding: "16px 0 40px" }}>
            <div
              style={{
                background: CARD,
                borderRadius: 16,
                border: "1px solid rgba(26,26,26,0.06)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                padding: "18px 20px",
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: "#F5F0E8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Bell size={18} strokeWidth={1.8} color={INK} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: '"Nohemi", ' + SANS,
                    fontWeight: 550,
                    fontSize: 20,
                    lineHeight: "20px",
                    letterSpacing: "-0.02em",
                    color: INK,
                    margin: "0 0 6px",
                  }}
                >
                  You're all caught up
                </p>
                <p
                  style={{
                    fontFamily: SANS,
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: 1.45,
                    color: MUTED,
                    margin: 0,
                  }}
                >
                  Nothing new right now. When something happens, you'll find it here.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NotifCard({
  n,
  isUnread,
  onClick,
  onRespond,
  isResponding,
  onDelete,
  actor,
  feedbackSubject,
  imageOverride,
}: {
  n: Notif;
  isUnread: boolean;
  onClick?: () => void;
  onRespond?: (n: Notif, accept: boolean) => void;
  isResponding?: boolean;
  onDelete?: (id: string) => void;
  actor?: FollowActor;
  feedbackSubject?: string;
  imageOverride?: string;
}) {
  const Icon = iconFor(n.kind);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);

  const isUserRelated = isFollowActorKind(n.kind);
  const actorProfile = actorForNotif(n.kind, actor);
  const avatarUrl = imageOverride || (isUserRelated ? actorProfile?.avatar_url : null);


  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        background: isUnread ? CARD : "transparent",
        borderRadius: 16,
        border: isUnread ? `1px solid ${HAIRLINE}` : "none",
        padding: isUnread ? "14px 16px" : "6px 4px",
        cursor: n.link ? "pointer" : "default",
      }}
    >
      {/* Avatar with badge */}
      <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: AVATAR_BG,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : null}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: -2,
            left: -2,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: BROWN,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px solid ${isUnread ? CARD : BG}`,
          }}
        >
          <Icon size={11} strokeWidth={2.2} color="#fff" />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingRight: 28 }}>
        <p
          style={{
            margin: 0,
            fontFamily: SANS,
            fontSize: 14.5,
            lineHeight: 1.4,
            color: INK,
            letterSpacing: "-0.1px",
          }}
        >
          <span style={{ fontWeight: 700 }}>{n.kind === "app_update" ? "App Updates" : n.title}</span>
          {n.kind === "app_update" ? (
            <>
              {n.title && <span style={{ fontWeight: 400 }}> {n.title}</span>}
              {n.body && <span style={{ fontWeight: 400 }}> {n.body}</span>}
            </>
          ) : (
            n.body && <span style={{ fontWeight: 400 }}> {n.body}</span>
          )}
          <span style={{ fontWeight: 400, color: MUTED, marginLeft: 6 }}>
            {relativeShort(n.created_at)}
          </span>
        </p>
        {n.kind === "feedback_reply" && feedbackSubject && (
          <p
            style={{
              margin: "4px 0 0",
              fontFamily: SANS,
              fontSize: 12,
              color: MUTED,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <span style={{ fontWeight: 600 }}>Subject:</span>{" "}
            <span>{titleCaseSubject(feedbackSubject)}</span>
          </p>
        )}
        {n.kind === "follow_request" && n.ref_id && onRespond && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              disabled={isResponding}
              onClick={(e) => { e.stopPropagation(); onRespond(n, true); }}
              style={{
                height: 32, padding: "0 16px", borderRadius: 999,
                background: BROWN, color: "#fff", border: "none",
                cursor: isResponding ? "default" : "pointer", opacity: isResponding ? 0.6 : 1,
                fontFamily: SANS, fontSize: 13, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <Check size={14} strokeWidth={2.4} /> Accept
            </button>
            <button
              disabled={isResponding}
              onClick={(e) => { e.stopPropagation(); onRespond(n, false); }}
              style={{
                height: 32, padding: "0 16px", borderRadius: 999,
                background: "transparent", color: INK,
                border: `1px solid ${HAIRLINE}`,
                cursor: isResponding ? "default" : "pointer", opacity: isResponding ? 0.6 : 1,
                fontFamily: SANS, fontSize: 13, fontWeight: 600,
              }}
            >
              Decline
            </button>
          </div>
        )}
      </div>

      {/* Three-dot menu */}
      <button
        onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
        aria-label="Options"
        style={{
          position: "absolute",
          top: isUnread ? 12 : 4,
          right: isUnread ? 10 : 0,
          width: 28, height: 28, borderRadius: 999,
          background: "transparent", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0,
        }}
      >
        <MoreHorizontal size={18} color={MUTED} strokeWidth={2} />
      </button>
      {menuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: isUnread ? 40 : 32,
            right: isUnread ? 10 : 0,
            background: CARD,
            border: `1px solid ${HAIRLINE}`,
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            padding: 4,
            zIndex: 10,
            minWidth: 180,
          }}
        >
          <button
            onClick={() => { setMenuOpen(false); onDelete?.(n.id); }}
            style={{
              width: "100%", textAlign: "left",
              padding: "10px 12px", borderRadius: 8,
              background: "transparent", border: "none",
              cursor: "pointer", fontFamily: SANS, fontSize: 14,
              fontWeight: 500, color: INK,
            }}
          >
            Delete notification
          </button>
        </div>
      )}

      {isUnread && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            right: 14,
            transform: "translateY(-50%)",
            width: 9,
            height: 9,
            borderRadius: 999,
            background: DOT,
          }}
        />
      )}
    </div>
  );
}
