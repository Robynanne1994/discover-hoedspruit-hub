import { ChevronLeft, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const DISPLAY = "'Helvetica Neue', Helvetica, 'Pragmatica', 'Inter', sans-serif";
const SERIF = "'Playfair Display', 'Helvetica Neue', serif";

const CORAL_GRADIENT =
  "radial-gradient(circle at 35% 30%, #F47356 0%, #EB6240 70%, #D9572F 100%)";

const values = [
  { num: "01", title: "Local knowledge" },
  { num: "02", title: "Community driven" },
  { num: "03", title: "Always up to date" },
  { num: "04", title: "Nature at heart" },
];

const paragraphs = [
  "My name is Robyn Dawes, and Hoedspruit has been my home for as long as I can remember. I grew up surrounded by the beauty of the Lowveld, and over the years I've watched this little town blossom into something truly special.",
  "Having spent my whole life here, I know just how much Hoedspruit has to offer, from incredible wildlife and outdoor adventures to its warm community spirit and hidden gems that only a local would know.",
  "The idea behind Hello Hoedspruit came from a simple frustration. There was no single place where visitors and locals alike could find everything our town has to offer. Whether you're planning a trip, new to the area, or a fellow lifelong local, Hello Hoedspruit is my way of bringing our community together.",
];

const press = (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "scale(0.98)";
};
const release = (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "scale(1)";
};

const About = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#EBEBEB", paddingBottom: 120, fontFamily: SANS, color: "#0A0A0A" }}>
      {/* Back */}
      <div style={{ paddingTop: 20, paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <button
          onClick={() => navigate(-1)}
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={release}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            transition: "transform 150ms ease-out",
            fontFamily: SANS,
          }}
        >
          <ChevronLeft size={20} strokeWidth={1.8} color="#0A0A0A" />
          <span style={{ fontSize: 15, fontWeight: 400, color: "#0A0A0A" }}>Back</span>
        </button>
      </div>

      {/* HEADER with coral circle */}
      <div style={{ position: "relative", paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
        {/* coral circle */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -30,
            right: -120,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: CORAL_GRADIENT,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.02em", color: "#8A8480", marginBottom: 8 }}>
            About
          </div>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 48,
              lineHeight: 0.98,
              letterSpacing: "-0.03em",
              color: "#0A0A0A",
              margin: 0,
              marginBottom: 14,
            }}
          >
            About Hello<br />Hoedspruit
          </h1>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.45,
              color: "#8A8480",
              margin: 0,
              maxWidth: 240,
            }}
          >
            Your full guide to Hoedspruit.
          </p>
        </div>
      </div>

      {/* Founder card */}
      <div style={{ position: "relative", zIndex: 2, paddingLeft: 24, paddingRight: 24, marginBottom: 52 }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 24,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: CORAL_GRADIENT,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, letterSpacing: "-0.005em", color: "#0A0A0A", fontWeight: 400 }}>
              Robyn Dawes
            </div>
            <div style={{ fontSize: 12, letterSpacing: "0.01em", color: "#8A8480", marginTop: 2 }}>
              Founder of Hello Hoedspruit
            </div>
          </div>
          <button
            onPointerDown={press}
            onPointerUp={release}
            onPointerLeave={release}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#F2EFEC",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "transform 150ms ease-out",
            }}
            aria-label="Founder details"
          >
            <ArrowUpRight size={14} color="#0A0A0A" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* The story */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 52 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.02em", color: "#8A8480", marginBottom: 10 }}>
          The story
        </div>
        <h2
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 40,
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            color: "#0A0A0A",
            margin: 0,
            marginBottom: 24,
          }}
        >
          Meet the<br />founder
        </h2>
        {paragraphs.map((p, i) => (
          <p
            key={i}
            style={{
              fontSize: 15,
              lineHeight: 1.65,
              letterSpacing: "-0.005em",
              color: "#0A0A0A",
              margin: 0,
              marginBottom: i < paragraphs.length - 1 ? 18 : 0,
            }}
          >
            {p}
          </p>
        ))}
      </div>

      {/* What we stand for */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 52 }}>
        <h2
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 40,
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            color: "#0A0A0A",
            margin: 0,
            marginBottom: 24,
          }}
        >
          What we<br />stand for
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {values.map((v) => (
            <button
              key={v.num}
              onPointerDown={press}
              onPointerUp={release}
              onPointerLeave={release}
              style={{
                position: "relative",
                background: "#FFFFFF",
                borderRadius: 20,
                padding: "18px 18px 20px",
                minHeight: 150,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                transition: "transform 150ms ease-out",
                fontFamily: SANS,
              }}
            >
              <span
                style={{
                  fontFamily: SERIF,
                  fontWeight: 300,
                  fontSize: 32,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: "#0A0A0A",
                }}
              >
                {v.num}
              </span>
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "#F2EFEC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowUpRight size={12} color="#0A0A0A" strokeWidth={2} />
              </span>
              <span
                style={{
                  marginTop: "auto",
                  fontSize: 18,
                  lineHeight: 1.15,
                  letterSpacing: "-0.01em",
                  color: "#0A0A0A",
                  fontWeight: 400,
                }}
              >
                {v.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Full-bleed coral CTA */}
      <div
        style={{
          position: "relative",
          background: "#F26A48",
          padding: "36px 28px",
          borderRadius: "32px 32px 0 0",
          overflow: "hidden",
          marginTop: 52,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, #F47356 0%, #D9572F 100%)",
            opacity: 0.55,
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.02em", color: "rgba(255,255,255,0.78)", marginBottom: 10 }}>
            For businesses
          </div>
          <h2
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 42,
              lineHeight: 0.98,
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
              margin: 0,
              marginBottom: 18,
            }}
          >
            Want to be<br />listed?
          </h2>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.85)",
              margin: 0,
              marginBottom: 24,
              maxWidth: 290,
            }}
          >
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
              gap: 10,
              background: "#FFFFFF",
              borderRadius: 999,
              padding: "14px 22px",
              border: "none",
              cursor: "pointer",
              transition: "transform 150ms ease-out",
              fontFamily: SANS,
            }}
          >
            <span style={{ fontSize: 15, color: "#0A0A0A", fontWeight: 400 }}>Get in touch</span>
            <ArrowUpRight size={14} color="#0A0A0A" strokeWidth={2} />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default About;
