import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const LABEL = "#9A8E7A";
const LINE = "rgba(26,26,26,0.08)";
const DARK = "#3D2E22";
const DARK_MUTED = "rgba(255,255,255,0.72)";
const ICON_BG = "rgba(26,26,26,0.06)";

const POLICIES = [
  { title: "Terms of Service", to: "/terms-of-use" },
  { title: "Privacy Policy", to: "/privacy-policy" },
  { title: "Cookie Policy", to: "/cookie-policy" },
  { title: "Community Guidelines", to: "/content-guidelines" },
];

const tap = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(0.98)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
};

const TermsPolicies = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, color: INK, paddingBottom: 140 }}>
      {/* Top bar */}
      <PageHeader title="Terms & Policies" />

      {/* Section label */}
      <div style={{ padding: "24px 20px 10px" }}>
        <div style={{ fontFamily: '"Bricolage Grotesque", ' + SANS, fontSize: 15, fontWeight: 700, letterSpacing: "0.06em", color: INK, textTransform: "uppercase" }}>
          Policies &amp; Agreements
        </div>
      </div>

      {/* Policy list card */}
      <div style={{ padding: "0 20px" }}>
        <div style={{ background: CARD, borderRadius: 16, padding: "4px 20px", overflow: "hidden" }}>
          {POLICIES.map((p, idx) => (
            <button
              key={p.title}
              onClick={() => navigate(p.to)}
              {...tap}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 16,
                padding: "20px 0", background: "none", border: "none",
                borderTop: idx === 0 ? "none" : `1px solid ${LINE}`,
                textAlign: "left", cursor: "pointer", fontFamily: SANS,
                transition: "transform 150ms ease-out",
              }}
            >
              <div style={{ flex: 1, fontSize: 15, fontWeight: 500, color: INK, letterSpacing: -0.1 }}>
                {p.title}
              </div>
              <div
                aria-hidden
                style={{
                  width: 30, height: 30, borderRadius: "50%", background: ICON_BG,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  fontSize: 13, color: INK, lineHeight: 1,
                }}
              >
                ↗
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dark privacy card */}
      <div style={{ padding: "28px 20px 0" }}>
        <div
          style={{
            background: DARK, borderRadius: 18, padding: "26px 24px", color: CARD,
          }}
        >
          <div
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <ShieldCheck size={20} color={CARD} strokeWidth={1.8} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, letterSpacing: -0.1 }}>
            Your Privacy Matters
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: DARK_MUTED, margin: 0 }}>
            We are committed to full transparency. Our policies ensure your data is protected and you have a safe experience using Hello Hoedspruit.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TermsPolicies;
