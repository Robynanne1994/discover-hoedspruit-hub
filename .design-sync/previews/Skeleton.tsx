import { Skeleton } from "vite_react_shadcn_ts";

export const ListingCardLoading = () => (
  <div style={{ padding: 24 }}>
    <div
      style={{
        width: 320,
        border: "1px solid #dcd4c0",
        borderRadius: 12,
        overflow: "hidden",
        background: "#fbf8f1",
      }}
    >
      <Skeleton style={{ height: 160, width: "100%", borderRadius: 0 }} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Skeleton style={{ height: 40, width: 40, borderRadius: 9999 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <Skeleton style={{ height: 12, width: "70%" }} />
            <Skeleton style={{ height: 12, width: "40%" }} />
          </div>
        </div>
        <Skeleton style={{ height: 10, width: "100%" }} />
        <Skeleton style={{ height: 10, width: "90%" }} />
        <Skeleton style={{ height: 10, width: "60%" }} />
      </div>
    </div>
  </div>
);

export const TextLines = () => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10, width: 280 }}>
    <Skeleton style={{ height: 14, width: "80%" }} />
    <Skeleton style={{ height: 10, width: "100%" }} />
    <Skeleton style={{ height: 10, width: "100%" }} />
    <Skeleton style={{ height: 10, width: "55%" }} />
  </div>
);
