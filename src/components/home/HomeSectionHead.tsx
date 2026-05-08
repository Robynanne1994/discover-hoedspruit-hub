import { Link } from "react-router-dom";

interface Props {
  primary: string;
  serif?: string;
  actionLabel?: string;
  actionHref?: string;
}

const HomeSectionHead = ({ primary, serif, actionLabel, actionHref }: Props) => {
  const heading = serif ? `${primary} ${serif}` : primary;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        padding: "0 24px",
        marginBottom: 16,
        gap: 12,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 400,
          fontStyle: "italic",
          fontSize: 32,
          lineHeight: 1.0,
          letterSpacing: "-0.5px",
          color: "#EEE8DA",
          textTransform: "lowercase",
        }}
      >
        {heading.toLowerCase()}
      </h2>
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 400,
            fontSize: 11,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "1.8px",
            color: "rgba(238, 232, 218, 0.85)",
            borderBottom: "1px solid rgba(238,232,218,0.4)",
            paddingBottom: 2,
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
            display: "inline-block",
          }}
        >
          {actionLabel}
          <span style={{ marginLeft: 4 }}>↗</span>
        </Link>
      )}
    </div>
  );
};

export default HomeSectionHead;
