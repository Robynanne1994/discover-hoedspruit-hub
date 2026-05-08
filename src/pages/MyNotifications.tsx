import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronRight, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BackButton from "@/components/BackButton";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const OLIVE = "#5C6446";
const DEEP_OLIVE = "#454C36";
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

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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

  useEffect(() => {
    const id = "playfair-notif-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300;1,400&display=swap";
    document.head.appendChild(link);
  }, []);

  const load = useCallback(async () => {
    if (!user) { setNotifs([]); setLoaded(true); return; }
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
        { event: "*", schema: "public", table: "business_notifications", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  const markRead = async (id: string) => {
    await supabase.from("business_notifications").update({ is_read: true }).eq("id", id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    const unread = notifs.filter((n) => !n.is_read).map((n) => n.id);
    if (unread.length === 0) return;
    await supabase.from("business_notifications").update({ is_read: true }).in("id", unread);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <div style={{ minHeight: "100vh", background: OLIVE, fontFamily: SANS }}>
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: OLIVE,
          padding: "16px 24px 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <BackButton />
        <h1
          style={{
            flex: 1,
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 22,
            color: CREAM,
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: "-0.3px",
          }}
        >
          notifications
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              fontFamily: SANS,
              fontWeight: 400,
              fontSize: 12,
              color: RUST,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
              textTransform: "lowercase",
            }}
          >
            mark all read
          </button>
        )}
      </div>

      {/* Settings link */}
      <div style={{ padding: "0 24px 16px" }}>
        <button
          onClick={() => navigate("/notifications")}
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={release}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "12px 16px",
            background: SOFT_CREAM,
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            transition: "transform 100ms ease-out",
          }}
        >
          <Settings size={16} strokeWidth={1.6} color={MUTED} />
          <span style={{ flex: 1, fontSize: 14, color: INK, textAlign: "left" }}>Notification settings</span>
          <ChevronRight size={14} strokeWidth={1.6} color={MUTED} />
        </button>
      </div>

      {/* List */}
      <div style={{ padding: "0 24px 120px" }}>
        {loaded && notifs.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 24px",
              gap: 16,
            }}
          >
            <Bell size={32} strokeWidth={1.4} color={MUTED} style={{ opacity: 0.5 }} />
            <p
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 18,
                color: CREAM,
                opacity: 0.7,
                margin: 0,
              }}
            >
              No notifications yet
            </p>
            <p style={{ fontSize: 13, color: MUTED, margin: 0, textAlign: "center" }}>
              When something happens, it will appear here.
            </p>
          </div>
        )}

        {notifs.map((n, i) => (
          <div
            key={n.id}
            onClick={() => {
              if (!n.is_read) markRead(n.id);
              if (n.link) navigate(n.link);
            }}
            onPointerDown={press}
            onPointerUp={release}
            onPointerLeave={release}
            style={{
              background: CREAM,
              borderRadius: 16,
              padding: "16px 18px",
              marginBottom: i === notifs.length - 1 ? 0 : 6,
              cursor: n.link ? "pointer" : "default",
              transition: "transform 100ms ease-out",
              borderLeft: n.is_read ? "none" : `3px solid ${RUST}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              {!n.is_read && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: RUST,
                    flexShrink: 0,
                    marginTop: 5,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontWeight: n.is_read ? 400 : 600,
                      fontSize: 14,
                      color: INK,
                      lineHeight: 1.3,
                      flex: 1,
                    }}
                  >
                    {n.title}
                  </span>
                  <span style={{ fontSize: 11, color: MUTED, flexShrink: 0, whiteSpace: "nowrap" }}>
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                {n.body && (
                  <p
                    style={{
                      fontSize: 13,
                      color: MUTED,
                      lineHeight: 1.4,
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {n.body}
                  </p>
                )}
              </div>
              {n.link && (
                <ChevronRight size={14} strokeWidth={1.6} color={MUTED} style={{ flexShrink: 0, marginTop: 3 }} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
