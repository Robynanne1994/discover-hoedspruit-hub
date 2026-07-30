import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Everything the signup form knows about the new account. It all travels as
 * user metadata because email confirmation means there is no session — and so
 * nothing the client can write to `profiles` — until the code has been
 * verified. `handle_new_user()` reads these off the auth row and builds the
 * profile from them.
 */
export interface SignUpDetails {
  displayName?: string;
  firstName?: string;
  surname?: string;
  username?: string;
  location?: string;
}

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
      if (error || !data.user) {
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

  const signUp = async (email: string, password: string, opts?: SignUpDetails) => {
    const metadata: Record<string, string> = {};
    if (opts?.displayName) metadata.display_name = opts.displayName;
    if (opts?.firstName) metadata.first_name = opts.firstName;
    if (opts?.surname) metadata.surname = opts.surname;
    if (opts?.username) metadata.username = opts.username;
    if (opts?.location) metadata.location = opts.location;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: Object.keys(metadata).length ? metadata : undefined,
      },
    });
    // With email confirmation on, Supabase creates the user but withholds the
    // session until the emailed code is redeemed. No session therefore means
    // "we've sent them a code", not "something went wrong".
    return {
      error: error as Error | null,
      needsVerification: !error && !data.session,
    };
  };

  const signOut = async () => {
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
