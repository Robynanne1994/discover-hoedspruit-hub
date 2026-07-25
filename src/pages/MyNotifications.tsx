import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Calendar, Clock, Heart, MapPin, Store, Sun, Tag, CheckCheck, Settings, Check, UserPlus, Megaphone, MoreHorizontal, MessageSquare, Send } from "lucide-react";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollowRequestActors, FollowActor } from "@/hooks/useFollowRequestActors";
import { titleCaseSubject } from "@/lib/titleCaseSubject";

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
        .filter((n) => (n.kind === "follow_request" || n.kind === "follow_request_accepted") && n.ref_id)
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
                    onClick={() => n.link && navigate(n.link)}
                    onRespond={respondFollowRequest}
                    actor={n.ref_id ? actorMap[n.ref_id] : undefined}
                    feedbackSubject={n.kind === "feedback_reply" && n.ref_id ? feedbackSubjects[n.ref_id] : undefined}
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
  actor,
  feedbackSubject,
}: {
  n: Notif;
  isUnread: boolean;
  onClick: () => void;
  onRespond?: (n: Notif, accept: boolean) => void;
  actor?: FollowActor;
  feedbackSubject?: string;
}) {
  const Icon = iconFor(n.kind);
  const tint = tintFor(n.kind);
  const isFeedbackReply = n.kind === "feedback_reply";
  const isUserRelated = n.kind === "follow_request" || n.kind === "follow_request_accepted";
  const showIcon = !isFeedbackReply && !isUserRelated;
  const initials = (actor?.display_name || "·")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: showIcon ? 14 : 0,
        background: CARD,
        borderRadius: 16,
        border: `1px solid ${HAIRLINE}`,
        padding: 16,
        cursor: n.link ? "pointer" : "default",
      }}
    >
      {showIcon && (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: tint.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={22} strokeWidth={1.8} color={tint.fg} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, paddingRight: isUnread ? 14 : 0 }}>
        <p
          style={{
            margin: 0,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 15,
            lineHeight: 1.3,
            color: INK,
            letterSpacing: "-0.1px",
          }}
        >
          {n.title}
        </p>
        {isFeedbackReply && feedbackSubject && (
          <p
            style={{
              margin: "4px 0 0",
              fontFamily: SANS,
              fontSize: 12,
              color: INK,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Subject:</span>{" "}
            <span style={{ fontWeight: 500 }}>{titleCaseSubject(feedbackSubject)}</span>
          </p>
        )}
        {n.body && (
          <p
            style={{
              margin: "4px 0 8px",
              fontFamily: SANS,
              fontWeight: 400,
              fontSize: 13.5,
              lineHeight: 1.45,
              color: BODY,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {n.body}
          </p>
        )}
        {n.kind === "follow_request" && n.ref_id && onRespond && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRespond(n, true);
              }}
              style={{
                height: 34,
                padding: "0 16px",
                borderRadius: 999,
                background: BROWN,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Check size={14} strokeWidth={2.4} /> Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRespond(n, false);
              }}
              style={{
                height: 34,
                padding: "0 16px",
                borderRadius: 999,
                background: "transparent",
                color: INK,
                border: `1px solid ${HAIRLINE}`,
                cursor: "pointer",
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Decline
            </button>
          </div>
        )}
        {n.kind === "follow_request_accepted" && n.link && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              style={{
                height: 34,
                padding: "0 16px",
                borderRadius: 999,
                background: BROWN,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Message
            </button>
          </div>
        )}

        <span
          style={{
            display: "inline-block",
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 11,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            color: MUTED,
            marginTop: 8,
          }}
        >
          {relativeShort(n.created_at)}
        </span>
      </div>
      {isUnread && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 8,
            height: 8,
            borderRadius: 999,
            background: DOT,
          }}
        />
      )}
    </div>
  );
}
