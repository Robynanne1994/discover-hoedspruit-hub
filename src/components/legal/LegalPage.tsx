import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Heart,
  ShieldCheck,
  MapPin,
  Ban,
  AlertOctagon,
  Flag,
  Mail,
  Cookie,
  Eye,
  Share2,
  Lock,
  Baby,
  RefreshCw,
  Users,
  Building2,
  UserCircle,
  ScrollText,
  Copyright,
  Link2,
  Scale,
  AlertTriangle,
  XCircle,
  Gavel,
  Settings,
  Database,
} from "lucide-react";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const BG = "#ebebeb";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const BODY = "#2b2420";
const LINE = "rgba(26,26,26,0.08)";
const ICON_BG = "rgba(26,26,26,0.06)";
const RUST = "#9B5A3C";

const ICON_MAP: Record<string, any> = {
  // Terms
  "agreement to terms": FileText,
  "who we are": Users,
  "use of the app": Settings,
  accounts: UserCircle,
  "content & listings": ScrollText,
  "user content": Eye,
  "intellectual property": Copyright,
  "third-party links": Link2,
  "limitation of liability": Scale,
  disclaimer: AlertTriangle,
  termination: XCircle,
  "changes to these terms": RefreshCw,
  "governing law": Gavel,
  // Privacy
  "information we collect": Database,
  "how we use your information": Settings,
  "data sharing": Share2,
  "cookies & tracking": Cookie,
  "your rights": ShieldCheck,
  "data security": Lock,
  "children's privacy": Baby,
  "changes to this policy": RefreshCw,
  // Cookies
  "what are cookies": Cookie,
  "how we use cookies": Settings,
  "third-party cookies": Share2,
  "managing your preferences": Settings,
  // Community
  "be respectful": Heart,
  "keep it honest": ShieldCheck,
  "stay on topic": MapPin,
  "no spam or self-promotion": Ban,
  "no illegal content": AlertOctagon,
  "reporting & enforcement": Flag,
  contact: Mail,
};

const tap = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(0.96)"; },
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.transform = "scale(1)"; },
};

interface LegalPageProps {
  title: string;
  footer: string;
  children: ReactNode;
}

export const LegalPage = ({ title, footer, children }: LegalPageProps) => {
  const navigate = useNavigate();
  const displayTitle = title.replace(/\.$/, "").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, color: INK, paddingBottom: 120 }}>
      {/* Top bar */}
      <div style={{ padding: "56px 20px 0", display: "flex", alignItems: "center", minHeight: 44 }}>
        <button
          onClick={() => navigate(-1)}
          {...tap}
          aria-label="Back"
          style={{
            width: 40, height: 40, borderRadius: "50%", background: CARD, border: "none",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0, transition: "transform 150ms ease-out",
          }}
        >
          <ArrowLeft size={18} strokeWidth={2} color={INK} />
        </button>
        <div style={{ flex: 1, textAlign: "center", marginRight: 40, fontWeight: 700, fontSize: 17, color: INK, letterSpacing: 0.1 }}>
          {displayTitle}
        </div>
      </div>

      <div style={{ height: 1, background: LINE, marginTop: 22 }} />

      {/* Sections */}
      <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{ padding: "24px 24px 0", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <span
          aria-hidden
          style={{
            width: 7, height: 7, borderRadius: "50%", background: INK,
            flexShrink: 0, marginTop: 9,
          }}
        />
        <p
          style={{
            fontFamily: SANS, fontStyle: "italic", fontWeight: 400,
            fontSize: 14, lineHeight: 1.6, color: BODY, margin: 0,
          }}
        >
          {footer}
        </p>
      </div>
    </div>
  );
};

export const Section = ({ heading, children }: { heading: string; children: ReactNode }) => {
  const Icon = ICON_MAP[heading.toLowerCase()] || FileText;
  return (
    <section
      style={{
        background: CARD,
        borderRadius: 18,
        padding: "22px 22px 24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div
          aria-hidden
          style={{
            width: 36, height: 36, borderRadius: "50%", background: ICON_BG,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <Icon size={17} color={INK} strokeWidth={1.8} />
        </div>
        <h2
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 17,
            lineHeight: 1.2,
            letterSpacing: -0.1,
            color: INK,
            margin: 0,
            textTransform: "none",
          }}
        >
          {heading.replace(/\b\w/g, (c) => c.toUpperCase())}
        </h2>
      </div>
      {children}
    </section>
  );
};

export const P = ({ children, last }: { children: ReactNode; last?: boolean }) => (
  <p
    style={{
      fontFamily: SANS,
      fontSize: 15,
      fontWeight: 400,
      lineHeight: 1.6,
      color: BODY,
      margin: 0,
      marginBottom: last ? 0 : 12,
    }}
  >
    {children}
  </p>
);

export const Em = ({ children }: { children: ReactNode }) => (
  <span style={{ fontStyle: "italic" }}>{children}</span>
);

export const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    style={{
      color: INK,
      textDecoration: "underline",
      textUnderlineOffset: 2,
      fontWeight: 500,
    }}
  >
    {children}
  </a>
);

export const List = ({ items }: { items: ReactNode[] }) => (
  <ul style={{ listStyle: "none", padding: 0, margin: "4px 0 0" }}>
    {items.map((item, i) => (
      <li
        key={i}
        style={{
          position: "relative",
          paddingLeft: 18,
          fontFamily: SANS,
          fontSize: 15,
          fontWeight: 400,
          lineHeight: 1.6,
          color: BODY,
          marginBottom: i === items.length - 1 ? 0 : 8,
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 10,
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: RUST,
          }}
        />
        {item}
      </li>
    ))}
  </ul>
);
