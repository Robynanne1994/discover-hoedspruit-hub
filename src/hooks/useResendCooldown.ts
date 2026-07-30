import { useCallback, useEffect, useState } from "react";
import { RESEND_COOLDOWN_SECONDS } from "@/lib/passwordReset";

/**
 * Counts down the enforced gap between two password reset emails, so a resend
 * button can disable itself and say how long is left instead of letting the
 * request fail with a rate-limit error.
 */
export function useResendCooldown(seconds: number = RESEND_COOLDOWN_SECONDS) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = window.setTimeout(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [remaining]);

  const start = useCallback(() => setRemaining(seconds), [seconds]);

  return { remaining, waiting: remaining > 0, start };
}
