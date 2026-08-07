import { FileText, Shield, Cookie, Users, ChevronRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const LABEL = "#6B6A5E";
const LINE = "#E2DAC6";
const LEAD_ICON = "#715A3D";
const TRAIL_ICON = "#B4AE9E";

type RowItem = {
  label: string;
  href: string;
  icon?: any;
  subtitle?: string;
  external?: boolean;
};

const POLICIES: RowItem[] = [
  { label: "Terms of Use", href: "https://hellohoedspruit.co/legal/terms-of-use", icon: FileText, external: true },
  { label: "Privacy", href: "https://hellohoedspruit.co/legal/privacy-policy", icon: Shield, external: true },
  { label: "Cookies", href: "https://hellohoedspruit.co/legal/cookie-policy", icon: Cookie, external: true },
  { label: "Community Guidelines", href: "https://hellohoedspruit.co/legal/community-guidelines", icon: Users, external: true },
];

const ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  minHeight: 56,
  padding: "10px 16px",
  textDecoration: "none",
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      margin: "0 0 10px",
      padding: "0 24px",
      fontFamily: SANS,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: LABEL,
    }}
  >
    {children}
  </p>
);

const RowBody = ({ item }: { item: RowItem }) => (
  <>
    {item.icon ? (
      <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <item.icon size={20} strokeWidth={1.6} color={LEAD_ICON} />
      </div>
    ) : null}
    <span style={{ flex: 1, display: "block" }}>
      <span
        style={{
          display: "block",
          fontFamily: SANS,
          fontSize: 16,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: INK,
          lineHeight: 1.25,
        }}
      >
        {item.label}
      </span>
      {item.subtitle ? (
        <span
          style={{
            display: "block",
            marginTop: 2,
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 400,
            color: LABEL,
            lineHeight: 1.3,
          }}
        >
          {item.subtitle}
        </span>
      ) : null}
    </span>
    {item.external ? (
      <ArrowUpRight size={16} strokeWidth={2} color={TRAIL_ICON} style={{ flexShrink: 0 }} />
    ) : (
      <ChevronRight size={16} strokeWidth={2} color={TRAIL_ICON} style={{ flexShrink: 0 }} />
    )}
  </>
);

const Section = ({ label, items }: { label: string; items: RowItem[] }) => {
  const rows = items.filter((i) => i.label && i.href);
  if (rows.length === 0) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ background: CARD, borderRadius: 20, margin: "0 24px", overflow: "hidden" }}>
        {rows.map((item, i) => (
          <div key={item.label}>
            {i > 0 && <div style={{ height: 1, background: LINE, marginLeft: 50, marginRight: 16 }} />}
            {item.external ? (
              <a href={item.href} target="_blank" rel="noopener noreferrer" style={ROW_STYLE}>
                <RowBody item={item} />
              </a>
            ) : (
              <Link to={item.href} style={ROW_STYLE}>
                <RowBody item={item} />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const TermsPolicies = () => {
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, color: INK, paddingBottom: 100 }}>
      <Seo
        title="Terms & Policies — Hello Hoedspruit"
        description="Read the terms of use, privacy policy, cookie policy and community guidelines for the Hello Hoedspruit app."
        path="/terms"
      />
      <PageHeader title="Terms & Policies" />

      <div style={{ height: 24 }} />

      <Section label="Policies" items={POLICIES} />

      <BottomNav />
    </div>
  );
};

export default TermsPolicies;
