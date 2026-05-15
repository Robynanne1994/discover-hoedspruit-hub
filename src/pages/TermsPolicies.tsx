import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const OLIVE = "#5C6446";
const CREAM = "#EEE8DA";
const DEEP_INK = "#2A2A24";
const MUTED_INK = "#6B6A5E";
const LINE = "#D9D2C0";
const RUST = "#9B5A3C";

// Source of truth for "last updated" — update here when policies change.
const LAST_UPDATED = "April 2026";

const press = (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "scale(0.98)";
};
const release = (e: React.PointerEvent<HTMLElement>) => {
  e.currentTarget.style.transform = "scale(1)";
};

const BackArrow = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={CREAM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const POLICIES = [
  { title: "Terms of Use", subtitle: "How you and we agree to use Hello Hoedspruit.", to: "/terms-of-use" },
  { title: "Privacy Policy", subtitle: "What we collect, why we collect it and how it's kept safe.", to: "/privacy-policy" },
  { title: "Cookie Policy", subtitle: "The cookies we use to keep the app running smoothly.", to: "/cookie-policy" },
  { title: "Community Guidelines", subtitle: "The tone we keep, and what belongs on the app.", to: "/content-guidelines" },
];

const TermsPolicies = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const id = "playfair-terms-font";
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
      <div style={{ padding: "60px 24px 0", display: "flex", alignItems: "center", gap: 12, minHeight: 44 }}>
        <button
          onClick={() => navigate(-1)}
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={release}
          aria-label="Back"
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            lineHeight: 0,
            flexShrink: 0,
            transition: "transform 150ms ease-out",
          }}
        >
          <BackArrow />
        </button>
        <div style={{ flex: 1, textAlign: "center", marginRight: 22, fontFamily: SANS, fontWeight: 600, fontSize: 20, color: CREAM, lineHeight: 1 }}>
          Terms
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(238,232,218,0.18)", marginTop: 20 }} />

      <div style={{ height: 24 }} />

      {/* Policy directory card */}
      <div style={{ padding: "0 24px", marginBottom: 24 }}>
        <div style={{ background: CREAM, borderRadius: 20, padding: "4px 22px", overflow: "hidden" }}>
          {POLICIES.map((p, idx) => (
            <button
              key={p.title}
              onClick={() => navigate(p.to)}
              onPointerDown={press}
              onPointerUp={release}
              onPointerLeave={release}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "20px 0",
                background: "none",
                border: "none",
                borderTop: idx === 0 ? "none" : `1px solid ${LINE}`,
                textAlign: "left",
                cursor: "pointer",
                transition: "transform 150ms ease-out",
                fontFamily: SANS,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.2, letterSpacing: "-0.1px", color: DEEP_INK }}>
                  {p.title}
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
                  fontSize: 12,
                  color: DEEP_INK,
                  lineHeight: 1,
                  fontFamily: SANS,
                }}
              >
                ↗
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footnote */}
      <div style={{ padding: "0 26px 0 28px", marginTop: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span
          aria-hidden
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: RUST,
            flexShrink: 0,
            marginTop: 8,
          }}
        />
        <p style={{ fontFamily: "Inter, sans-serif", fontStyle: "normal", fontWeight: 400, fontSize: 14, lineHeight: 1.55, color: "rgba(238,232,218,0.7)", margin: 0 }}>
          Last updated {LAST_UPDATED}. We'll let you know here if anything meaningful changes.
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default TermsPolicies;
