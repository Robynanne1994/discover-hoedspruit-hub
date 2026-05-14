import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Calendar, Clock, Heart, MapPin, Store, Sun, Tag, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BG = "#ebebeb";
const CARD = "#ffffff";
const INK = "#020202";
const MUTED = "#6b6b6b";
const BROWN = "#9b5a3c";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
  kind: string;
};

const formatTimestamp = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} at ${d
    .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
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

export default function MyNotifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loaded, setLoaded] = useState(false);
  // IDs that were unread when this page first opened — keep highlighted for the whole visit
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
        // Add any newly-arrived unread items to the highlighted set
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

  // Mark all as read shortly after viewing (visual highlight stays via initialUnreadRef)
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

  const { newItems, earlierItems } = useMemo(() => {
    const set = initialUnreadRef.current ?? new Set<string>();
    const n: Notif[] = [];
    const e: Notif[] = [];
    notifs.forEach((x) => (set.has(x.id) ? n.push(x) : e.push(x)));
    return { newItems: n, earlierItems: e };
  }, [notifs]);

  const isEmpty = loaded && notifs.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: CARD, fontFamily: SANS, color: INK }}>
      {/* Top bar */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "18px 20px",
          background: CARD,
          borderBottom: `1px solid ${BG}`,
        }}
      >
        <button
          onClick={() => navigate("/")}
          aria-label="Home"
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 2,
            background: "none",
            border: "none",
            padding: "6px 8px",
            cursor: "pointer",
            color: INK,
            fontFamily: SANS,
            fontSize: 17,
            fontWeight: 400,
          }}
        >
          <ChevronLeft size={22} strokeWidth={2} />
          <span>Home</span>
        </button>
        <h1
          style={{
            margin: 0,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 17,
            color: INK,
            letterSpacing: "-0.1px",
          }}
        >
          Notifications
        </h1>
      </div>

      {/* List */}
      <div style={{ background: BG, paddingBottom: 120 }}>
        {notifs.map((n) => {
          const Icon = iconFor(n.kind);
          return (
            <div
              key={n.id}
              onClick={() => n.link && navigate(n.link)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "16px 20px",
                background: BG,
                borderBottom: `1px solid #dcdcdc`,
                cursor: n.link ? "pointer" : "default",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: BROWN,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={22} strokeWidth={1.8} color="#ffffff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: "0 0 4px",
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
                      margin: "0 0 6px",
                      fontFamily: SANS,
                      fontWeight: 400,
                      fontSize: 14,
                      lineHeight: 1.4,
                      color: INK,
                    }}
                  >
                    {n.body}
                  </p>
                )}
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 13,
                    color: MUTED,
                  }}
                >
                  {formatTimestamp(n.created_at)}
                </span>
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
              padding: "60px 24px",
              background: BG,
            }}
          >
            <Bell size={48} strokeWidth={1.5} color={MUTED} style={{ opacity: 0.5 }} />
            <p
              style={{
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 17,
                color: INK,
                margin: "16px 0 8px",
              }}
            >
              No notifications yet
            </p>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14,
                color: MUTED,
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
