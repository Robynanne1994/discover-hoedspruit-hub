import { useEffect, useState, useCallback, useMemo, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Calendar, Clock, Heart, MapPin, Settings, Store, Sun, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BackButton from "@/components/BackButton";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const OLIVE = "#5C6446";
const OLIVE_DEEP = "#454C36";
const CREAM = "#EEE8DA";
const SOFT_CREAM = "#F4EFE3";
const INK = "#2A2A24";
const MUTED = "#6B6A5E";
const LINE = "#D9D2C0";
const RUST = "#9B5A3C";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
  kind: string;
};

// --- Time helpers ---
const HOUR = 3600_000;
const DAY = 86_400_000;

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / HOUR);
  const days = Math.floor(diff / DAY);
  const weeks = Math.floor(days / 7);
  if (mins < 1) return "JUST NOW";
  if (mins < 60) return `${mins} MIN AGO`;
  if (hrs < 24) return `${hrs} ${hrs === 1 ? "HOUR" : "HOURS"} AGO`;
  if (days === 1) return "YESTERDAY";
  if (days < 7) return `${days} DAYS AGO`;
  if (weeks < 5) return `${weeks} ${weeks === 1 ? "WEEK" : "WEEKS"} AGO`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
};

const sectionFor = (iso: string): "today" | "week" | "earlier" => {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < DAY) return "today";
  if (diff < 7 * DAY) return "week";
  return "earlier";
};

// --- Icon circle styling per kind ---
type IconVariant = "system" | "rust" | "olive" | "avatar";

const kindMeta = (kind: string): { variant: IconVariant; Icon?: typeof Bell } => {
  const k = (kind || "").toLowerCase();
  if (k.includes("follow") || k.includes("recommend") || k.includes("going") || k.includes("social")) {
    return { variant: "avatar" };
  }
  if (k.includes("save") || k.includes("favourite") || k.includes("favorite")) {
    return { variant: "rust", Icon: Heart };
  }
  if (k.includes("special") || k.includes("deal") || k.includes("offer")) {
    return { variant: "rust", Icon: Tag };
  }
  if (k.includes("listing_update") || k.includes("listing-update") || k.includes("hours") || k.includes("photos")) {
    return { variant: "olive", Icon: MapPin };
  }
  if (k.includes("event_reminder") || k.includes("reminder")) {
    return { variant: "system", Icon: Clock };
  }
  if (k.includes("event")) {
    return { variant: "system", Icon: Calendar };
  }
  if (k.includes("listing") || k.includes("place")) {
    return { variant: "system", Icon: Store };
  }
  if (k.includes("tip")) {
    return { variant: "system", Icon: Sun };
  }
  return { variant: "system", Icon: Bell };
};

// Warm gradient palette for avatar circles
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #B8714A, #6B3A2A)",
  "linear-gradient(135deg, #C99A6B, #7A5436)",
  "linear-gradient(135deg, #9B5A3C, #5C2E1B)",
  "linear-gradient(135deg, #A8825A, #6F4E2E)",
  "linear-gradient(135deg, #C77E5C, #7B4128)",
];

const initialsFor = (title: string) => {
  // Try to extract first capitalised word(s) from title
  const match = title.match(/^([A-Z][a-z]+)(?:\s+([A-Z][a-z]+))?/);
  if (match) {
    const a = match[1]?.[0] ?? "";
    const b = match[2]?.[0] ?? "";
    return (a + b).toUpperCase() || "•";
  }
  return title.slice(0, 1).toUpperCase() || "•";
};

const hashIndex = (s: string, mod: number) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
};

// --- Inline-name renderer: regular sans for capitalised proper nouns ---
const renderBody = (text: string) => {
  // Split keeping multi-word Title Case sequences as single tokens
  const tokens = text.split(/(\s+|[.,!?:;])/);
  let buffer: string[] = [];
  const out: React.ReactNode[] = [];
  let key = 0;
  const flushBuffer = () => {
    if (buffer.length > 0) {
      out.push(
        <span
          key={`n-${key++}`}
          style={{ fontFamily: SANS, fontStyle: "normal", color: INK, opacity: 1 }}
        >
          {buffer.join("")}
        </span>
      );
      buffer = [];
    }
  };
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (/^[A-Z][a-zA-Z'’]+$/.test(t)) {
      // collect a Title Case run, possibly multi-word with single spaces
      const run: string[] = [t];
      let j = i + 1;
      while (
        j + 1 < tokens.length &&
        /^\s+$/.test(tokens[j]) &&
        /^[A-Z][a-zA-Z'’]+$/.test(tokens[j + 1])
      ) {
        run.push(tokens[j], tokens[j + 1]);
        j += 2;
      }
      buffer.push(run.join(""));
      i = j;
    } else {
      flushBuffer();
      out.push(<Fragment key={`t-${key++}`}>{t}</Fragment>);
      i++;
    }
  }
  flushBuffer();
  return out;
};

const press = (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "scale(0.98)";
};
const release = (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "scale(1)";
};

export default function MyNotifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dotsVisible, setDotsVisible] = useState(true);

  useEffect(() => {
    const id = "playfair-notif-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300;1,400&display=swap";
    document.head.appendChild(link);
  }, []);

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
    if (!error) setNotifs((data ?? []) as Notif[]);
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

  // After viewing for 1s, fade unread dots; mark all as read in DB after fade.
  useEffect(() => {
    if (!loaded || notifs.length === 0) return;
    const t1 = setTimeout(() => setDotsVisible(false), 1000);
    const t2 = setTimeout(async () => {
      const unread = notifs.filter((n) => !n.is_read).map((n) => n.id);
      if (unread.length > 0) {
        await supabase.from("business_notifications").update({ is_read: true }).in("id", unread);
      }
    }, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loaded, notifs]);

  const clearAllRead = async () => {
    const readIds = notifs.filter((n) => n.is_read).map((n) => n.id);
    if (readIds.length === 0) return;
    await supabase.from("business_notifications").delete().in("id", readIds);
    setNotifs((prev) => prev.filter((n) => !n.is_read));
  };

  const grouped = useMemo(() => {
    const today: Notif[] = [];
    const week: Notif[] = [];
    const earlier: Notif[] = [];
    notifs.forEach((n) => {
      const s = sectionFor(n.created_at);
      if (s === "today") today.push(n);
      else if (s === "week") week.push(n);
      else earlier.push(n);
    });
    return { today, week, earlier };
  }, [notifs]);

  const unreadCount = notifs.filter((n) => !n.is_read).length;
  const hasReadAny = notifs.some((n) => n.is_read);
  const isEmpty = loaded && notifs.length === 0;

  const subMeta = unreadCount > 0
    ? `${unreadCount} new since you last looked.`
    : "All caught up.";

  const counterFor = (key: "today" | "week" | "earlier", items: Notif[]) => {
    if (key === "earlier") return "ALL CAUGHT UP";
    const unread = items.filter((n) => !n.is_read).length;
    if (key === "today") {
      return unread > 0 ? `${unread} ${unread === 1 ? "NEW" : "NEW"}` : `${items.length} TODAY`;
    }
    // week
    return `${items.length} ${items.length === 1 ? "UPDATE" : "UPDATES"}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: OLIVE, fontFamily: SANS }}>
      {/* Compact top bar */}
      <div
        style={{
          padding: "32px 24px 0",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <BackButton />
        <h1
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 32,
            lineHeight: 1.0,
            letterSpacing: "-0.5px",
            color: CREAM,
            margin: 0,
          }}
        >
          notifications.
        </h1>
      </div>

      {/* Sub-meta */}
      <div style={{ padding: "16px 24px 22px" }}>
        <p
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 15,
            color: CREAM,
            opacity: 0.7,
          }}
        >
          {subMeta}
        </p>
      </div>

      {/* Settings link */}
      <div style={{ padding: "0 24px", marginBottom: 28 }}>
        <button
          onClick={() => navigate("/notifications")}
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={release}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: "14px 18px",
            background: SOFT_CREAM,
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            transition: "transform 100ms ease-out",
          }}
        >
          <Settings size={18} strokeWidth={1.5} color={MUTED} style={{ flexShrink: 0 }} />
          <span
            style={{
              flex: 1,
              fontSize: 15,
              fontFamily: SANS,
              color: INK,
              textAlign: "left",
              letterSpacing: "-0.1px",
            }}
          >
            Notification settings
          </span>
          <span style={{ fontSize: 14, color: MUTED, flexShrink: 0, lineHeight: 1 }}>›</span>
        </button>
      </div>

      <div style={{ padding: "0 0 120px" }}>
        {/* Sections */}
        {(["today", "week", "earlier"] as const).map((key) => {
          const items = grouped[key];
          if (items.length === 0) return null;
          const heading = key === "today" ? "today" : key === "week" ? "this week" : "earlier";
          return (
            <div key={key} style={{ marginBottom: 24 }}>
              {/* Section heading */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  padding: "0 24px",
                  marginBottom: 12,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: 26,
                    lineHeight: 1.0,
                    letterSpacing: "-0.4px",
                    color: CREAM,
                  }}
                >
                  {heading}
                </h2>
                <span
                  style={{
                    fontFamily: SANS,
                    fontWeight: 400,
                    fontSize: 11,
                    letterSpacing: "1.8px",
                    textTransform: "uppercase",
                    color: CREAM,
                    opacity: 0.7,
                  }}
                >
                  {counterFor(key, items)}
                </span>
              </div>

              {/* Card */}
              <div
                style={{
                  margin: "0 24px",
                  background: CREAM,
                  borderRadius: 20,
                  padding: "4px 20px",
                }}
              >
                {items.map((n, idx) => {
                  const meta = kindMeta(n.kind);
                  const showDot = !n.is_read && dotsVisible;
                  return (
                    <div
                      key={n.id}
                      onClick={() => n.link && navigate(n.link)}
                      onPointerDown={press}
                      onPointerUp={release}
                      onPointerLeave={release}
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "14px 0",
                        borderTop: idx === 0 ? "none" : `1px solid ${LINE}`,
                        cursor: n.link ? "pointer" : "default",
                        transition: "transform 100ms ease-out, opacity 400ms ease",
                      }}
                    >
                      {showDot && (
                        <span
                          style={{
                            position: "absolute",
                            left: -10,
                            top: 24,
                            width: 6,
                            height: 6,
                            borderRadius: 999,
                            background: RUST,
                            transition: "opacity 400ms ease",
                          }}
                        />
                      )}

                      {/* Icon circle */}
                      <IconCircle notif={n} variant={meta.variant} Icon={meta.Icon} />

                      {/* Body */}
                      <div style={{ flex: 1, minWidth: 0, marginTop: 0 }}>
                        <p
                          style={{
                            margin: "0 0 4px",
                            fontFamily: SERIF,
                            fontStyle: "italic",
                            fontWeight: 400,
                            fontSize: 14.5,
                            lineHeight: 1.45,
                            color: INK,
                          }}
                        >
                          {renderBody(n.body || n.title)}
                        </p>
                        <span
                          style={{
                            fontFamily: SANS,
                            fontSize: 11,
                            letterSpacing: "1.6px",
                            textTransform: "uppercase",
                            color: MUTED,
                            opacity: 0.85,
                          }}
                        >
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Clear all read footer */}
        {hasReadAny && !isEmpty && (
          <div
            style={{
              margin: "0 24px",
              paddingTop: 18,
              borderTop: "1px solid rgba(238, 232, 218, 0.18)",
              textAlign: "center",
            }}
          >
            <button
              onClick={clearAllRead}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 15,
                color: CREAM,
                opacity: 0.55,
                padding: "4px 8px",
              }}
            >
              clear all read.
            </button>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "32px 24px 0",
            }}
          >
            <Bell size={48} strokeWidth={1.5} color={CREAM} style={{ opacity: 0.5 }} />
            <p
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 22,
                color: CREAM,
                opacity: 0.8,
                margin: "16px 0 12px",
              }}
            >
              No notifications yet.
            </p>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14,
                lineHeight: 1.55,
                color: CREAM,
                opacity: 0.7,
                maxWidth: 260,
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

function IconCircle({
  notif,
  variant,
  Icon,
}: {
  notif: Notif;
  variant: IconVariant;
  Icon?: typeof Bell;
}) {
  const size = 36;
  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: "50%",
    marginTop: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  if (variant === "avatar") {
    const grad = AVATAR_GRADIENTS[hashIndex(notif.id, AVATAR_GRADIENTS.length)];
    return (
      <div style={{ ...baseStyle, background: grad }}>
        <span
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 14,
            color: CREAM,
            lineHeight: 1,
          }}
        >
          {initialsFor(notif.title)}
        </span>
      </div>
    );
  }

  if (variant === "rust") {
    const isHeart = (notif.kind || "").toLowerCase().includes("save") ||
      (notif.kind || "").toLowerCase().includes("favourite");
    return (
      <div style={{ ...baseStyle, background: RUST }}>
        {isHeart ? (
          <Heart size={18} strokeWidth={1.6} color={CREAM} fill={CREAM} />
        ) : Icon ? (
          <Icon size={18} strokeWidth={1.6} color={CREAM} />
        ) : null}
      </div>
    );
  }

  if (variant === "olive") {
    return (
      <div style={{ ...baseStyle, background: OLIVE_DEEP }}>
        {Icon ? <Icon size={18} strokeWidth={1.6} color={CREAM} /> : null}
      </div>
    );
  }

  // system
  return (
    <div style={{ ...baseStyle, background: SOFT_CREAM }}>
      {Icon ? <Icon size={18} strokeWidth={1.6} color={INK} /> : null}
    </div>
  );
}
