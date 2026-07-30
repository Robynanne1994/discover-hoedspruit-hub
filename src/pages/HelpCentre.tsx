import { Link } from "react-router-dom";
import { HelpCircle, FileText, Mail, MessageSquare, ArrowUpRight, Shield, Cookie, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED_INK = "#6B6A5E";
const LINE = "#E2DAC6";

const ROWS = [
  { label: "FAQs", href: "/faqs", icon: HelpCircle },
  { label: "Contact Us", href: "/contact", icon: Mail },
  { label: "Feedback", href: "/feedback", icon: MessageSquare },
  { label: "Privacy Policy", href: "https://hellohoedspruit.co/legal/privacy-policy", icon: Shield },
  { label: "Cookie Policy", href: "https://hellohoedspruit.co/legal/cookie-policy", icon: Cookie },
  { label: "Terms of Use", href: "https://hellohoedspruit.co/legal/terms-of-use", icon: FileText },
  { label: "Community Guidelines", href: "https://hellohoedspruit.co/legal/community-guidelines", icon: Users },
];

const Row = ({
  item,
  isFirst,
}: {
  item: { label: string; href: string; icon: any };
  isFirst: boolean;
}) => {
  const isExternal = item.href.startsWith("http");
  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "18px 0",
        textDecoration: "none",
        borderTop: isFirst ? "none" : `1px solid ${LINE}`,
      }}
    >
      <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <item.icon size={20} strokeWidth={1.5} color={MUTED_INK} />
      </div>
      <span
        style={{
          flex: 1,
          fontFamily: SANS,
          fontSize: 16,
          fontWeight: 400,
          letterSpacing: "-0.1px",
          color: INK,
          lineHeight: 1.25,
        }}
      >
        {item.label}
      </span>
      <ArrowUpRight size={18} color={INK} style={{ flexShrink: 0 }} />
    </div>
  );

  if (isExternal) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={item.href} style={{ textDecoration: "none" }}>
      {content}
    </Link>
  );
};

const HelpCentre = () => {
  return (
    <div style={{ minHeight: "100vh", background: BG, paddingBottom: 140, fontFamily: SANS, overflowX: "hidden" }}>
      <Seo
        title="Help Centre — Hello Hoedspruit"
        description="Find help, FAQs, contact details and policy information for the Hello Hoedspruit app."
        path="/help-centre"
      />
      <PageHeader title="Help Centre" />

      <div style={{ padding: "24px 0 0" }}>
        <p
          style={{
            fontFamily: '"Nohemi", ' + SANS,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: INK,
            margin: "0 0 10px 0",
            padding: "0 24px",
          }}
        >
          Find what you need
        </p>

        <div style={{ background: CARD, borderRadius: 20, margin: "0 24px", padding: "4px 22px" }}>
          {ROWS.map((item, i) => (
            <Row key={item.label} item={item} isFirst={i === 0} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpCentre;
