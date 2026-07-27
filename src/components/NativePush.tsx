import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { initNativePush } from "@/lib/nativePush";

// Renders nothing. On a native (Capacitor) build it registers the device for
// push once a user is signed in and routes notification taps to the right
// screen. On the web build initNativePush() is a no-op.
export default function NativePush() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    void initNativePush((path) => navigate(path));
  }, [user, navigate]);

  return null;
}
