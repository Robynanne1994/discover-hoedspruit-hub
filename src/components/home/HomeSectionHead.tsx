import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const SANS = "'Helvetica World', Helvetica, Arial, sans-serif";
const DISPLAY = "'Helvetica World', Helvetica, Arial, sans-serif";
const SERIF = "'Helvetica World', Helvetica, Arial, sans-serif";

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
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 400,
          fontStyle: "italic",
          fontSize: 28,
          lineHeight: "28px",
          letterSpacing: "-0.5px",
          color: "#EEE8DA",
          textTransform: "lowercase",
        }}
      >
        {primary}
        {serif && (
          <>
            {" "}
            <span
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 28,
                color: "#EEE8DA",
                letterSpacing: "-0.5px",
                textTransform: "lowercase",
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
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 12,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "1.6px",
            color: "rgba(238, 232, 218, 0.85)",
            borderBottom: "1px solid rgba(238,232,218,0.4)",
            paddingBottom: 2,
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          {actionLabel}
          <ArrowUpRight size={14} strokeWidth={2} style={{ display: "block" }} />
        </Link>
      )}
    </div>
  );
};

export default HomeSectionHead;
