import { useNavigate } from "react-router-dom";
import { MessageCircle, LifeBuoy, Mail, ArrowUpRight } from "lucide-react";
import BackArrowIcon from "@/components/ui/BackArrowIcon";
import PageHeader from "@/components/PageHeader";

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
      <PageHeader title="Help Centre" />

      {/* Section eyebrow */}
      <div style={{ padding: "24px 24px 0" }}>
        <div style={{
          fontFamily: '"Bricolage Grotesque", ' + SANS, fontWeight: 700, fontSize: 15, letterSpacing: "0.06em",
          textTransform: "uppercase", color: INK, marginBottom: 12,
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
              <ArrowUpRight size={18} color={INK} style={{ flexShrink: 0 }} />

            </button>
          ))}
        </div>


      </div>
    </div>
  );
};

export default HelpCentre;
