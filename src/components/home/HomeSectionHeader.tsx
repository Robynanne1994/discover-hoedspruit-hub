import { Link } from "react-router-dom";

interface HomeSectionHeaderProps {
  title: string;
  actionLabel?: string;
  actionHref?: string;
}

const HomeSectionHeader = ({ title, actionLabel, actionHref }: HomeSectionHeaderProps) => {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20, marginTop: 18 }}>
      <h2 className="font-semibold" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 22, color: "#020202", textTransform: "uppercase", letterSpacing: "0.01em" }}>
        {title}
      </h2>
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          style={{ fontSize: 12, fontWeight: 600, color: "rgba(18,18,20,0.35)", textTransform: "uppercase", letterSpacing: 1.5, textDecoration: "none" }}
        >
          {actionLabel} ›
        </Link>
      )}
    </div>
  );
};

export default HomeSectionHeader;
