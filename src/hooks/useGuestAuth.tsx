import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { X as XIcon } from "lucide-react";

const GUEST_KEY = "hh-guest-mode";

// Design tokens — kept in sync with the editorial modals (e.g. the
// "Suggest an Edit" sheet on the listing detail page) so the sign-up
// prompt feels like the rest of the app rather than a stock component.
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const C = {
  surface: "#ffffff",
  heading: "#1A1A1A",
  text: "#2b2420",
  muted: "#8A8480",
  primary: "#715a3d",
  dark: "#423324",
};

interface GuestAuthContextType {
  isGuest: boolean;
  enterGuest: () => void;
  exitGuest: () => void;
  /** Returns true if the user is authenticated. If not, opens the sign-up prompt and returns false. */
  requireAuth: (action?: string) => boolean;
}

const GuestAuthContext = createContext<GuestAuthContextType | undefined>(undefined);

export const GuestAuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(GUEST_KEY) === "1" || sessionStorage.getItem(GUEST_KEY) === "1";
  });
  const [promptOpen, setPromptOpen] = useState(false);
  const [action, setAction] = useState<string>("");

  // If the user signs in, guest mode is no longer relevant.
  useEffect(() => {
    if (user && isGuest) {
      sessionStorage.removeItem(GUEST_KEY);
      setIsGuest(false);
    }
  }, [user, isGuest]);

  // Browsing is free: anyone without a session is a guest by default, with no
  // button to press first. Nothing in the app may present a sign-in wall on
  // launch (App Store guideline 5.1.1(v)) — an account is only ever needed for
  // account-based features like saving, following and reviewing.
  useEffect(() => {
    if (loading || user || isGuest) return;
    localStorage.setItem(GUEST_KEY, "1");
    sessionStorage.setItem(GUEST_KEY, "1");
    setIsGuest(true);
  }, [loading, user, isGuest]);

  // If the auth session hydrates while the sign-up prompt is open, close it —
  // otherwise a returning user briefly sees "Create an Account" for an action
  // they're actually already allowed to perform.
  useEffect(() => {
    if (user && promptOpen) setPromptOpen(false);
  }, [user, promptOpen]);

  const enterGuest = useCallback(() => {
    localStorage.setItem(GUEST_KEY, "1");
    sessionStorage.setItem(GUEST_KEY, "1");
    setIsGuest(true);
  }, []);

  const exitGuest = useCallback(() => {
    localStorage.removeItem(GUEST_KEY);
    sessionStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
  }, []);

  const requireAuth = useCallback(
    (a?: string) => {
      if (user) return true;
      // Auth is still hydrating — don't flash the sign-up prompt at a user
      // who actually has a valid session. Just swallow the interaction; the
      // next tap after hydration will behave correctly.
      if (loading) return false;
      setAction(a || "");
      setPromptOpen(true);
      return false;
    },
    [user, loading],
  );

  const value = useMemo(
    () => ({ isGuest, enterGuest, exitGuest, requireAuth }),
    [isGuest, enterGuest, exitGuest, requireAuth],
  );

  const goAuth = (mode: "signup" | "signin") => {
    setPromptOpen(false);
    // Guest mode is left in place: if they back out of the welcome screen they
    // land straight back in free browsing rather than on a sign-in wall.
    // Welcome screen handles both modes
    navigate("/welcome", { state: { mode } });
  };

  return (
    <GuestAuthContext.Provider value={value}>
      {children}
      {/* Dismissable bottom sheet styled to match the app's other modals
          (e.g. "Suggest an Edit"). Tapping outside, the close button, or
          "Not now" closes it back to wherever the guest was — it never
          navigates away or traps them on a full-screen sign-in wall. It
          always offers the Create account / Log in options rather than a
          bare error message. */}
      {promptOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPromptOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(10,10,10,0.4)",
            display: "flex", alignItems: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              fontFamily: FONT, width: "100%", maxWidth: 480, margin: "0 auto",
              background: C.surface, borderRadius: "20px 20px 0 0",
              padding: "20px 20px 32px",
              animation: "gp-slide-up 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
              maxHeight: "90vh", overflowY: "auto",
            }}
          >
            <style>{`@keyframes gp-slide-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 4 }}>
              <button
                onClick={() => setPromptOpen(false)}
                aria-label="Close"
                style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}
              >
                <XIcon size={20} color={C.heading} strokeWidth={1.75} />
              </button>
            </div>
            <h2 style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 22, color: C.heading, margin: "0 0 8px" }}>
              Create an Account
            </h2>
            <p style={{ fontFamily: FONT, fontSize: 14, lineHeight: 1.55, color: C.text, margin: "0 0 20px" }}>
              {action
                ? `Sign up or log in to ${action}.`
                : "Sign up or log in to use this feature."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={() => goAuth("signup")}
                style={{
                  fontFamily: FONT, width: "100%", height: 48, borderRadius: 9999,
                  background: C.dark, color: "#FFFFFF", border: "none",
                  fontSize: 14, fontWeight: 500, lineHeight: "20px",
                  cursor: "pointer",
                }}
              >
                Create account
              </button>
              <button
                onClick={() => goAuth("signin")}
                style={{
                  fontFamily: FONT, width: "100%", height: 48, borderRadius: 9999,
                  background: "transparent", color: C.primary,
                  border: `2px solid ${C.primary}`,
                  fontSize: 14, fontWeight: 500, lineHeight: "20px",
                  cursor: "pointer",
                }}
              >
                Log in
              </button>
              <button
                onClick={() => setPromptOpen(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 4, margin: "4px auto 0",
                  fontFamily: FONT, fontSize: 13, color: C.muted,
                }}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </GuestAuthContext.Provider>
  );
};

export const useGuestAuth = () => {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) throw new Error("useGuestAuth must be used within GuestAuthProvider");
  return ctx;
};

export const useRequireAuth = () => useGuestAuth().requireAuth;
