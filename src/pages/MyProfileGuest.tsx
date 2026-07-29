import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  HelpCircle,
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

// Support is the constant block shared with the signed-in Settings hub.
const supportItems = [
  { label: "Local Channels", href: "/local-channels", icon: Users },
  { label: "Help Centre", href: "/help-centre", icon: HelpCircle },
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

const submissionsItems = [
  { label: "Business Listing Submissions", href: "https://hellohoedspruit.co/submissions/listing", icon: Store },
  { label: "Event Submissions", href: "https://hellohoedspruit.co/submissions/event", icon: Calendar },
  { label: "Promotion Submissions", href: "https://hellohoedspruit.co/submissions/special", icon: Tag },
];

const ExternalCard = ({
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
      <a
        key={item.label}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "18px 0",
          textDecoration: "none",
          borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
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
      </a>
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
        title="Profile — Hello Hoedspruit"
        description="Sign in to save places, follow local channels and keep up with what's on around Hoedspruit."
        path="/my-profile-guest"
        noIndex
      />

      <PageHeader title="Profile" onBack={() => navigate("/")} />

      <div style={{ height: 24 }} />

      {/* Sign-in card — the hero of the guest screen */}
      <div style={{ margin: "0 24px", background: CARD, borderRadius: 20, padding: 24 }}>
        <h2
          style={{
            fontFamily: '"Bricolage Grotesque", ' + SANS,
            fontWeight: 400,
            fontSize: 24,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            color: INK,
            margin: "0 0 8px",
          }}
        >
          Join Hello Hoedspruit
        </h2>
        <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.5, color: MUTED_INK, margin: "0 0 20px" }}>
          Save your favourite places, follow local channels and keep up with what's on around town.
        </p>
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
            marginBottom: 10,
          }}
        >
          Create Account
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
          Log In
        </button>
      </div>

      <div style={{ height: 28 }} />

      <Eyebrow>Submissions</Eyebrow>
      <ExternalCard items={submissionsItems} />

      <div style={{ height: 28 }} />

      <Eyebrow>Support</Eyebrow>
      <Card items={supportItems} />

    </div>
  );
};

export default MyProfileGuest;
