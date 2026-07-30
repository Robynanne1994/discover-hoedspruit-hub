/**
 * Blocking somebody, unblocking them and blocking them again in quick
 * succession is a form of harassment, so a block can only be re-applied once a
 * cooldown has run out. The database owns the rule (see the
 * 20260730120000_block_cooldown migration); everything here is copy and
 * formatting for the screens that explain it.
 */

/**
 * Mirrors public.block_cooldown_days(). Only used for wording like "7 days" —
 * whether a block is actually allowed is always decided by the database.
 */
export const BLOCK_COOLDOWN_DAYS = 7;

export type BlockCooldown = {
  /** When the blocker last lifted their block on this person. */
  unblockedAt: string;
  /** When they may block this person again. */
  availableAt: string;
  /** True while `availableAt` is still in the future. */
  isActive: boolean;
};

/** "6 August 2026" */
export const formatCooldownDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * How much of the cooldown is left, phrased for a sentence: "in 3 days",
 * "in 5 hours", "shortly". Rounds up so it never reads as though the wait is
 * already over while the block is still refused.
 */
export const formatCooldownRemaining = (iso: string, now: Date = new Date()) => {
  const ms = new Date(iso).getTime() - now.getTime();
  if (Number.isNaN(ms) || ms <= 0) return "shortly";

  const hours = Math.ceil(ms / (1000 * 60 * 60));
  if (hours <= 1) return "in under an hour";
  if (hours < 24) return `in ${hours} hours`;

  const days = Math.ceil(hours / 24);
  return days === 1 ? "in 1 day" : `in ${days} days`;
};

/**
 * Did this insert fail because the cooldown is still running? The trigger raises
 * with a BLOCK_COOLDOWN_ACTIVE marker so it can be told apart from a genuine
 * failure and answered with an explanation rather than "please try again".
 */
export const isBlockCooldownError = (error: unknown) => {
  if (!error) return false;
  const parts = [
    (error as { message?: unknown }).message,
    (error as { details?: unknown }).details,
    (error as { hint?: unknown }).hint,
  ].filter((p): p is string => typeof p === "string");
  return parts.some((p) => p.includes("BLOCK_COOLDOWN_ACTIVE"));
};

/** The warning shown before someone unblocks — this is where a cooldown starts. */
export const unblockCooldownWarning = (name: string) =>
  `If you unblock ${name}, you won't be able to block them again for ${BLOCK_COOLDOWN_DAYS} days.`;

/** The reminder on the toast after an unblock goes through. */
export const unblockedCooldownToast = () =>
  `You won't be able to block them again for ${BLOCK_COOLDOWN_DAYS} days.`;

/** The same rule, mentioned up front while they are still deciding to block. */
export const blockCooldownNotice = () =>
  `Blocking isn't a switch you can flip back and forth. Once you unblock someone, there's a ${BLOCK_COOLDOWN_DAYS}-day wait before you can block them again.`;

/** Shown when a block is refused because the cooldown is still running. */
export const blockCooldownBlockedMessage = (name: string, cooldown: BlockCooldown) =>
  `You unblocked ${name} on ${formatCooldownDate(cooldown.unblockedAt)}. So that blocking isn't used to bother people, there's a ${BLOCK_COOLDOWN_DAYS}-day wait afterwards. You'll be able to block them again ${formatCooldownRemaining(cooldown.availableAt)}, from ${formatCooldownDate(cooldown.availableAt)}.`;
