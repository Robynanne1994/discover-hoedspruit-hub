// Mock auth for previews: guest user, no network. Passthrough AuthProvider.
import { ReactNode } from "react";
export const AuthProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
export const useAuth = () => ({
  user: null,
  session: null,
  isAdmin: false,
  loading: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});
