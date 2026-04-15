import { Link } from "react-router-dom";

interface HomeSectionHeaderProps {
  title: string;
  actionLabel?: string;
  actionHref?: string;
}

const HomeSectionHeader = ({ title, actionLabel, actionHref }: HomeSectionHeaderProps) => {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
      <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 42, color: "#1A1A1A", letterSpacing: -1, lineHeight: 1.1 }}>
        {title}
      </h2>
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          style={{ fontSize: 11, fontWeight: 500, color: "rgba(18,18,20,0.35)", textTransform: "uppercase", letterSpacing: 1, textDecoration: "none" }}
        >
          {actionLabel} ›
        </Link>
      )}
    </div>
  );
};

export default HomeSectionHeader;
