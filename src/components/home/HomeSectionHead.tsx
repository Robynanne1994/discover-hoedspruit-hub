import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { BODY_INK, type } from "@/lib/type";


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
      <h2 style={{ ...type.sectionTitle, margin: 0 }}>
        {title}
      </h2>
      {actionHref && (
        <Link
          to={actionHref}
          style={{
            ...type.meta,
            color: BODY_INK,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            whiteSpace: "nowrap",
          }}
        >
          {actionLabel}
          <ArrowUpRight size={15} strokeWidth={1.5} />
        </Link>
      )}
    </div>
  );
};

export default HomeSectionHead;
