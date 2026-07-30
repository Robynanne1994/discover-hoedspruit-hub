import { useEffect, useState } from "react";
import { Check, Link2, Mail, MessageSquare, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import {
  copyToClipboard,
  openShareTarget,
  shareTargets,
  toShareUrl,
  type ShareContent,
  type ShareTarget,
} from "@/lib/share";

// Design tokens — kept in sync with the app's other editorial bottom sheets
// (the guest sign-up prompt, "Suggest an Edit") so this reads as one app.
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const C = {
  surface: "#ffffff",
  heading: "#1A1A1A",
  text: "#2b2420",
  muted: "#8A8480",
  cream: "#f5f0e8",
  line: "#E7E2DA",
  dark: "#423324",
};

// Brand marks are inlined rather than pulled from an icon pack: lucide dropped
// its brand glyphs, and these are the only three we need.
const BRAND: Record<string, { bg: string; path: string }> = {
  whatsapp: {
    bg: "#25D366",
    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.966 1.164-.198.199-.396.223-.693.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.446.52-.668.174-.223.232-.38.347-.63.115-.25.058-.462-.017-.61-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  },
  facebook: {
    bg: "#1877F2",
    path: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.104-.287 1.563h-3.246v8.443A12.001 12.001 0 0 0 24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.628 3.874 10.35 9.101 11.691Z",
  },
  x: {
    bg: "#000000",
    path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  },
};

const TargetIcon = ({ target }: { target: ShareTarget }) => {
  const brand = BRAND[target.key];
  if (brand) {
    return (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="#ffffff" aria-hidden="true">
        <path d={brand.path} />
      </svg>
    );
  }
  if (target.key === "sms") return <MessageSquare size={21} strokeWidth={1.7} color="#ffffff" />;
  return <Mail size={21} strokeWidth={1.7} color="#ffffff" />;
};

interface ShareSheetProps {
  open: boolean;
  content: ShareContent | null;
  onClose: () => void;
}

/**
 * The in-app share sheet.
 *
 * This is the fallback for runtimes with no system share sheet — desktop Chrome
 * and Firefox, or an embedded webview that blocks the Web Share API. On a phone
 * the user gets their own OS sheet instead and never sees this (see share.ts).
 */
const ShareSheet = ({ open, content, onClose }: ShareSheetProps) => {
  const [copied, setCopied] = useState(false);

  // Escape closes, and the page behind the sheet stops scrolling while it's up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  // Reset the copied tick so a second share doesn't open pre-confirmed.
  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open || !content) return null;

  const url = toShareUrl(content.url);
  const targets = shareTargets(content);

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (!ok) {
      toast.error("Could not copy link");
      return;
    }
    setCopied(true);
    toast.success("Link copied!");
    // Leave the tick on screen long enough to register, then get out of the way.
    window.setTimeout(onClose, 700);
  };

  const handleTarget = (target: ShareTarget) => {
    openShareTarget(target);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: "rgba(10,10,10,0.4)",
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily: FONT,
          width: "100%",
          maxWidth: 480,
          margin: "0 auto",
          background: C.surface,
          borderRadius: "20px 20px 0 0",
          padding: "18px 20px calc(env(safe-area-inset-bottom) + 28px)",
          animation: "sh-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <style>{`@keyframes sh-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontFamily: HEAD, fontWeight: 550, fontSize: 20, color: C.heading, margin: 0 }}>
            Share
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}
          >
            <XIcon size={20} color={C.heading} strokeWidth={1.75} />
          </button>
        </div>

        {/* What is being shared, so the link is never a mystery. */}
        <div style={{ background: C.cream, borderRadius: 14, padding: "12px 14px", marginBottom: 18 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.35,
              color: C.heading,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {content.title}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: C.muted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {url.replace(/^https?:\/\//, "")}
          </p>
        </div>

        {/* Share via… */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 4,
            marginBottom: 18,
          }}
        >
          {targets.map((target) => (
            <button
              key={target.key}
              onClick={() => handleTarget(target)}
              aria-label={`Share via ${target.label}`}
              style={{
                flex: "0 0 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                width: 58,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 9999,
                  background: BRAND[target.key]?.bg ?? C.dark,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TargetIcon target={target} />
              </span>
              <span style={{ fontFamily: FONT, fontSize: 11, color: C.text, lineHeight: 1.2 }}>
                {target.label}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          style={{
            fontFamily: FONT,
            width: "100%",
            height: 48,
            borderRadius: 9999,
            background: C.dark,
            color: "#ffffff",
            border: "none",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {copied ? <Check size={17} strokeWidth={2} /> : <Link2 size={17} strokeWidth={1.8} />}
          {copied ? "Link copied" : "Copy link"}
        </button>

        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            margin: "10px auto 0",
            display: "block",
            fontFamily: FONT,
            fontSize: 13,
            color: C.muted,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ShareSheet;
