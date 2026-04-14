import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
}

const ShareButton = ({ title, text, url }: ShareButtonProps) => {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const shareUrl = url || window.location.href;
    const shareData = { title, text: text || title, url: shareUrl };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await fallbackCopy(shareUrl);
        }
      }
    } else {
      await fallbackCopy(shareUrl);
    }
  };

  const fallbackCopy = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="absolute top-2 right-10 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-white transition-colors"
      aria-label="Share"
    >
      <Share2 className="h-4 w-4 text-muted-foreground" />
    </button>
  );
};

export default ShareButton;
