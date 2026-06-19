import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  HelpCircle,
  Info,
  FileText,
  Mail,
  ArrowUpRight,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";

// === Editorial design tokens (matches My Account) ===
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED_INK = "#6B6A5E";
const LINE = "#E2DAC6";

const moreItems = [
  { label: "Local Channels", href: "/local-channels", icon: Users },
];

const helpItems = [
  { label: "FAQs", href: "/faqs", icon: HelpCircle },
  { label: "About", href: "/about", icon: Info },
  { label: "Terms & Policies", href: "/terms", icon: FileText },
  { label: "Contact", href: "/contact", icon: Mail },
];

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      fontFamily: '"Bricolage Grotesque", ' + SANS,
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "#1A1A1A",
      margin: "0 0 10px 0",
      padding: "0 24px",
    }}
  >
    {children}
  </p>
);

const Row = ({
  item,
  isFirst,
}: {
  item: { label: string; href: string; icon?: any };
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
    {item.icon ? (
      <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <item.icon size={20} strokeWidth={1.5} color={MUTED_INK} />
      </div>
    ) : null}
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

const Card = ({
  items,
}: {
  items: { label: string; href: string; icon?: any }[];
}) => (
  <div
    style={{
      background: CARD,
      borderRadius: 20,
      margin: "0 24px",
      padding: "4px 22px",
    }}
  >
    {items.map((item, i) => (
      <Row key={item.label} item={item} isFirst={i === 0} />
    ))}
  </div>
);

const MyProfileGuest = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        paddingBottom: 120,
        fontFamily: SANS,
      }}
    >
      <Seo
        title="Help & Info — Hello Hoedspruit"
        description="Local channels, FAQs, about, terms and policies and contact for Hello Hoedspruit."
        path="/my-profile-guest"
        noIndex
      />

      <PageHeader title="Help & Info" onBack={() => navigate("/")} />

      <div style={{ height: 24 }} />

      <Eyebrow>More</Eyebrow>
      <Card items={moreItems} />

      <div style={{ height: 28 }} />

      <Eyebrow>Help</Eyebrow>
      <Card items={helpItems} />

      <div style={{ height: 36 }} />

      <Eyebrow>Account</Eyebrow>
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => navigate("/welcome", { state: { mode: "signup" } })}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 999,
            background: "#423324",
            color: "#FFFFFF",
            border: "none",
            fontFamily: SANS,
            fontSize: 15,
            fontWeight: 400,
            letterSpacing: "0.1px",
            cursor: "pointer",
          }}
        >
          Create account
        </button>
        <button
          onClick={() => navigate("/welcome", { state: { mode: "signin" } })}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 999,
            background: "transparent",
            color: "#715a3d",
            border: "1px solid #715a3d",
            fontFamily: SANS,
            fontSize: 15,
            fontWeight: 400,
            letterSpacing: "0.1px",
            cursor: "pointer",
          }}
        >
          Log in
        </button>
      </div>
    </div>
  );
};

export default MyProfileGuest;
