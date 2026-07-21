import { FollowButton } from "vite_react_shadcn_ts";

export const Default = () => (
  <div style={{ padding: 24, display: "flex", gap: 12, alignItems: "center" }}>
    <FollowButton targetUserId="user-2" />
  </div>
);
