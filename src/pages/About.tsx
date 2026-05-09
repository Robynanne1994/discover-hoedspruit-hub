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
  { num: "iii.", name: "Always Up To Date" },
  { num: "iv.", name: "Nature At Heart" },
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
    <div style={{ minHeight: "100vh", background: OLIVE, fontFamily: SANS, color: CREAM, paddingBottom: 140 }}>
      {/* Top bar */}
      <div style={{ position: "relative", zIndex: 3, padding: "32px 24px 0" }}>
        <button
          onClick={() => navigate(-1)}
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={release}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: CREAM,
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "transform 150ms ease-out",
          }}
        >
          <BackArrow />
        </button>
      </div>

      {/* Hero */}
      <div style={{ position: "relative", padding: "18px 24px 0", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: -40, right: -80, width: 220, height: 240, background: DEEP_OLIVE, borderRadius: BLOB_1, opacity: 0.85, zIndex: 1 }} />
        <div aria-hidden style={{ position: "absolute", top: 60, right: -30, width: 120, height: 130, background: "rgba(238,232,218,0.08)", borderRadius: BLOB_2, zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 400, letterSpacing: "2.4px", textTransform: "uppercase", color: "rgba(238,232,218,0.7)", marginBottom: 14 }}>
            BEHIND THE APP
          </div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontStyle: "italic", fontSize: 72, lineHeight: 0.92, letterSpacing: "-2.5px", color: CREAM, margin: 0, marginBottom: 28 }}>
            about.
          </h1>
        </div>
      </div>

      {/* Founder card */}
      <div style={{ padding: "0 24px", marginBottom: 36, position: "relative", zIndex: 2 }}>
        <button
          onClick={() => navigate("/about")}
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={release}
          style={{
            width: "100%",
            background: CREAM,
            borderRadius: 20,
            padding: "14px 16px",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 14,
            cursor: "pointer",
            transition: "transform 150ms ease-out",
            textAlign: "left",
            fontFamily: SANS,
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              background: FOUNDER_PHOTO
                ? `url(${FOUNDER_PHOTO}) center/cover no-repeat`
                : "linear-gradient(135deg, #C18866 0%, #7E4530 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {!FOUNDER_PHOTO && (
              <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 24, color: CREAM }}>
                {FOUNDER_INITIALS}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 400, letterSpacing: "-0.1px", color: DEEP_INK, marginBottom: 2 }}>
              {FOUNDER_NAME}
            </div>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 13.5, color: MUTED_INK }}>
              Founder of Hello Hoedspruit
            </div>
          </div>
          <div
            aria-hidden
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(106,106,94,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Arrow size={12} color={DEEP_INK} />
          </div>
        </button>
      </div>

      {/* Meet the founder heading */}
      <div style={{ padding: "0 24px", display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "0 0 16px" }}>
        <h2 style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 32, lineHeight: 1, letterSpacing: "-0.5px", color: CREAM, margin: 0 }}>
          meet the founder
        </h2>
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

      {/* CTA card */}
      <div style={{ padding: "0 24px", marginBottom: 12 }}>
        <div style={{ position: "relative", background: RUST, borderRadius: 28, padding: "30px 28px 28px", overflow: "hidden" }}>
          <div aria-hidden style={{ position: "absolute", right: -80, bottom: -100, width: 240, height: 260, background: DEEP_RUST, borderRadius: BLOB_1, opacity: 0.6 }} />
          <div aria-hidden style={{ position: "absolute", right: -30, top: -60, width: 160, height: 170, background: "rgba(238,232,218,0.08)", borderRadius: BLOB_2 }} />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ fontSize: 11.5, fontWeight: 400, letterSpacing: "2.4px", textTransform: "uppercase", color: "rgba(238,232,218,0.8)", marginBottom: 14 }}>
              FOR LOCAL BUSINESSES
            </div>
            <h2 style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 300, fontSize: 38, lineHeight: 1, letterSpacing: "-1px", color: CREAM, margin: 0, marginBottom: 14 }}>
              Want to be listed?
            </h2>
            <p style={{ fontSize: 14.5, fontWeight: 400, lineHeight: 1.55, color: "rgba(238,232,218,0.9)", margin: 0, marginBottom: 24, maxWidth: 280 }}>
              If you run a business in Hoedspruit and want to reach more people, we'd love to feature you.
            </p>
            <button
              onClick={() => navigate("/advertise")}
              onPointerDown={press}
              onPointerUp={release}
              onPointerLeave={release}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: CREAM,
                borderRadius: 999,
                padding: "14px 22px",
                border: "none",
                cursor: "pointer",
                transition: "transform 150ms ease-out",
                fontFamily: SANS,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 400, color: DEEP_INK }}>Get In Touch</span>
              <Arrow size={14} color={DEEP_INK} />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default About;
