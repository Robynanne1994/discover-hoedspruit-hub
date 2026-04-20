import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const DISPLAY = "'Helvetica Neue', Helvetica, 'Pragmatica', sans-serif";

const HomeGetListed = () => {
  return (
    <section style={{ padding: "0 24px" }}>
      <div
        style={{
          position: "relative",
          background: "#F26A48",
          borderRadius: 28,
          padding: "28px 24px 28px",
          overflow: "hidden",
          color: "#FFFFFF",
        }}
      >
        {/* Soft glow cropped bottom-right */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: -80,
            bottom: -120,
            width: 280,
            height: 280,
            background: "radial-gradient(circle, rgba(255,180,140,0.55) 0%, rgba(242,106,72,0) 65%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative" }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.78)",
              marginBottom: 14,
            }}
          >
            For local business
          </div>
          <h3
            style={{
              margin: 0,
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 30,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: "#FFFFFF",
              marginBottom: 12,
            }}
          >
            Stand out in Hoedspruit.
          </h3>
          <p
            style={{
              margin: 0,
              fontFamily: SANS,
              fontSize: 14,
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.9)",
              maxWidth: 280,
              marginBottom: 22,
            }}
          >
            Reach locals and visitors looking for the best of Hoedspruit.
          </p>
          <Link
            to="/advertise"
            onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#FFFFFF",
              color: "#0A0A0A",
              borderRadius: 999,
              padding: "12px 18px",
              fontFamily: SANS,
              fontSize: 14,
              textDecoration: "none",
              transition: "transform 150ms ease-out",
            }}
          >
            Get in touch
            <ArrowUpRight size={14} color="#0A0A0A" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeGetListed;
