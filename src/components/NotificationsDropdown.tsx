import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const INK = "#2A2A24";
const CREAM = "#EEE8DA";
const MUTED = "#6B6A5E";
const LINE = "#D9D2C0";
const RUST = "#9B5A3C";
const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
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
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setNotifs([]); setLoaded(true); return; }
    const { data } = await supabase
      .from("business_notifications")
      .select("id,title,body,link,is_read,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifs((data ?? []) as Notif[]);
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

  // Close on back
  useEffect(() => {
    if (!open) return;
    const onPop = () => setOpen(false);
    window.history.pushState({ notifBell: true }, "");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  const unread = notifs.filter((n) => !n.is_read).length;

  const onRowClick = async (n: Notif) => {
    setOpen(false);
    if (!n.is_read) {
      await supabase.from("business_notifications").update({ is_read: true }).eq("id", n.id);
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    if (!user) return;
    const ids = notifs.filter((n) => !n.is_read).map((n) => n.id);
    if (ids.length === 0) return;
    await supabase.from("business_notifications").update({ is_read: true }).in("id", ids);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
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
              background: "rgba(20, 20, 18, 0.35)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
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

              {notifs.map((n, i) => (
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
                    <div style={{ flex: 1, minWidth: 0, paddingLeft: n.is_read ? 17 : 0 }}>
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
                    </div>
                  </div>
                </button>
              ))}
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
