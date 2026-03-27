import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  actionHref?: string;
}

const SectionHeader = ({ title, actionLabel, actionHref }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-4 mb-3">
      <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
        {title}
      </h2>
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
