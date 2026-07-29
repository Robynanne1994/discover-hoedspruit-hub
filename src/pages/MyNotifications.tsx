import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Calendar, Clock, Heart, MapPin, Store, Sun, Tag, CheckCheck, Settings, Check, UserPlus, Megaphone, MoreHorizontal, MessageSquare, Send } from "lucide-react";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollowRequestActors, FollowActor } from "@/hooks/useFollowRequestActors";
import { titleCaseSubject } from "@/lib/titleCaseSubject";
import hhLogo from "@/assets/hh-logo.png";

const isAdminKind = (k: string) => {
  const s = (k || "").toLowerCase();
  return s.includes("app_update") || s.includes("announcement") || s.includes("news") || s.includes("broadcast") || s.includes("feedback") || s.includes("moderation") || s.includes("report");
};

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BG = "#E6E0CC";
const CARD = "#ffffff";
const INK = "#1A1A1A";
const MUTED = "#6B6A5E";
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
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loaded, setLoaded] = useState(false);
  const initialUnreadRef = useRef<Set<string> | null>(null);
  const [, force] = useState(0);

  const load = useCallback(async () => {
    if (!user) {
      setNotifs([]);
      setLoaded(true);
      return;
    }
    const { data, error } = await supabase
      .from("business_notifications")
      .select("id,title,body,link,is_read,created_at,kind,ref_table,ref_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error) {
      const rows = (data ?? []) as Notif[];
      if (initialUnreadRef.current === null) {
        initialUnreadRef.current = new Set(rows.filter((n) => !n.is_read).map((n) => n.id));
      } else {
        rows.forEach((n) => {
          if (!n.is_read) initialUnreadRef.current!.add(n.id);
        });
      }
      setNotifs(rows);
      force((x) => x + 1);
    }
    setLoaded(true);
  }, [user]);

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

  const unreadCount = useMemo(
    () => (initialUnreadRef.current ? initialUnreadRef.current.size : 0),
    [notifs]
  );

  const buckets = useMemo(() => {
    const groups: Record<string, Notif[]> = { today: [], yesterday: [], week: [], month: [], earlier: [] };
    notifs.forEach((n) => groups[bucketOf(n.created_at)].push(n));
    return groups;
  }, [notifs]);

  const followRequestRefIds = useMemo(
    () =>
      notifs
        .filter((n) => (n.kind === "follow_request" || n.kind === "follow_request_accepted" || n.kind === "follow_accepted" || n.kind === "new_follower") && n.ref_id)
        .map((n) => n.ref_id as string),
    [notifs]
  );
  const actorMap = useFollowRequestActors(followRequestRefIds);


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
      if (n.kind === "follow_request" || n.kind === "follow_request_accepted" || n.kind === "follow_accepted" || n.kind === "follow_request_declined") return;
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
        const { data } = await supabase.from(t as any).select("id,image_url,saved_image_url").in("id", ids);
        (data as any[] | null)?.forEach((r) => {
          const url = r.saved_image_url || r.image_url;
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
    if (accept) {
      await supabase
        .from("follows")
        .update({ status: "accepted", responded_at: new Date().toISOString() } as any)
        .eq("id", n.ref_id);
      // Server trigger converts the notification to 'follow_request_accepted'.
      // Mirror that locally so the card updates instantly.
      setNotifs((prev) =>
        prev.map((x) =>
          x.id === n.id
            ? {
                ...x,
                kind: "follow_request_accepted",
                title: "You accepted this follow request",
                body: "They are now following you.",
                link: x.link,
                is_read: false,
              }
            : x
        )
      );
    } else {
      await supabase.from("follows").delete().eq("id", n.ref_id);
      // Server trigger converts the notification to 'follow_request_declined'.
      // Mirror that locally so the card stays in the list as history.
      initialUnreadRef.current?.delete(n.id);
      setNotifs((prev) =>
        prev.map((x) =>
          x.id === n.id
            ? {
                ...x,
                kind: "follow_request_declined",
                title: "You declined this follow request",
                body: "Their follow request was declined.",
                is_read: true,
              }
            : x
        )
      );
    }
  }, []);

  const deleteNotif = useCallback(async (id: string) => {
    initialUnreadRef.current?.delete(id);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "60px 24px 80px",
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 999,
                background: CARD,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 40,
              }}
            >
              <Bell size={48} strokeWidth={1.5} color={MUTED} />
            </div>
            <p
              style={{
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 26,
                color: INK,
                margin: "0 0 14px",
                textAlign: "center",
                letterSpacing: "-0.3px",
              }}
            >
              No Notifications
            </p>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 17,
                color: MUTED,
                textAlign: "center",
                margin: 0,
              }}
            >
              When you receive notifications, they will appear here.
            </p>
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
  onDelete,
  actor,
  feedbackSubject,
  imageOverride,
}: {
  n: Notif;
  isUnread: boolean;
  onClick?: () => void;
  onRespond?: (n: Notif, accept: boolean) => void;
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

  const isUserRelated = n.kind === "follow_request" || n.kind === "follow_request_accepted" || n.kind === "follow_accepted" || n.kind === "follow_request_declined" || n.kind === "new_follower";
  // For "they accepted your request", the person to show is the account that was followed.
  const actorProfile = n.kind === "follow_accepted" ? (actor?.target || actor) : actor;
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
              onClick={(e) => { e.stopPropagation(); onRespond(n, true); }}
              style={{
                height: 32, padding: "0 16px", borderRadius: 999,
                background: BROWN, color: "#fff", border: "none",
                cursor: "pointer", fontFamily: SANS, fontSize: 13, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <Check size={14} strokeWidth={2.4} /> Accept
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRespond(n, false); }}
              style={{
                height: 32, padding: "0 16px", borderRadius: 999,
                background: "transparent", color: INK,
                border: `1px solid ${HAIRLINE}`, cursor: "pointer",
                fontFamily: SANS, fontSize: 13, fontWeight: 600,
              }}
            >
              Decline
            </button>
          </div>
        )}
        {n.kind === "follow_request_accepted" && n.link && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              style={{
                height: 32, padding: "0 16px", borderRadius: 999,
                background: BROWN, color: "#fff", border: "none",
                cursor: "pointer", fontFamily: SANS, fontSize: 13, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              Message
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
