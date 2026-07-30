import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import ShareSheet from "@/components/ShareSheet";
import { openSystemShareSheet, preloadShare, toShareUrl, type ShareContent } from "@/lib/share";

type ShareFn = (content: ShareContent) => void;

const ShareContext = createContext<ShareFn | undefined>(undefined);

/**
 * Owns the one share sheet the whole app falls back to, so every Share control
 * behaves identically: tap it and the phone's own sheet opens, with copy-link
 * and the user's messaging apps. Only when the runtime has no system sheet
 * (desktop Chrome/Firefox, a locked-down webview) does the in-app sheet appear.
 */
export const ShareProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContent] = useState<ShareContent | null>(null);

  // Fetch the native plugin chunk up front so the first tap opens the OS sheet
  // with no visible delay.
  useEffect(() => {
    preloadShare();
  }, []);

  const share = useCallback<ShareFn>((next) => {
    // Not awaited: openSystemShareSheet calls navigator.share before it yields,
    // which is what keeps the tap's user activation valid on the web path.
    void openSystemShareSheet(next).then((outcome) => {
      // "shared" and "dismissed" both mean the OS sheet did its job.
      if (outcome === "unsupported" || outcome === "failed") {
        setContent({ ...next, url: toShareUrl(next.url) });
      }
    });
  }, []);

  const close = useCallback(() => setContent(null), []);

  return (
    <ShareContext.Provider value={share}>
      {children}
      <ShareSheet open={!!content} content={content} onClose={close} />
    </ShareContext.Provider>
  );
};

/**
 * Returns `share({ title, text, url })`. Call it directly from the click
 * handler — the Web Share API needs the tap's user activation, so don't await
 * anything before it.
 */
export const useShare = (): ShareFn => {
  const ctx = useContext(ShareContext);
  if (!ctx) throw new Error("useShare must be used within ShareProvider");
  return ctx;
};
