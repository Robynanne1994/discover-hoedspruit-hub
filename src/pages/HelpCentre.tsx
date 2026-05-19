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
          padding: "26px 24px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            fontFamily: SANS, fontWeight: 700, fontSize: 20, color: "#fff",
            marginBottom: 8, lineHeight: 1.2,
          }}>
            Still need help?
          </div>
          <div style={{
            fontFamily: SANS, fontWeight: 400, fontSize: 14.5, lineHeight: 1.5,
            color: DARK_MUTED, marginBottom: 20, maxWidth: 280,
          }}>
            Our support team is available to assist you with any questions or issues you might have.
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <a
              href="https://wa.me/27613321709"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              {...tap}
              style={{
                width: 44, height: 44, borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                transition: "transform 0.15s ease",
              }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.057 21.785h-.005a9.87 9.87 0 01-5.03-1.378l-.36-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
            <a
              href="mailto:admin@hellohoedspruit.co"
              aria-label="Email"
              {...tap}
              style={{
                width: 44, height: 44, borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                transition: "transform 0.15s ease",
              }}
            >
              <Mail size={20} color="#fff" strokeWidth={1.8} />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HelpCentre;
