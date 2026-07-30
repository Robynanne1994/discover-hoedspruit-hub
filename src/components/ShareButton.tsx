import { Share2 } from "lucide-react";
import { useShare } from "@/hooks/useShare";

interface ShareButtonProps {
  title: string;
  text?: string;
  /** Absolute URL or app path (e.g. "/events/123"). Defaults to the current page. */
  url?: string;
}

/** The small floating share pill on cards. Opens the phone's own share sheet. */
const ShareButton = ({ title, text, url }: ShareButtonProps) => {
  const share = useShare();

  const handleShare = (e: React.MouseEvent) => {
    // Cards sit inside a link — don't navigate on the way to the share sheet.
    e.stopPropagation();
    e.preventDefault();
    share({ title, text, url });
  };

  return (
    <button
      onClick={handleShare}
      className="absolute top-2 right-10 z-10 h-8 w-8 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-full shadow-[0_1px_4px_rgba(0,5,5,0.14)] hover:bg-white transition-colors"
      aria-label="Share"
    >
      <Share2 className="h-4 w-4 text-[rgba(18,18,20,0.55)]" />
    </button>
  );
};

export default ShareButton;
