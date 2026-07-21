import { Progress } from "vite_react_shadcn_ts";

const Row = ({ label, value }: { label: string; value: number }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 300 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
      <span>{label}</span>
      <span style={{ opacity: 0.7 }}>{value}%</span>
    </div>
    <Progress value={value} />
  </div>
);

export const Levels = () => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
    <Row label="Profile completeness" value={20} />
    <Row label="Booking progress" value={60} />
    <Row label="Listing setup" value={90} />
  </div>
);

export const SingleBar = () => (
  <div style={{ padding: 24, width: 300 }}>
    <div style={{ fontSize: 13, marginBottom: 8 }}>Macadamia harvest target</div>
    <Progress value={75} />
  </div>
);
