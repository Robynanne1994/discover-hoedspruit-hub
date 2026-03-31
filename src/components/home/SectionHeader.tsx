import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  actionHref?: string;
}

const SectionHeader = ({ title, actionLabel, actionHref }: SectionHeaderProps) => {
  return (
    <div className="flex items-center gap-3 px-4 mb-3 mt-6">
      <h2 className="font-bold text-foreground whitespace-nowrap text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
        {title}
      </h2>
      <div className="flex-1 h-px bg-border" />
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
