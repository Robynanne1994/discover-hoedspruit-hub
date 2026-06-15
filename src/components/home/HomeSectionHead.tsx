import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

interface Props {
  primary: string;
  serif?: string;
  actionLabel?: string;
  actionHref?: string;
}

const HomeSectionHead = ({ primary, serif, actionLabel = "View All", actionHref }: Props) => {
  const title = serif ? `${primary} ${serif}` : primary;
  return (
    <div
      style={{
        padding: "0 20px",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: HN,
          fontWeight: 400,
          fontSize: 22,
          letterSpacing: "0.01em",
          color: "#020202",
        }}
      >
        {title}
      </h2>
      {actionHref && (
        <Link
          to={actionHref}
          style={{
            fontFamily: HN,
            fontSize: 13,
            color: "#2b2420",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "flex-start",
            gap: 2,
            lineHeight: 1,
          }}
        >
          {actionLabel}
          <ArrowUpRight size={15} strokeWidth={1.5} style={{ display: "block" }} />
        </Link>
      )}
    </div>
  );
};

export default HomeSectionHead;
