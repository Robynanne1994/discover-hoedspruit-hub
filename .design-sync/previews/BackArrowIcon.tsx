import { BackArrowIcon } from "vite_react_shadcn_ts";

export const Sizes = () => (
  <div style={{ display: "flex", gap: 24, alignItems: "center", padding: 24 }}>
    <BackArrowIcon size={16} />
    <BackArrowIcon size={20} />
    <BackArrowIcon size={28} />
    <BackArrowIcon size={36} />
  </div>
);

export const Colors = () => (
  <div style={{ display: "flex", gap: 16, alignItems: "center", padding: 24 }}>
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 9999,
        background: "#F3ECDD",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <BackArrowIcon size={20} color="#423324" />
    </div>
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 9999,
        background: "#423324",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <BackArrowIcon size={20} color="#F3ECDD" />
    </div>
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 9999,
        background: "#B8674A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <BackArrowIcon size={20} color="#FFFFFF" />
    </div>
  </div>
);

export const InHeader = () => (
  <div style={{ padding: 24, maxWidth: 480 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        background: "#FBF7EE",
        borderRadius: 14,
        border: "1px solid #E7DFCD",
      }}
    >
      <button
        aria-label="Go back"
        style={{
          width: 40,
          height: 40,
          borderRadius: 9999,
          background: "#F0E8D6",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <BackArrowIcon size={20} color="#423324" />
      </button>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 17,
            fontWeight: 600,
            color: "#2b2420",
          }}
        >
          Blyde River Canyon Lodge
        </div>
        <div style={{ fontSize: 13, color: "#8A8271" }}>Lodges · Hoedspruit</div>
      </div>
    </div>
  </div>
);
