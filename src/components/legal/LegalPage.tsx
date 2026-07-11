import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import Seo from "@/components/Seo";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const DISPLAY = '"Bricolage Grotesque", ' + SANS;

const BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#0A0A0A";
const MUTED = "#8A8480";

interface LegalPageProps {
  title: string;
  footer?: string;
  /** Human-readable date this page was last updated (e.g. "15 June 2026"). */
  lastUpdated?: string;
  children: ReactNode;
}

export const LegalPage = ({ title, footer, lastUpdated, children }: LegalPageProps) => {
  const displayTitle = title.replace(/\.$/, "");
  const location = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, color: INK, paddingBottom: 120 }}>
      <Seo
        title={`${displayTitle} — Hello Hoedspruit`}
        description={`Read the ${displayTitle.toLowerCase()} for the Hello Hoedspruit app — how we operate, your rights and how to get in touch.`}
        path={location.pathname}
      />
      {/* Top bar — shared header so the page title matches the rest of the app */}
      <PageHeader title={displayTitle} />

      {/* Sections */}
      <div style={{ padding: "24px 20px 0", display: "flex", flexDirection: "column", gap: 32 }}>
        {lastUpdated && (
          <Section heading="Last Updated">
            <P last>{lastUpdated}</P>
          </Section>
        )}
        {children}
      </div>

      {/* Footer */}
      {footer && (
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
              fontSize: 14, lineHeight: 1.6, color: MUTED, margin: 0,
            }}
          >
            {footer}
          </p>
        </div>
      )}
    </div>
  );
};

export const Section = ({ heading, children }: { heading: string; children: ReactNode }) => {
  return (
    <div>
      <div
        role="heading"
        aria-level={2}
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#1A1A1A",
          margin: "0 0 12px 0",
          padding: 0,
        }}
      >
        {heading}
      </div>
      <section
        style={{
          background: CARD,
          borderRadius: 24,
          padding: 20,
        }}
      >
        {children}
      </section>
    </div>
  );
};

export const P = ({ children, last }: { children: ReactNode; last?: boolean }) => (
  <p
    style={{
      fontFamily: SANS,
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.6,
      color: INK,
      margin: 0,
      marginBottom: last ? 0 : 14,
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
          fontSize: 14,
          fontWeight: 400,
          lineHeight: 1.6,
          color: INK,
          marginBottom: i === items.length - 1 ? 0 : 10,
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 9,
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: INK,
          }}
        />
        {item}
      </li>
    ))}
  </ul>
);
