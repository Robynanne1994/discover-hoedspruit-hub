import { Link } from "react-router-dom";

const HomeGetListed = () => {
  return (
    <section style={{ padding: "0 24px" }}>
      <div
        style={{
          position: "relative",
          background: "#9B5A3C",
          borderRadius: 28,
          padding: "32px 28px 28px",
          overflow: "hidden",
        }}
      >
        {/* Darker organic blob, bottom-right */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: -80,
            bottom: -100,
            width: 240,
            height: 260,
            background: "#7E4530",
            opacity: 0.6,
            borderRadius: "50% 45% 55% 50% / 55% 50% 60% 45%",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        {/* Cream highlight, top-right */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: -30,
            top: -60,
            width: 160,
            height: 170,
            background: "rgba(238, 232, 218, 0.08)",
            borderRadius: "55% 45% 50% 55% / 50% 60% 45% 55%",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 11.5,
              textTransform: "uppercase",
              letterSpacing: "2.4px",
              color: "rgba(238, 232, 218, 0.8)",
              marginBottom: 14,
            }}
          >
            For Local Businesses
          </div>
          <h3
            style={{
              margin: 0,
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 38,
              lineHeight: 1.0,
              letterSpacing: "-1px",
              color: "#EEE8DA",
              marginBottom: 14,
              textTransform: "lowercase",
            }}
          >
            ready to do more?
          </h3>
          <p
            style={{
              margin: 0,
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 14.5,
              lineHeight: 1.55,
              color: "rgba(238, 232, 218, 0.9)",
              maxWidth: 280,
              marginBottom: 24,
            }}
          >
            A business account lets you claim your listing for personal edits, post specials and share what's on. Register in a few minutes.
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
              background: "#EEE8DA",
              color: "#2A2A24",
              borderRadius: 999,
              padding: "14px 22px",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 14,
              lineHeight: 1,
              textDecoration: "none",
              transition: "transform 150ms ease-out",
            }}
          >
            <span style={{ textTransform: "none" }}>Get Started</span>
            <span style={{ fontSize: 14, lineHeight: 1 }}>↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeGetListed;
