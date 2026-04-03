import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  actionHref?: string;
}

const SectionHeader = ({ title, actionLabel, actionHref }: SectionHeaderProps) => {
  return (
    <div className="flex items-baseline justify-between px-5 mb-5">
      <h2
        className="tracking-tight font-sans font-extrabold text-3xl text-[#111113]"
      >
        {title}
      </h2>
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="flex items-center gap-0.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors tracking-wide uppercase"
        >
          {actionLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
