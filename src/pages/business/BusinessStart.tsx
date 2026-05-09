import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Search } from "lucide-react";

const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const SOFT_CREAM = "#F4EFE3";
const INK = "#2A2A24";
const MUTED = "#6B6A5E";
const RUST = "#9B5A3C";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const BusinessStart = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const id = "playfair-display-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;1,300;1,400&display=swap";
    document.head.appendChild(link);
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: OLIVE,
        fontFamily: SANS,
        paddingBottom: 48,
      }}
    >
      {/* Top bar */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: CREAM,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ArrowLeft style={{ width: 18, height: 18, strokeWidth: 1.6, color: INK }} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ paddingTop: 18, paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: "2.4px",
            textTransform: "uppercase",
            color: "rgba(238, 232, 218, 0.7)",
            margin: 0,
            marginBottom: 14,
          }}
        >
          For Local Businesses
        </p>
        <h1
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 56,
            lineHeight: 0.95,
            letterSpacing: "-1.8px",
            color: CREAM,
            margin: 0,
            marginBottom: 14,
          }}
        >
          run a business<br />in Hoedspruit?
        </h1>
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 17,
            lineHeight: 1.4,
            color: "rgba(238, 232, 218, 0.75)",
            margin: 0,
            maxWidth: 320,
          }}
        >
          Get on the app locals already use. Post specials, share what's on, and reach the community.
        </p>
      </div>

      {/* Primary CTA card */}
      <button
        onClick={() => navigate("/business/sign-up")}
        style={{
          position: "relative",
          display: "flex",
          gap: 16,
          alignItems: "center",
          width: "calc(100% - 48px)",
          marginLeft: 24,
          marginRight: 24,
          marginBottom: 14,
          background: CREAM,
          borderRadius: 24,
          border: "none",
          padding: "26px 24px",
          cursor: "pointer",
          textAlign: "left",
          transition: "transform 150ms ease-out",
        }}
        onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.985)")}
        onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }}>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: MUTED,
              margin: 0,
              marginBottom: 8,
            }}
          >
            Get Started
          </p>
          <h3
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 28,
              lineHeight: 1.05,
              letterSpacing: "-0.5px",
              color: INK,
              margin: 0,
              marginBottom: 8,
            }}
          >
            Create a business account.
          </h3>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 400,
              lineHeight: 1.55,
              color: "rgba(42, 42, 36, 0.75)",
              margin: 0,
            }}
          >
            Takes a few minutes. We'll help you list a new business or claim one already on the app.
          </p>
        </div>
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 26,
            right: 22,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: RUST,
          }}
        >
          <ArrowUpRight size={16} strokeWidth={1.8} color={CREAM} />
        </span>
      </button>

      {/* Secondary search-first link */}
      <button
        onClick={() => navigate("/business/claim")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "calc(100% - 48px)",
          marginLeft: 24,
          marginRight: 24,
          marginBottom: 8,
          background: "transparent",
          border: `1px solid rgba(238, 232, 218, 0.22)`,
          borderRadius: 18,
          padding: "16px 18px",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Search size={16} strokeWidth={1.6} color={CREAM} style={{ opacity: 0.7, flexShrink: 0 }} />
        <span
          style={{
            flex: 1,
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 15,
            color: "rgba(238, 232, 218, 0.85)",
          }}
        >
          Already on Hello Hoedspruit? Search & claim.
        </span>
        <span style={{ color: CREAM, opacity: 0.6, fontSize: 18, lineHeight: 1 }}>›</span>
      </button>

      {/* Sign in link */}
      <div
        style={{
          marginTop: 24,
          marginLeft: 24,
          marginRight: 24,
          paddingTop: 20,
          borderTop: "1px solid rgba(238, 232, 218, 0.15)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 14.5,
            color: "rgba(238, 232, 218, 0.7)",
            margin: 0,
          }}
        >
          Already have an account?
          <Link
            to="/business/sign-in"
            style={{
              marginLeft: 4,
              color: CREAM,
              borderBottom: "1px solid rgba(238, 232, 218, 0.5)",
              textDecoration: "none",
              paddingBottom: 1,
            }}
          >
            Sign in.
          </Link>
        </p>
      </div>
    </div>
  );
};

export default BusinessStart;
