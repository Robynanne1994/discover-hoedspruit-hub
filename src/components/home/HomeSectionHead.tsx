import { Link } from "react-router-dom";

const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const DISPLAY = "'Helvetica Neue', Helvetica, 'Pragmatica', 'Inter', sans-serif";
const SERIF = "'Playfair Display', 'Helvetica Neue', serif";

interface Props {
  primary: string;
  serif?: string;
  actionLabel?: string;
  actionHref?: string;
}

const HomeSectionHead = ({ primary, serif, actionLabel, actionHref }: Props) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        padding: "0 24px",
        marginBottom: 18,
        gap: 12,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 28,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: "#0A0A0A",
          fontStretch: "normal",
          textTransform: "none",
        }}
      >
        {primary}
        {serif && (
          <>
            {" "}
            <span
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 300,
                color: "#8A8480",
                letterSpacing: 0,
                fontStretch: "normal",
                textTransform: "none",
              }}
            >
              {serif}
            </span>
          </>
        )}
      </h2>
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          style={{
            fontFamily: SANS,
            fontSize: 13,
            color: "#8A8480",
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {actionLabel} ›
        </Link>
      )}
    </div>
  );
};

export default HomeSectionHead;
