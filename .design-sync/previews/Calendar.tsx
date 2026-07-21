import { Calendar } from "vite_react_shadcn_ts";

export const SingleDate = () => (
  <div style={{ padding: 16, display: "inline-block" }}>
    <Calendar
      mode="single"
      selected={new Date(2026, 6, 18)}
      defaultMonth={new Date(2026, 6, 18)}
      className="rounded-md border"
    />
  </div>
);

export const StayRange = () => (
  <div style={{ padding: 16, display: "inline-block" }}>
    <Calendar
      mode="range"
      selected={{ from: new Date(2026, 6, 18), to: new Date(2026, 6, 22) }}
      defaultMonth={new Date(2026, 6, 18)}
      className="rounded-md border"
    />
  </div>
);
