import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollowRequestActors } from "@/hooks/useFollowRequestActors";

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
      .select("id,title,body,link,is_read,created_at,kind,ref_table,ref_id")
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

  const unread = notifs.filter((n) => !n.is_read).length;

  const followRequestRefIds = notifs.filter((n) => n.kind === "follow_request" && n.ref_id).map((n) => n.ref_id as string);
  const actorMap = useFollowRequestActors(followRequestRefIds);

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

  const respondFollowRequest = async (n: Notif, accept: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!n.ref_id) return;
    if (accept) {
      await supabase
        .from("follows")
        .update({ status: "accepted", responded_at: new Date().toISOString() } as any)
        .eq("id", n.ref_id);
    } else {
      await supabase.from("follows").delete().eq("id", n.ref_id);
    }
    // Trigger removes the notification row; refresh local list optimistically.
    setNotifs((prev) => prev.filter((x) => x.id !== n.id));
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
                    {n.kind === "follow_request" && n.ref_id && actorMap[n.ref_id] && (
                      <div
                        style={{
                          width: 32, height: 32, borderRadius: 999, overflow: "hidden", flexShrink: 0,
                          background: "linear-gradient(135deg, #8a6f4d, #c4a374)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontFamily: SANS, fontSize: 12, fontWeight: 600,
                        }}
                      >
                        {actorMap[n.ref_id]?.avatar_url ? (
                          <img
                            src={actorMap[n.ref_id]!.avatar_url!}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          (actorMap[n.ref_id]?.display_name || "·")
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((p) => p[0]?.toUpperCase() ?? "")
                            .join("")
                        )}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0, paddingLeft: n.is_read && !(n.kind === "follow_request" && n.ref_id && actorMap[n.ref_id]) ? 17 : 0 }}>
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
                      {n.kind === "follow_request" && n.ref_id && (
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <button
                            onClick={(e) => respondFollowRequest(n, true, e)}
                            style={{
                              height: 30,
                              padding: "0 14px",
                              borderRadius: 999,
                              background: INK,
                              color: CREAM,
                              border: "none",
                              cursor: "pointer",
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
                            onClick={(e) => respondFollowRequest(n, false, e)}
                            style={{
                              height: 30,
                              padding: "0 14px",
                              borderRadius: 999,
                              background: "transparent",
                              color: INK,
                              border: `1px solid ${LINE}`,
                              cursor: "pointer",
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
