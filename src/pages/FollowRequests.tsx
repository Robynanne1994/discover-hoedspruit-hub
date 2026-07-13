import { useNavigate } from "react-router-dom";
import { Check, X, UserCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useFollowRequests, useRespondToFollowRequest } from "@/hooks/useFollows";

const PAGE_BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = "rgba(26,26,26,0.55)";
const LINE = "rgba(26,26,26,0.10)";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const WHITE = "#FFFFFF";
const PILL_BORDER = "#E8E4DF";

const initialsOf = (displayName?: string | null, username?: string | null) => {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    const first = parts[0][0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return `${first}${second}`.toUpperCase();
  }
  if (username?.trim()) return username.trim()[0].toUpperCase();
  return "";
};

const FollowRequests = () => {
  const navigate = useNavigate();
  const { data: requests, isLoading } = useFollowRequests();
  const respond = useRespondToFollowRequest();

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 100, fontFamily: SANS }}>
      <PageHeader title="Follow Requests" />

      <div style={{ padding: "16px 20px 0" }}>
        {isLoading ? (
          <div style={{ background: CARD, borderRadius: 18, padding: "6px 18px" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                }}
              >
                <Skeleton className="h-12 w-12 rounded-full" />
                <div style={{ flex: 1 }}>
                  <Skeleton className="h-4 w-32 mb-2 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (requests?.length ?? 0) === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <p style={{ fontFamily: SANS, fontSize: 14, color: MUTED, margin: 0 }}>
              No follow requests right now.
            </p>
          </div>
        ) : (
          <div style={{ background: CARD, borderRadius: 18, padding: "6px 18px" }}>
            {requests!.map((u: any, i: number) => {
              const handle = u.username
                ? `@${u.username.toLowerCase()}`
                : `@${(u.display_name || "user").toLowerCase().replace(/\s+/g, "")}`;
              return (
                <div
                  key={u.request_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 0",
                    borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                  }}
                >
                  <button
                    onClick={() => navigate(`/profile/${u.id}`)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      flexShrink: 0,
                      overflow: "hidden",
                      background: "linear-gradient(135deg, #8a6f4d, #c4a374)",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontFamily: SANS,
                      fontSize: 16,
                    }}
                  >
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      initialsOf(u.display_name)
                    )}
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${u.id}`)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 15,
                        color: INK,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.display_name || "User"}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>{handle}</div>
                  </button>
                  <button
                    disabled={respond.isPending}
                    onClick={() => respond.mutate({ requestId: u.request_id, accept: true })}
                    aria-label="Accept"
                    style={{
                      height: 36,
                      width: 36,
                      borderRadius: 999,
                      background: "#423324",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={16} strokeWidth={2} />
                  </button>
                  <button
                    disabled={respond.isPending}
                    onClick={() => respond.mutate({ requestId: u.request_id, accept: false })}
                    aria-label="Decline"
                    style={{
                      height: 36,
                      width: 36,
                      borderRadius: 999,
                      background: "transparent",
                      border: `1px solid ${LINE}`,
                      color: INK,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowRequests;
