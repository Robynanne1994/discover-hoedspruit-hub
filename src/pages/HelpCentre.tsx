import { useNavigate } from "react-router-dom";
import { MessageCircle, LifeBuoy } from "lucide-react";
import BackArrowIcon from "@/components/ui/BackArrowIcon";

const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const LABEL = "#9A8E7A";
const LINE = "rgba(26,26,26,0.08)";
const DARK = "#3D2E22";
const DARK_MUTED = "rgba(255,255,255,0.72)";
const ICON_BG = "rgba(26,26,26,0.06)";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const ROWS = [
  { title: "FAQs", to: "/faqs" },
  { title: "About", to: "/about" },
  { title: "Terms & Policies", to: "/terms" },
  { title: "Contact Us", to: "/contact" },
];

const tap = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; },
};

const HelpCentre = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: BG, paddingBottom: 140, fontFamily: SANS, overflowX: "hidden" }}>
      {/* Top bar */}
      <div
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 60px)",
          paddingLeft: 24,
          paddingRight: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 44,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          {...tap}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "#fff", border: "none",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", lineHeight: 0, flexShrink: 0,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            transition: "transform 0.15s ease",
          }}
        >
          <BackArrowIcon size={18} color={INK} />
        </button>
        <div style={{ flex: 1, textAlign: "center", marginRight: 40, fontFamily: SANS, fontSize: 20, fontWeight: 700, color: INK, lineHeight: 1 }}>
          Help Centre
        </div>
      </div>

      <div style={{ height: 1, background: LINE, marginTop: 20 }} />

      {/* Section eyebrow */}
      <div style={{ padding: "24px 24px 0" }}>
        <div style={{
          fontFamily: SANS, fontWeight: 500, fontSize: 11, letterSpacing: "0.18em",
          textTransform: "uppercase", color: LABEL, marginBottom: 12,
        }}>
          Find what you need
        </div>

        {/* List card */}
        <div style={{ background: CARD, borderRadius: 20, padding: "4px 22px" }}>
          {ROWS.map((row, i) => (
            <button
              key={row.title}
              onClick={() => navigate(row.to)}
              style={{
                display: "flex", alignItems: "center", gap: 14, width: "100%",
                padding: "22px 0", background: "transparent", border: "none",
                borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{
                flex: 1,
                fontFamily: SANS, fontWeight: 500, fontSize: 16, lineHeight: 1.2,
                color: INK,
              }}>
                {row.title}
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 999, background: ICON_BG,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: SANS, fontSize: 14, color: INK, flexShrink: 0,
              }}>
                ↗
              </div>
            </button>
          ))}
        </div>

        {/* Still need help */}
        <div style={{
          marginTop: 36,
          background: DARK,
          borderRadius: 24,
          padding: "26px 24px 26px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Decorative life buoy */}
          <LifeBuoy
            size={120}
            color="rgba(255,255,255,0.08)"
            strokeWidth={1.5}
            style={{ position: "absolute", right: -14, top: 18, pointerEvents: "none" }}
          />

          {/* Chat icon */}
          <div style={{
            width: 40, height: 40, borderRadius: 999,
            background: "rgba(255,255,255,0.1)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
          }}>
            <MessageCircle size={20} color="#fff" strokeWidth={1.8} />
          </div>

          <div style={{
            fontFamily: SANS, fontWeight: 700, fontSize: 20, color: "#fff",
            marginBottom: 8, lineHeight: 1.2,
          }}>
            Still need help?
          </div>
          <div style={{
            fontFamily: SANS, fontWeight: 400, fontSize: 14.5, lineHeight: 1.5,
            color: DARK_MUTED, marginBottom: 22, maxWidth: 280,
          }}>
            Our support team is available to assist you with any questions or issues you might have.
          </div>

          <button
            onClick={() => navigate("/contact")}
            {...tap}
            style={{
              background: "#fff", color: INK, border: "none",
              borderRadius: 999, padding: "14px 24px",
              fontFamily: SANS, fontSize: 15, fontWeight: 600,
              cursor: "pointer", display: "inline-flex", alignItems: "center",
              transition: "transform 0.15s ease",
            }}
          >
            Get in Touch
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpCentre;
