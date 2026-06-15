import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, ArrowUpRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";


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
      <Seo
        title="Terms & Policies — Hello Hoedspruit"
        description="Read the terms of use, privacy policy, cookie policy and community guidelines for the Hello Hoedspruit app."
        path="/terms"
      />
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
              <ArrowUpRight size={18} color={INK} style={{ flexShrink: 0 }} />

            </button>
          ))}
        </div>
      </div>




      <BottomNav />
    </div>
  );
};

export default TermsPolicies;
