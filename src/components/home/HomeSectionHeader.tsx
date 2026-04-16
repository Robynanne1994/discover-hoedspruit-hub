import { Link } from "react-router-dom";

interface HomeSectionHeaderProps {
  title: string;
  actionLabel?: string;
  actionHref?: string;
}

const HomeSectionHeader = ({ title, actionLabel, actionHref }: HomeSectionHeaderProps) => {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
      <h2 style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontWeight: 400,
        fontSize: 34,
        color: "#020202",
        letterSpacing: "0.01em",
        lineHeight: 1.1,
        margin: 0,
      }}>
        {title}
      </h2>
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 15,
            fontWeight: 400,
            color: "rgba(18,18,20,0.55)",
            textDecoration: "none",
          }}
        >
          {actionLabel} ›
        </Link>
      )}
    </div>
  );
};

export default HomeSectionHeader;
