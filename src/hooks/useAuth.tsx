import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { startSignup, type SignupDetails } from "@/lib/emailVerification";
import { savePendingPushToken, unregisterNativePush } from "@/lib/nativePush";

/**
 * Everything the signup form knows about the new account. It all travels as
 * user metadata because email confirmation means there is no session — and so
 * nothing the client can write to `profiles` — until the code has been
 * verified. `handle_new_user()` reads these off the auth row and builds the
 * profile from them.
 */
export type SignUpDetails = SignupDetails;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    opts?: SignUpDetails
  ) => Promise<{ error: Error | null; needsVerification: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (userId: string) => {
    try {
      const { data } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  };

  // If the user opted out of "Keep me signed in", end the session when the
  // tab/window is closed rather than persisting it to the next visit.
  useEffect(() => {
    const onHide = () => {
      if (localStorage.getItem("hh-keep-signed-in") === "0") {
        supabase.auth.signOut();
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  useEffect(() => {
    let mounted = true;


    const handleDeletedAccount = async () => {
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/welcome")) {
        window.location.href = "/welcome?deleted=1";
      }
    };

    const verifyStillExists = async (u: User) => {
      const { data, error } = await supabase.auth.getUser();
      // Only treat this as a deleted account when Supabase actually says the
      // user is gone. A network blip or a 5xx must never sign someone out and
      // bounce them to /welcome with an error toast.
      if (error) {
        const status = (error as { status?: number }).status;
        const msg = (error.message || "").toLowerCase();
        const gone =
          status === 401 ||
          status === 403 ||
          msg.includes("user not found") ||
          msg.includes("user_not_found");
        if (gone) {
          await handleDeletedAccount();
          return false;
        }
        // Unknown/transient failure: keep the existing session as-is.
        return true;
      }
      if (!data.user) {
        await handleDeletedAccount();
        return false;
      }
      return true;
    };


    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // The device's push token usually arrives before the session does
          // (cold start) or a user only just signed in — either way, this is
          // the first moment a token saved earlier can actually be attached
          // to somebody. No-ops if there's nothing pending.
          void savePendingPushToken();
          checkAdmin(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const ok = await verifyStillExists(session.user);
        if (!ok) {
          if (mounted) setLoading(false);
          return;
        }
        checkAdmin(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  /**
   * Create an account and send it a six-digit code.
   *
   * Not `supabase.auth.signUp()`: that makes Supabase send its own confirmation
   * email, rendered from whatever template the project has in its dashboard —
   * and when that is the stock one it contains a button and no code at all,
   * which is the bug this replaces. The account-email function creates the user
   * through the admin API instead, so the only email that goes out is the one
   * it sends itself, with the code in the subject line and the body.
   *
   * The account is created unconfirmed and cannot be signed in to until the
   * code comes back, so `needsVerification` is always true on success.
   */
  const signUp = async (email: string, password: string, opts?: SignUpDetails) => {
    const { error, code } = await startSignup(email, password, opts);
    if (error) {
      // Carry the machine-readable reason on the Error so the signup screen can
      // tell "that address is taken" apart from "that didn't send".
      const failure = new Error(error) as Error & { code?: string };
      failure.code = code;
      return { error: failure, needsVerification: false };
    }
    return { error: null, needsVerification: true };
  };

  const signOut = async () => {
    // Stop this device receiving the signed-out user's pushes (no-op on web).
    await unregisterNativePush();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
