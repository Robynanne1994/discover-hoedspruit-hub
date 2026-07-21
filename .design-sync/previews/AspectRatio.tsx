import { AspectRatio } from "vite_react_shadcn_ts";

export const Wide = () => (
  <div style={{ padding: 24 }}>
    <div style={{ width: 320, borderRadius: 12, overflow: "hidden", border: "1px solid #dcd4c0" }}>
      <AspectRatio ratio={16 / 9}>
        <img
          src="https://images.unsplash.com/photo-1516426122078-c23e76319801?w=640&h=360&fit=crop"
          alt="Bushveld at sunset"
          style={{ height: "100%", width: "100%", objectFit: "cover", display: "block", background: "#7a5c43" }}
        />
      </AspectRatio>
    </div>
  </div>
);

export const Square = () => (
  <div style={{ padding: 24 }}>
    <div style={{ width: 220, borderRadius: 12, overflow: "hidden", border: "1px solid #dcd4c0" }}>
      <AspectRatio ratio={1}>
        <img
          src="https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=440&h=440&fit=crop"
          alt="Elephant in the reserve"
          style={{ height: "100%", width: "100%", objectFit: "cover", display: "block", background: "#8a9a5b" }}
        />
      </AspectRatio>
    </div>
  </div>
);
