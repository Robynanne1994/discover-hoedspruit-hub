import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const OLIVE = "#5C6446";
const OLIVE_DEEP = "#454C36";
const CREAM = "#EEE8DA";
const INK = "#2A2A24";
const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const PLAYFAIR = '"Playfair Display", Georgia, serif';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Hide global bottom nav while this page is mounted.
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-notfound-hide-nav", "true");
    style.textContent = "nav.fixed{display:none !important;}";
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: OLIVE,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "0 24px",
      }}
    >
      {/* Decorative blurred blobs */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -60,
          right: -100,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: OLIVE_DEEP,
          opacity: 0.55,
          filter: "blur(40px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 120,
          left: -80,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: OLIVE_DEEP,
          opacity: 0.4,
          filter: "blur(45px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        aria-label="Back"
        style={{
          position: "absolute",
          top: 32,
          left: 24,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: CREAM,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={INK}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>

      {/* Main content column */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          paddingTop: 152,
        }}
      >
        {/* Icon mark — compass with broken needle */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          stroke={CREAM}
          strokeOpacity={0.5}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="24" cy="24" r="19" />
          <path d="M30 18 L25 23" />
          <path d="M22 26 L18 30" />
          <path d="M30 18 L26 24 L22 26" />
          <circle cx="24" cy="24" r="1.4" fill={CREAM} stroke="none" fillOpacity={0.5} />
        </svg>

        {/* Eyebrow */}
        <div
          style={{
            marginTop: 32,
            fontFamily: HELV,
            fontWeight: 400,
            fontSize: 12,
            letterSpacing: "2.4px",
            textTransform: "uppercase",
            color: "rgba(238,232,218,0.7)",
          }}
        >
          Off The Map
        </div>

        {/* 404 display number */}
        <div
          style={{
            marginTop: 14,
            fontFamily: PLAYFAIR,
            fontStyle: "normal",
            fontWeight: 400,
            fontSize: 108,
            lineHeight: 1.03,
            letterSpacing: "-3px",
            color: CREAM,
          }}
        >
          404
        </div>

        {/* Headline */}
        <h1
          style={{
            marginTop: 8,
            marginBottom: 0,
            fontFamily: PLAYFAIR,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 48,
            lineHeight: 0.95,
            letterSpacing: "-1.8px",
            color: CREAM,
            textTransform: "lowercase",
          }}
        >
          well this
          <br />
          isn't here.
        </h1>

        {/* Lede */}
        <p
          style={{
            marginTop: 22,
            marginBottom: 0,
            maxWidth: 280,
            fontFamily: PLAYFAIR,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 17,
            lineHeight: 1.45,
            color: "rgba(238,232,218,0.75)",
          }}
        >
          The page you're after must have gone walkabout. Let's get you back.
        </p>

        {/* CTAs */}
        <div style={{ width: "100%", marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={() => navigate("/")}
            style={{
              width: "100%",
              height: 54,
              borderRadius: 999,
              background: INK,
              color: CREAM,
              border: "none",
              cursor: "pointer",
              fontFamily: HELV,
              fontWeight: 400,
              fontSize: 15,
              letterSpacing: "0.1px",
            }}
          >
            Take Me Home
          </button>
          <button
            onClick={() => navigate("/categories?focus=search")}
            style={{
              width: "100%",
              height: 54,
              borderRadius: 999,
              background: "transparent",
              color: CREAM,
              border: "1px solid rgba(238,232,218,0.35)",
              cursor: "pointer",
              fontFamily: HELV,
              fontWeight: 400,
              fontSize: 15,
              letterSpacing: "0.1px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke={CREAM}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Search The 'Hoed
          </button>
        </div>
      </div>

    </div>
  );
};

export default NotFound;
