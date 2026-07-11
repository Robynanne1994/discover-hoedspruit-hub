import { useNavigate } from "react-router-dom";
import { FileText, Shield, Cookie, Users, ArrowUpRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#020202";
const ICON_BG = "#EFE7D4";
const BROWN = "#715a3d";

const POLICIES = [
  { title: "Terms of Service", to: "/terms-of-use", Icon: FileText },
  { title: "Privacy Policy", to: "/privacy-policy", Icon: Shield },
  { title: "Cookie Policy", to: "/cookie-policy", Icon: Cookie },
  { title: "Community Guidelines", to: "/content-guidelines", Icon: Users },
];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      fontFamily: `"Bricolage Grotesque", ${FF}`,
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "#1A1A1A",
      margin: "0 0 10px 0",
      padding: "0 4px",
    }}
  >
    {children}
  </p>
);

const TermsPolicies = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FF, color: INK, paddingBottom: 140 }}>
      <Seo
        title="Terms & Policies — Hello Hoedspruit"
        description="Read the terms of use, privacy policy, cookie policy and community guidelines for the Hello Hoedspruit app."
        path="/terms"
      />
      <PageHeader title="Terms & Policies" />

      <div style={{ padding: "20px 20px 0" }}>
        <SectionLabel>Policies &amp; Agreements</SectionLabel>
        <div
          style={{
            background: CARD,
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {POLICIES.map((p, idx) => {
            const { Icon } = p;
            return (
              <div key={p.title}>
                {idx > 0 && <div style={{ height: 1, background: "#EFE7D4", margin: "0 18px" }} />}
                <button
                  onClick={() => navigate(p.to)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    background: "transparent",
                    padding: "16px 18px",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: FF,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: ICON_BG,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} color={BROWN} strokeWidth={1.6} />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      fontFamily: FF,
                      fontSize: 15,
                      fontWeight: 400,
                      color: INK,
                      lineHeight: 1.3,
                    }}
                  >
                    {p.title}
                  </div>
                  <ArrowUpRight size={18} color={INK} style={{ flexShrink: 0 }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TermsPolicies;
