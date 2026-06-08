import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const BODY = "#3A342B";
const MUTED = "#8A8275";
const LINE = "rgba(26,26,26,0.08)";
const NUM_BG = "rgba(26,26,26,0.06)";

const values = [
  { num: "01", name: "Local Knowledge", sub: "Curated by people who live here." },
  { num: "02", name: "Community Driven", sub: "Connecting locals and visitors." },
  { num: "03", name: "Always up to Date", sub: "The latest events and places." },
  { num: "04", name: "Nature at Heart", sub: "Protecting our beautiful lowveld." },
];

const tap = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(0.96)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
};

const About = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, color: INK, paddingBottom: 140 }}>
      {/* Top bar */}
      <PageHeader title="About" />

      {/* Story card */}
      <div style={{ padding: "20px 20px 0" }}>
        <section style={{ background: CARD, borderRadius: 18, padding: "22px 22px 24px" }}>
          <p style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.6, color: BODY, margin: 0, marginBottom: 14 }}>
            My name is <span style={{ fontStyle: "italic", fontWeight: 500 }}>Robyn Dawes</span>, and Hoedspruit has been my home for as long as I can remember. I grew up surrounded by the beauty of the lowveld, and over the years I've watched this little town blossom into something truly special.
          </p>
          <p style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.6, color: BODY, margin: 0, marginBottom: 14 }}>
            Having spent my whole life here, I know just how much Hoedspruit has to offer, from incredible wildlife and outdoor adventures to its warm community spirit and the hidden gems that only a local would know.
          </p>
          <p style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.6, color: BODY, margin: 0 }}>
            The idea behind Hello Hoedspruit came from a simple frustration. There was no single place where visitors and locals alike could find everything our town has to offer. Whether you're planning a trip, new to the area, or a fellow lifelong local, Hello Hoedspruit is my way of bringing our community together.
          </p>
        </section>
      </div>

      {/* Section heading */}
      <div style={{ padding: "28px 22px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: MUTED, marginBottom: 6, textTransform: "uppercase" }}>
          Our Values
        </div>
        <h2 style={{ fontFamily: SANS, fontSize: 26, fontWeight: 700, lineHeight: 1.15, letterSpacing: -0.3, color: INK, margin: 0 }}>
          What We Stand For
        </h2>
      </div>

      {/* Value list */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {values.map((v) => (
          <div
            key={v.num}
            style={{
              background: CARD,
              borderRadius: 18,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              aria-hidden
              style={{
                width: 44, height: 44, borderRadius: "50%", background: NUM_BG,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                fontSize: 13, fontWeight: 600, color: INK, letterSpacing: 0.2,
              }}
            >
              {v.num}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 15.5, fontWeight: 700, color: INK, letterSpacing: -0.1, lineHeight: 1.2 }}>
                {v.name}
              </span>
              <span style={{ fontSize: 13, fontWeight: 400, color: MUTED, lineHeight: 1.35 }}>
                {v.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default About;
