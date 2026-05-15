import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const OLIVE = "#5C6446";
const DEEP_OLIVE = "#454C36";
const CREAM = "#EEE8DA";
const DEEP_INK = "#2A2A24";
const MUTED_INK = "#6B6A5E";
const RUST = "#9B5A3C";
const DEEP_RUST = "#7E4530";

const BLOB_1 = "50% 45% 55% 50% / 55% 50% 60% 45%";
const BLOB_2 = "55% 45% 50% 55% / 50% 60% 45% 55%";

const FOUNDER_NAME = "Robyn Dawes";
const FOUNDER_INITIALS = "RD";
const FOUNDER_PHOTO: string | null = null;

const values = [
  { num: "i.", name: "Local Knowledge" },
  { num: "ii.", name: "Community Driven" },
  { num: "iii.", name: "Always up to Date" },
  { num: "iv.", name: "Nature at Heart" },
];

const press = (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "scale(0.98)";
};
const release = (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "scale(1)";
};

const BackArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={DEEP_INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const Arrow = ({ size = 12, color = DEEP_INK }: { size?: number; color?: string }) => (
  <span style={{ fontSize: size, color, lineHeight: 1, fontFamily: SANS }}>↗</span>
);

const About = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const id = "playfair-about-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300;1,400&display=swap";
    document.head.appendChild(link);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: OLIVE, fontFamily: SANS, color: CREAM, paddingBottom: 140, position: "relative", overflowX: "hidden" }}>
      {/* Top header — 60px top spacing, centered title, hairline border */}
      <div style={{ position: "relative", zIndex: 3, paddingTop: 60 }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", minHeight: 32, marginBottom: 16 }}>
          <button
            onClick={() => navigate(-1)}
            onPointerDown={press}
            onPointerUp={release}
            onPointerLeave={release}
            aria-label="Back"
            style={{
              position: "absolute",
              left: 24,
              top: "50%",
              transform: "translateY(-50%)",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "transparent",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={CREAM} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 style={{ fontFamily: SANS, fontSize: 20, fontWeight: 600, color: CREAM, margin: 0, letterSpacing: "0.01em" }}>
            About
          </h1>
        </div>
        <div style={{ height: 1, width: "100%", background: "rgba(238,232,218,0.2)", marginBottom: 24 }} />
      </div>


      {/* Story */}
      <div style={{ padding: "0 24px", marginBottom: 36 }}>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(238,232,218,0.9)", margin: 0, marginBottom: 18 }}>
          My name is{" "}
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 15 }}>Robyn Dawes</span>
          , and Hoedspruit has been my home for as long as I can remember. I grew up surrounded by the beauty of the lowveld, and over the years I've watched this little town blossom into something truly special.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(238,232,218,0.9)", margin: 0, marginBottom: 18 }}>
          Having spent my whole life here, I know just how much Hoedspruit has to offer, from incredible wildlife and outdoor adventures to its warm community spirit and the hidden gems that only a local would know.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(238,232,218,0.9)", margin: 0 }}>
          The idea behind Hello Hoedspruit came from a simple frustration. There was no single place where visitors and locals alike could find everything our town has to offer. Whether you're planning a trip, new to the area, or a fellow lifelong local, Hello Hoedspruit is my way of bringing our community together.
        </p>
      </div>

      {/* What we stand for heading */}
      <div style={{ padding: "0 24px", margin: "0 0 16px" }}>
        <h2 style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 32, lineHeight: 1, letterSpacing: "-0.5px", color: CREAM, margin: 0 }}>
          what we stand for
        </h2>
      </div>

      {/* Value grid */}
      <div style={{ padding: "0 24px", marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {values.map((v) => (
            <div
              key={v.num}
              style={{
                position: "relative",
                background: CREAM,
                borderRadius: 20,
                padding: "20px 22px 22px",
                aspectRatio: "1 / 1",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 38, lineHeight: 1, letterSpacing: "-0.6px", color: MUTED_INK }}>
                {v.num}
              </span>
              <span style={{ fontSize: 17.5, fontWeight: 400, lineHeight: 1.2, letterSpacing: "-0.2px", color: DEEP_INK }}>
                {v.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default About;
