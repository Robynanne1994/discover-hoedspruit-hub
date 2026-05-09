import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Store, ShieldCheck, type LucideIcon } from "lucide-react";

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

  const renderCard = (opts: {
    onClick: () => void;
    bg: string;
    iconBg: string;
    Icon: LucideIcon;
    title: string;
    description: string;
    tag: string;
  }) => (
    <button
      onClick={opts.onClick}
      style={{
        position: "relative",
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        width: "calc(100% - 48px)",
        marginLeft: 24,
        marginRight: 24,
        marginBottom: 14,
        background: opts.bg,
        borderRadius: 24,
        border: "none",
        padding: "24px 22px",
        cursor: "pointer",
        textAlign: "left",
        transition: "transform 150ms ease-out",
      }}
      onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.985)")}
      onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: opts.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <opts.Icon size={22} color={CREAM} strokeWidth={1.6} />
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingRight: 32 }}>
        <h3
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 24,
            lineHeight: 1.05,
            letterSpacing: "-0.4px",
            color: INK,
            margin: 0,
          }}
        >
          {opts.title}
        </h3>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 1.55,
            color: "rgba(42, 42, 36, 0.8)",
            marginTop: 8,
            marginBottom: 10,
          }}
        >
          {opts.description}
        </p>
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 12.5,
            color: MUTED,
            margin: 0,
          }}
        >
          {opts.tag}
        </p>
      </div>
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 24,
          right: 22,
          fontSize: 18,
          color: INK,
          lineHeight: 1,
        }}
      >
        ›
      </span>
    </button>
  );

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
      <div style={{ paddingTop: 18, paddingLeft: 24, paddingRight: 24, marginBottom: 36 }}>
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
          first things<br />first.
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
          Are you adding a new business, or claiming one that's already on the app?
        </p>
      </div>

      {/* Path cards */}
      {renderCard({
        onClick: () => navigate("/business/sign-up"),
        bg: CREAM,
        iconBg: RUST,
        Icon: Store,
        title: "List a new business.",
        description:
          "Add your spot to Hello Hoedspruit so locals can find you, save you, and visit.",
        tag: "Most owners start here.",
      })}
      {renderCard({
        onClick: () => navigate("/business/claim"),
        bg: SOFT_CREAM,
        iconBg: INK,
        Icon: ShieldCheck,
        title: "Claim a listing.",
        description:
          "Already on the app? Take ownership to update details, post specials, and share events.",
        tag: "For listings already live.",
      })}

      {/* Bridge note */}
      <div
        style={{
          marginTop: 8,
          marginLeft: 24,
          marginRight: 24,
          paddingTop: 24,
          borderTop: "1px solid rgba(238, 232, 218, 0.18)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 14,
            lineHeight: 1.55,
            color: "rgba(238, 232, 218, 0.65)",
            margin: 0,
          }}
        >
          Not sure which to pick?
          <br />
          <Link
            to="/business/claim"
            style={{
              color: "rgba(238, 232, 218, 0.65)",
              borderBottom: "1px solid rgba(238, 232, 218, 0.4)",
              textDecoration: "none",
              paddingBottom: 1,
            }}
          >
            Search for your business first.
          </Link>
        </p>
      </div>

      {/* Sign in link */}
      <div
        style={{
          marginTop: 24,
          marginLeft: 24,
          marginRight: 24,
          paddingTop: 18,
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
