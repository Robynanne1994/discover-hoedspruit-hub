import { useModerationStatus } from "@/hooks/useModerationStatus";

const STYLES: Record<string, { bg: string; ink: string; label: string }> = {
  warned: { bg: "#FEF3C7", ink: "#7C4A03", label: "Account warning" },
  suspended: { bg: "#FEE2E2", ink: "#7F1D1D", label: "Account suspended" },
  banned: { bg: "#1F1F1F", ink: "#FFFFFF", label: "Account banned" },
};

const ModerationBanner = () => {
  const { data } = useModerationStatus();
  if (!data || data.status === "active") return null;

  // Auto-cleared on the server when read; double-check client side too.
  if (
    data.status === "suspended" &&
    data.suspended_until &&
    new Date(data.suspended_until) <= new Date()
  ) {
    return null;
  }

  const cfg = STYLES[data.status] ?? STYLES.warned;
  const until =
    data.status === "suspended" && data.suspended_until
      ? new Date(data.suspended_until).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

  return (
    <div
      role="status"
      style={{
        background: cfg.bg,
        color: cfg.ink,
        padding: "10px 16px",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: 13,
        textAlign: "center",
        lineHeight: 1.45,
      }}
    >
      <strong style={{ fontWeight: 700 }}>{cfg.label}.</strong>{" "}
      {data.status === "warned" && "Please review our community guidelines."}
      {data.status === "suspended" && (
        <>You cannot post, follow, or submit content until {until}.</>
      )}
      {data.status === "banned" && "You can browse but cannot post or follow."}
      {data.reason ? <> · {data.reason}</> : null}
    </div>
  );
};

export default ModerationBanner;
