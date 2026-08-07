import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Seo from "@/components/Seo";
import PrimaryButton from "@/components/ui/PrimaryButton";

const CREAM = "#E6E0CC";
const INK = "#1A1A1A";
const BODY = "#2B2420";
const MUTED = "#6B6A5E";
const TAN = "#715A3D";
const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const BRICOLAGE = '"Bricolage Grotesque", Helvetica, Arial, sans-serif';

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
        background: CREAM,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "0 24px",
      }}
    >
      <Seo
        title="Page Not Found — Hello Hoedspruit"
        description="The page you're after has gone walkabout. Head home or search the 'Hoed."
        path={location.pathname || "/404"}
        noIndex
      />

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
          paddingTop: 132,
        }}
      >
        {/* Icon mark — compass with broken needle */}
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="38"
            height="38"
            viewBox="0 0 48 48"
            fill="none"
            stroke={TAN}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="24" cy="24" r="19" />
            <path d="M30 18 L25 23" />
            <path d="M22 26 L18 30" />
            <path d="M30 18 L26 24 L22 26" />
            <circle cx="24" cy="24" r="1.4" fill={TAN} stroke="none" />
          </svg>
        </div>

        {/* Eyebrow */}
        <div
          style={{
            marginTop: 28,
            fontFamily: HELV,
            fontWeight: 400,
            fontSize: 10,
            letterSpacing: "1.8px",
            textTransform: "uppercase",
            color: MUTED,
          }}
        >
          Off The Map
        </div>

        {/* 404 display number */}
        <div
          style={{
            marginTop: 12,
            fontFamily: BRICOLAGE,
            fontWeight: 700,
            fontSize: 96,
            lineHeight: 1,
            letterSpacing: "-2px",
            color: INK,
          }}
        >
          404
        </div>

        {/* Headline */}
        <h1
          style={{
            marginTop: 6,
            marginBottom: 0,
            fontFamily: BRICOLAGE,
            fontWeight: 600,
            fontSize: 32,
            lineHeight: 1.1,
            letterSpacing: "-0.4px",
            color: INK,
            textTransform: "capitalize",
          }}
        >
          This page has gone walkabout
        </h1>

        {/* Lede */}
        <p
          style={{
            marginTop: 14,
            marginBottom: 0,
            maxWidth: 280,
            fontFamily: HELV,
            fontWeight: 400,
            fontSize: 15,
            lineHeight: 1.45,
            color: BODY,
          }}
        >
          The link you followed is broken or no longer exists. Let's get you back to the 'Hoed.
        </p>

        {/* CTAs */}
        <div style={{ width: "100%", marginTop: 36, display: "flex", flexDirection: "column", gap: 12 }}>
          <PrimaryButton fullWidth onClick={() => navigate("/")}>
            Take Me Home
          </PrimaryButton>
          <button
            onClick={() => navigate("/categories?focus=search")}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 999,
              background: "transparent",
              color: TAN,
              border: "1.5px solid #715A3D",
              cursor: "pointer",
              fontFamily: HELV,
              fontWeight: 400,
              fontSize: 15,
              letterSpacing: "0.1px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "transform 0.12s ease, opacity 0.12s ease",
              boxSizing: "border-box",
            }}
            onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; e.currentTarget.style.opacity = "0.85"; }}
            onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "1"; }}
            onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "1"; }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke={TAN}
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
