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
          fontFamily: DISPLAY,
          fontWeight: 500,
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
                fontFamily: DISPLAY,
                fontStyle: "normal",
                fontWeight: 500,
                fontSize: 28,
                color: "#0A0A0A",
                letterSpacing: "-0.02em",
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
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 12,
            lineHeight: 1,
            textTransform: "uppercase",
            color: "#5b4632",
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
