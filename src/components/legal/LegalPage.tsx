import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import BackArrowIcon from "@/components/ui/BackArrowIcon";

const sans = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const serif = "'Playfair Display', Georgia, serif";

const C = {
  olive: "#5C6446",
  cream: "#EEE8DA",
  ink: "#2A2A24",
  rust: "#9B5A3C",
};

const titleSizeFor = (s: string) => {
  const n = s.length;
  if (n <= 16) return 60;
  if (n <= 22) return 54;
  if (n <= 28) return 48;
  return 42;
};

interface LegalPageProps {
  title: string; // lowercase with full stop, e.g. "terms of use."
  lastUpdated?: Date;
  footer: string;
  children: ReactNode;
}

export const LegalPage = ({ title, lastUpdated, footer, children }: LegalPageProps) => {
  const navigate = useNavigate();
  const date = lastUpdated || new Date(document.lastModified || Date.now());
  const dateStr = date.toLocaleString("en-GB", { month: "long", year: "numeric" });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.olive,
        paddingBottom: 120,
        fontFamily: sans,
        color: C.cream,
      }}
    >
      {/* Top bar */}
      <div style={{ paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: 9999,
            background: C.cream,
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <BackArrowIcon size={18} color={C.ink} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ paddingTop: 18, paddingLeft: 24, paddingRight: 24, paddingBottom: 36 }}>
        <div
          style={{
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: "2.4px",
            textTransform: "uppercase",
            color: "rgba(238,232,218,0.7)",
            marginBottom: 14,
          }}
        >
          The small print
        </div>
        <h1
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: titleSizeFor(title),
            lineHeight: 0.92,
            letterSpacing: "-2px",
            color: C.cream,
            margin: 0,
            marginBottom: 14,
          }}
        >
          {title}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: C.rust,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontWeight: 400,
              fontSize: 15,
              lineHeight: 1.65,
              color: "rgba(238,232,218,0.9)",
            }}
          >
            Last updated {dateStr}.
          </span>
        </div>
      </div>

      {/* Sections */}
      <div>{children}</div>

      {/* Editorial footer */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 24,
          paddingLeft: 24,
          paddingRight: 24,
          borderTop: "1px solid rgba(238, 232, 218, 0.18)",
        }}
      >
        <p
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 14,
            lineHeight: 1.55,
            color: "rgba(238,232,218,0.65)",
            margin: 0,
          }}
        >
          {footer}
        </p>
      </div>
    </div>
  );
};

export const Section = ({ heading, children }: { heading: string; children: ReactNode }) => (
  <section style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 32 }}>
    <h2
      style={{
        fontFamily: serif,
        fontStyle: "italic",
        fontWeight: 400,
        fontSize: 26,
        lineHeight: 1,
        letterSpacing: "-0.4px",
        color: C.cream,
        margin: 0,
        marginBottom: 14,
        textTransform: "lowercase",
      }}
    >
      {heading}
    </h2>
    {children}
  </section>
);

export const P = ({ children, last }: { children: ReactNode; last?: boolean }) => (
  <p
    style={{
      fontFamily: sans,
      fontSize: 15,
      fontWeight: 400,
      lineHeight: 1.65,
      color: "rgba(238,232,218,0.9)",
      margin: 0,
      marginBottom: last ? 0 : 14,
    }}
  >
    {children}
  </p>
);

export const Em = ({ children }: { children: ReactNode }) => (
  <span style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 400 }}>{children}</span>
);

export const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    style={{
      color: C.cream,
      textDecoration: "none",
      borderBottom: "1px solid rgba(238, 232, 218, 0.4)",
      paddingBottom: 1,
    }}
  >
    {children}
  </a>
);

export const List = ({ items }: { items: ReactNode[] }) => (
  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
    {items.map((item, i) => (
      <li
        key={i}
        style={{
          position: "relative",
          paddingLeft: 20,
          fontFamily: sans,
          fontSize: 15,
          fontWeight: 400,
          lineHeight: 1.65,
          color: "rgba(238,232,218,0.9)",
          marginBottom: i === items.length - 1 ? 0 : 8,
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 11,
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: C.rust,
          }}
        />
        {item}
      </li>
    ))}
  </ul>
);
