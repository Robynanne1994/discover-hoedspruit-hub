import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const GUEST_KEY = "hh-guest-mode";

interface GuestAuthContextType {
  isGuest: boolean;
  enterGuest: () => void;
  exitGuest: () => void;
  /** Returns true if the user is authenticated. If not, opens the sign-up prompt and returns false. */
  requireAuth: (action?: string) => boolean;
}

const GuestAuthContext = createContext<GuestAuthContextType | undefined>(undefined);

export const GuestAuthProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
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
      setAction(a || "");
      setPromptOpen(true);
      return false;
    },
    [user],
  );

  const value = useMemo(
    () => ({ isGuest, enterGuest, exitGuest, requireAuth }),
    [isGuest, enterGuest, exitGuest, requireAuth],
  );

  const goAuth = (mode: "signup" | "signin") => {
    setPromptOpen(false);
    exitGuest();
    // Welcome screen handles both modes
    navigate("/welcome", { state: { mode } });
  };

  return (
    <GuestAuthContext.Provider value={value}>
      {children}
      {/* Dismissable bottom sheet. Tapping outside, the close button, or
          "Not now" closes it back to wherever the guest was — it never
          navigates away or traps them on a full-screen sign-in wall. */}
      <Sheet open={promptOpen} onOpenChange={setPromptOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-[480px] rounded-t-3xl border-0 px-6 pb-8 pt-6"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl font-semibold">Create an account</SheetTitle>
            <SheetDescription className="text-[15px] leading-snug pt-1">
              {action
                ? `Sign up or log in to ${action}.`
                : "Sign up or log in to use this feature."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2 mt-5">
            <Button
              onClick={() => goAuth("signup")}
              className="w-full h-12 rounded-full"
              style={{ background: "#423324", color: "#FFFFFF" }}
            >
              Create account
            </Button>
            <Button
              variant="outline"
              onClick={() => goAuth("signin")}
              className="w-full h-12 rounded-xl"
              style={{ borderColor: "#715a3d", color: "#715a3d" }}
            >
              Log in
            </Button>
            <button
              onClick={() => setPromptOpen(false)}
              className="text-sm mt-1 mx-auto text-muted-foreground"
            >
              Not now
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </GuestAuthContext.Provider>
  );
};

export const useGuestAuth = () => {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) throw new Error("useGuestAuth must be used within GuestAuthProvider");
  return ctx;
};

export const useRequireAuth = () => useGuestAuth().requireAuth;
