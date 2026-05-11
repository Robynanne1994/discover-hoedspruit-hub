import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, X, Heart, Calendar, Tag, MapPinCheck, Bookmark,
  Bell, Settings, UserCircle, Shield,
  HelpCircle, MessageSquare, Phone, Info, Megaphone,
  type LucideIcon,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const INK = "#2A2A24";
const CREAM = "#EEE8DA";
const MUTED = "#6B6A5E";
const LINE = "#D9D2C0";
const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

type Row = { icon: LucideIcon; label: string; to: string };

const SECTIONS: { label: string; rows: Row[] }[] = [
  {
    label: "Saved",
    rows: [
      { icon: Bookmark, label: "My Hoedspruit", to: "/saved" },
    ],
  },
  {
    label: "Account",
    rows: [
      { icon: Bell, label: "Notifications", to: "/my-notifications" },
      { icon: UserCircle, label: "Account Info", to: "/account-settings/info" },
      { icon: Settings, label: "Settings", to: "/account-settings" },
    ],
  },
  {
    label: "Help Centre",
    rows: [
      { icon: HelpCircle, label: "Help Centre", to: "/faqs" },
      { icon: Phone, label: "Contact Us", to: "/contact" },
      { icon: Info, label: "About", to: "/about" },
      { icon: Shield, label: "Privacy & Security", to: "/privacy-security" },
    ],
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalMenuTrigger = ({
  open, onClick,
}: { open: boolean; onClick: () => void }) => (
  <button
    aria-label={open ? "Close menu" : "Open menu"}
    onClick={onClick}
    style={{
      width: 44, height: 44, borderRadius: 999,
      background: open ? INK : CREAM,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "none", cursor: "pointer", flexShrink: 0,
      transition: "background 180ms ease-out",
    }}
  >
    {open
      ? <X size={16} color={CREAM} strokeWidth={1.8} />
      : <Menu size={18} color={INK} strokeWidth={1.6} />}
  </button>
);

const GlobalMenu = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Close on back button
  useEffect(() => {
    if (!open) return;
    const onPop = (e: PopStateEvent) => {
      e.preventDefault();
      onOpenChange(false);
    };
    window.history.pushState({ globalMenu: true }, "");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open, onOpenChange]);

  if (!open && !confirmOpen) {
    // still need confirm dialog mounted? render conditionally below
  }

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <>
      {open && (
        <>
          {/* Scrim */}
          <div
            onClick={() => onOpenChange(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(20, 20, 18, 0.35)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
              zIndex: 90,
              animation: "ghm-fade 200ms ease-out",
            }}
          />
          {/* Panel */}
          <div
            role="dialog"
            aria-label="Menu"
            style={{
              position: "fixed",
              top: 88,
              right: 20,
              width: 330,
              maxWidth: "calc(100vw - 40px)",
              background: CREAM,
              borderRadius: 24,
              padding: "8px 0 16px",
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.18)",
              overflow: "hidden",
              zIndex: 100,
              animation: "ghm-panel 200ms ease-out",
            }}
          >
            {SECTIONS.map((section, i) => (
              <div
                key={section.label}
                style={{
                  borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                  padding: "12px 0 8px",
                }}
              >
                <div
                  style={{
                    fontFamily: SANS,
                    fontWeight: 400,
                    fontSize: 10.5,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: MUTED,
                    padding: "0 24px",
                    marginBottom: 6,
                  }}
                >
                  {section.label}
                </div>
                {section.rows.map(({ icon: Icon, label, to }) => (
                  <button
                    key={label}
                    onClick={() => go(to)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      width: "100%",
                      padding: "11px 24px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <Icon size={18} strokeWidth={1.5} color={MUTED} style={{ flexShrink: 0 }} />
                    <span
                      style={{
                        flex: 1,
                        fontFamily: SANS,
                        fontWeight: 400,
                        fontSize: 15,
                        letterSpacing: "-0.1px",
                        color: INK,
                      }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            ))}

            {/* Sign out */}
            <div
              style={{
                marginTop: 14,
                borderTop: `1px solid ${LINE}`,
                padding: "18px 24px 4px",
                textAlign: "center",
              }}
            >
              <button
                onClick={() => {
                  onOpenChange(false);
                  setConfirmOpen(true);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: 16,
                  color: INK,
                  opacity: 0.65,
                  textTransform: "lowercase",
                }}
              >
                sign out.
              </button>
            </div>
          </div>

          <style>{`
            @keyframes ghm-fade { from { opacity: 0 } to { opacity: 1 } }
            @keyframes ghm-panel {
              from { opacity: 0; transform: translateY(-8px) }
              to { opacity: 1; transform: translateY(0) }
            }
          `}</style>
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign in again to access your saved listings and account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => signOut()}>Sign out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GlobalMenu;
