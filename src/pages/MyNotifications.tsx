import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Calendar, Clock, Heart, MapPin, Store, Sun, Tag, CheckCheck, Settings } from "lucide-react";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BG = "#E6E0CC";
const CARD = "#ffffff";
const INK = "#020202";
const MUTED = "#6B6A5E";
const BODY = "#3A332B";
const HAIRLINE = "rgba(0,0,0,0.06)";
const DOT = "#2A2A24";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
  kind: string;
};

const iconFor = (kind: string) => {
  const k = (kind || "").toLowerCase();
  if (k.includes("save") || k.includes("favourite") || k.includes("favorite")) return Heart;
  if (k.includes("special") || k.includes("deal") || k.includes("offer")) return Tag;
  if (k.includes("listing") || k.includes("place")) return Store;
  if (k.includes("reminder")) return Clock;
  if (k.includes("event")) return Calendar;
  if (k.includes("tip")) return Sun;
  if (k.includes("location") || k.includes("hours")) return MapPin;
  return Bell;
};

const tintFor = (kind: string): { bg: string; fg: string } => {
  const k = (kind || "").toLowerCase();
  if (k.includes("special") || k.includes("deal") || k.includes("offer")) return { bg: "#F8D7DE", fg: "#C0392B" };
  if (k.includes("event") || k.includes("reminder")) return { bg: "#E8E6DF", fg: INK };
  if (k.includes("security") || k.includes("alert")) return { bg: "#D6EBDB", fg: "#2E7D4F" };
  if (k.includes("welcome") || k.includes("profile") || k.includes("account")) return { bg: "#E8DCC8", fg: "#8B6F4B" };
  if (k.includes("save") || k.includes("favourite") || k.includes("favorite")) return { bg: "#F8D7DE", fg: "#C0392B" };
  return { bg: "#E8E6DF", fg: INK };
};

const relativeShort = (iso: string): string => {
  const then = new Date(iso).getTime();
  const diffMin = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (diffMin < 60) return `${Math.max(1, diffMin)}M AGO`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `${h}H AGO`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}D AGO`;
  const w = Math.round(d / 7);
  if (w < 5) return `${w}W AGO`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
};

const bucketOf = (iso: string): "today" | "yesterday" | "week" | "earlier" => {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const todayStart = startOfDay(now);
  const dStart = startOfDay(d);
  const dayDiff = Math.round((todayStart - dStart) / 86400000);
  if (dayDiff <= 0) return "today";
  if (dayDiff === 1) return "yesterday";
  if (dayDiff < 7) return "week";
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
      .select("id,title,body,link,is_read,created_at,kind")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
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
    const groups: Record<string, Notif[]> = { today: [], yesterday: [], week: [], earlier: [] };
    notifs.forEach((n) => groups[bucketOf(n.created_at)].push(n));
    return groups;
  }, [notifs]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const unread = notifs.filter((n) => !n.is_read).map((n) => n.id);
    if (unread.length === 0) return;
    await supabase.from("business_notifications").update({ is_read: true }).in("id", unread);
    initialUnreadRef.current = new Set();
    load();
  }, [user, notifs, load]);

  const isEmpty = loaded && notifs.length === 0;
  const hasUnread = unreadCount > 0;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, color: INK }}>
      {/* Top bar */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "56px 20px 18px",
          background: BG,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
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
          <BackArrowIcon size={20} color={INK} />
        </button>

        <div style={{ textAlign: "center", flex: 1 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 20,
              color: INK,
              letterSpacing: "-0.1px",
            }}
          >
            Notifications
          </h1>
          {hasUnread && (
            <div
              style={{
                marginTop: 4,
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
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
            <Settings size={20} strokeWidth={2} color={INK} />
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: HAIRLINE, margin: "0 0 8px" }} />

      {/* List */}
      <div style={{ padding: "0 20px 100px" }}>
        {(["today", "yesterday", "week", "earlier"] as const).map((key) => {
          const items = buckets[key];
          if (items.length === 0) return null;
          const label =
            key === "today" ? "Today" : key === "yesterday" ? "Yesterday" : key === "week" ? "This Week" : "Earlier";
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
              No notifications yet
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
              When something happens, it'll appear here.
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
}: {
  n: Notif;
  isUnread: boolean;
  onClick: () => void;
}) {
  const Icon = iconFor(n.kind);
  const tint = tintFor(n.kind);
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        background: CARD,
        borderRadius: 16,
        border: `1px solid ${HAIRLINE}`,
        padding: 16,
        cursor: n.link ? "pointer" : "default",
      }}
    >
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
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 400,
            fontSize: 11,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            color: MUTED,
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
