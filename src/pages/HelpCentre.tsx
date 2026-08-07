import { Link } from "react-router-dom";
import { HelpCircle, FileText, Mail, MessageSquare, ArrowUpRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";
import { MUTED as TOKEN_MUTED, SECTION_INSET, type } from "@/lib/type";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED_INK = TOKEN_MUTED;
const LINE = "#E2DAC6";

const ROWS = [
  { label: "FAQs", href: "/faqs", icon: HelpCircle },
  { label: "Terms & Policies", href: "/terms", icon: FileText },
  { label: "Contact Us", href: "/contact", icon: Mail },
  { label: "Feedback", href: "/feedback", icon: MessageSquare },
];

const Row = ({
  item,
  isFirst,
}: {
  item: { label: string; href: string; icon: any };
  isFirst: boolean;
}) => (
  <Link
    to={item.href}
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
  </Link>
);

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
            ...type.sectionEyebrow,
            marginTop: 0,
            padding: `0 ${SECTION_INSET}px`,
          }}
        >
          Find what you need
        </p>

        <div style={{ background: CARD, borderRadius: 20, margin: `0 ${SECTION_INSET}px`, padding: "4px 22px" }}>
          {ROWS.map((item, i) => (
            <Row key={item.label} item={item} isFirst={i === 0} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpCentre;
