import { Link, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, FileText, Shield, Cookie, BookOpen, ChevronRight } from "lucide-react";

const policyRows = [
  { icon: FileText, label: "Terms of Use", sub: "Our terms governing your use of Hello Hoedspruit", href: "/terms-of-use" },
  { icon: Shield, label: "Privacy Policy", sub: "How we collect, use, and protect your data", href: "/privacy-policy" },
  { icon: Cookie, label: "Cookie Policy", sub: "How we use cookies on the Hello Hoedspruit app", href: "/cookie-policy" },
  { icon: BookOpen, label: "Content Guidelines", sub: "Our standards for what is shared in the community", href: "/content-guidelines" },
];

const TermsPolicies = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: 100 }}>
      {/* Back button */}
      <div style={{ paddingTop: 44, paddingLeft: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={18} strokeWidth={2} color="rgba(18,18,20,0.4)" />
          <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2 }}>Back</span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ padding: "28px 24px 0" }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, textTransform: "uppercase", lineHeight: 0.95, letterSpacing: -0.5, color: "#121214", margin: 0 }}>
          Terms & Policies
        </h1>
        <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 14, color: "rgba(18,18,20,0.4)", letterSpacing: 0.2, lineHeight: 1.4, marginTop: 12, marginBottom: 0 }}>
          Review the policies that govern your experience
        </p>
      </div>

      {/* Policy rows */}
      <div style={{ padding: "32px 24px 0" }}>
        <div style={{ background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, overflow: "hidden" }}>
          {policyRows.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} to={item.href} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "16px 20px",
                    borderBottom: i < policyRows.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none",
                    cursor: "pointer",
                  }}
                >
                  <Icon size={22} strokeWidth={1.5} color="#121214" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, marginLeft: 14, paddingRight: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#121214", marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "rgba(18,18,20,0.35)", lineHeight: 1.4 }}>{item.sub}</div>
                  </div>
                  <ChevronRight size={16} strokeWidth={2} color="rgba(18,18,20,0.2)" style={{ flexShrink: 0 }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TermsPolicies;
