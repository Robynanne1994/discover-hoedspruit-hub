import { FileText, Shield, Cookie, Users, ArrowUpRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";
import { MUTED as TOKEN_MUTED } from "@/lib/type";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED_INK = TOKEN_MUTED;
const LINE = "#E2DAC6";

const POLICIES = [
  { title: "Terms of Service", href: "https://hellohoedspruit.co/legal/terms-of-use", Icon: FileText },
  { title: "Privacy Policy", href: "https://hellohoedspruit.co/legal/privacy-policy", Icon: Shield },
  { title: "Cookie Policy", href: "https://hellohoedspruit.co/legal/cookie-policy", Icon: Cookie },
  { title: "Community Guidelines", href: "https://hellohoedspruit.co/legal/community-guidelines", Icon: Users },
];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      fontFamily: `"Nohemi", ${FF}`,
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: INK,
      margin: "0 0 12px 0",
      padding: "0 24px",
    }}
  >
    {children}
  </p>
);

const TermsPolicies = () => {
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FF, color: INK, paddingBottom: 140 }}>
      <Seo
        title="Terms & Policies — Hello Hoedspruit"
        description="Read the terms of use, privacy policy, cookie policy and community guidelines for the Hello Hoedspruit app."
        path="/terms"
      />
      <PageHeader title="Terms & Policies" />

      <div style={{ padding: "24px 0 0" }}>
        <SectionLabel>Policies &amp; Agreements</SectionLabel>
        <div style={{ background: CARD, borderRadius: 20, margin: "0 24px", padding: "4px 22px" }}>
          {POLICIES.map((p, idx) => {
            const { Icon } = p;
            return (
              <a
                key={p.title}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "18px 0",
                  textDecoration: "none",
                  borderTop: idx === 0 ? "none" : `1px solid ${LINE}`,
                }}
              >
                <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} strokeWidth={1.5} color={MUTED_INK} />
                </div>
                <span
                  style={{
                    flex: 1,
                    fontFamily: FF,
                    fontSize: 16,
                    fontWeight: 400,
                    letterSpacing: "-0.1px",
                    color: INK,
                    lineHeight: 1.25,
                  }}
                >
                  {p.title}
                </span>
                <ArrowUpRight size={18} color={INK} style={{ flexShrink: 0 }} />
              </a>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TermsPolicies;
