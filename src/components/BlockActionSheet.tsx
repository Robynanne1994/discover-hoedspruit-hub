import type { ReactNode } from "react";
import { X } from "lucide-react";

const INK = "#1A1A1A";
const BODY = "#2b2420";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  body: ReactNode;
  /** Optional cream callout under the body — used for the cooldown rule. */
  note?: ReactNode;
  /**
   * Omit to make this an acknowledge-only sheet: the footer collapses to a
   * single "Got It" button that just closes.
   */
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
};

/**
 * The bottom sheet used by every block / unblock confirmation and by the
 * cooldown explainer, so the wording changes but the look never does.
 */
const BlockActionSheet = ({
  open,
  onClose,
  title,
  body,
  note,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}: Props) => {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(10,10,10,0.4)",
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily: SANS,
          width: "100%",
          background: "#ffffff",
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px 32px",
          animation: "bu-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        <style>{`@keyframes bu-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}
          >
            <X size={20} color={INK} strokeWidth={1.75} />
          </button>
        </div>

        <h2 style={{ fontFamily: HEAD, fontWeight: 550, fontSize: 22, color: INK, margin: "0 0 8px" }}>
          {title}
        </h2>
        <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.55, color: BODY, margin: 0 }}>
          {body}
        </p>

        {note && (
          <div
            style={{
              marginTop: 14,
              background: "#f5f0e8",
              borderRadius: 14,
              padding: "12px 14px",
              fontFamily: SANS,
              fontSize: 13,
              lineHeight: 1.5,
              color: BODY,
            }}
          >
            {note}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          {onConfirm && (
            <button
              onClick={onClose}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 9999,
                background: "transparent",
                border: "1px solid #C5C0BA",
                color: INK,
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              else onClose();
            }}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 9999,
              background: "#423324",
              color: "#FFFFFF",
              border: "none",
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {onConfirm ? confirmLabel : "Got It"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockActionSheet;
