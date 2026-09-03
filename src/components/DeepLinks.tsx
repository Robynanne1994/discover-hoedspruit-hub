import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { initDeepLinks } from "@/lib/deepLinks";

// Renders nothing. On a native build it routes Universal Links / App Links
// (and the custom-scheme fallback) to the matching in-app screen, including
// password-reset and email-change links opened from an account email. No-op on
// the web.
export default function DeepLinks() {
  const navigate = useNavigate();

  useEffect(() => initDeepLinks((path) => navigate(path)), [navigate]);

  return null;
}
