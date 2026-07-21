import { HomeSectionHead } from "vite_react_shadcn_ts";

export const WithAction = () => (
  <div style={{ padding: "20px 20px", maxWidth: 440 }}>
    <HomeSectionHead primary="What's on this week" actionLabel="View all" actionHref="/events" />
  </div>
);

export const Plain = () => (
  <div style={{ padding: "20px 20px", maxWidth: 440 }}>
    <HomeSectionHead primary="Featured lodges" />
  </div>
);
