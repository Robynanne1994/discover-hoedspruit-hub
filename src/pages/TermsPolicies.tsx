import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import BackArrowIcon from "@/components/ui/BackArrowIcon";

const FONT_STACK = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

const policyRows = [
  { label: "Terms of Use", sub: "How you and we agree to use Hello Hoedspruit.", href: "/terms-of-use" },
  { label: "Privacy Policy", sub: "What we collect, why we collect it and how it's kept safe.", href: "/privacy-policy" },
  { label: "Cookie Policy", sub: "The cookies we use to keep the app running smoothly.", href: "/cookie-policy" },
  { label: "Community Guidelines", sub: "The tone we keep, and what belongs on the app.", href: "/content-guidelines" },
];

const baseTextStyle = {
  fontFamily: FONT_STACK,
  fontStretch: "normal" as const,
  fontSynthesis: "none" as const,
};

const TermsPolicies = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "transparent", paddingBottom: 120, ...baseTextStyle }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: "#ffffff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <BackArrowIcon size={20} color="#0A0A0A" />
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: "28px 24px 0" }}>
        <h1
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontSize: 56,
            lineHeight: 0.92,
            letterSpacing: "-0.03em",
            color: "#0A0A0A",
            margin: "14px 0 0",
          }}
        >
          Terms & policies
        </h1>
        <p
          style={{
            fontFamily: PLAYFAIR,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 18,
            lineHeight: 1.4,
            color: "#5b4632",
            margin: "18px 0 0",
          }}
        >
          A quick look at how we run things, and how we look after you.
        </p>
      </div>

      {/* Card */}
      <div style={{ padding: "32px 24px 0" }}>
        <div style={{ background: "#ffffff", borderRadius: 20, overflow: "hidden" }}>
          {policyRows.map((item, i) => (
            <Link key={item.label} to={item.href} style={{ textDecoration: "none", display: "block" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "22px 20px",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <div style={{ flex: 1, paddingRight: 24 }}>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 500,
                      lineHeight: 1.25,
                      letterSpacing: "-0.01em",
                      color: "#0A0A0A",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.45,
                      color: "#8A8480",
                      marginTop: 6,
                    }}
                  >
                    {item.sub}
                  </div>
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: "#F2EFEC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ChevronRight size={16} strokeWidth={2} color="#0A0A0A" />
                </div>
                {i < policyRows.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 20,
                      right: 20,
                      bottom: 0,
                      height: 1,
                      background: "#F2EFEC",
                    }}
                  />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div style={{ padding: "28px 24px 0", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "#FFFFFF",
            marginTop: 9,
            flexShrink: 0,
          }}
        />
        <p
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 400,
            fontSize: 14,
            color: "#5B4632",
            margin: 0,
            lineHeight: 1.5,
            letterSpacing: "0.01em",
          }}
        >
          Last updated April 2026. We'll let you know here if anything meaningful changes.
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default TermsPolicies;
