import { UserCard } from "vite_react_shadcn_ts";

export const Profile = () => (
  <div style={{ padding: 20, maxWidth: 420 }}>
    <UserCard user={{ id: "u1", display_name: "Robyn McD", avatar_url: null, location: "Hoedspruit" }} />
  </div>
);
