/**
 * Which notifications a blocked relationship must hide.
 *
 * Blocking someone deletes the notifications between the two people on the
 * server (see the 20260730170000_block_unblock_notification_hygiene migration),
 * so in normal use there is nothing left to filter. This is the fallback for
 * the rows that can still slip through: history written before that migration,
 * a card already sitting in a list when the block lands, or a device that has
 * been offline. A blocked person must never see the other's name or avatar, so
 * the client refuses to render the card rather than trusting the list it was
 * handed.
 */

/** '/profile/<uuid>' — how a person-to-person notification links to someone. */
const PROFILE_LINK = /^\/profile\/([0-9a-fA-F-]{36})$/;

export type VisibilityNotification = {
  kind: string;
  actor_id?: string | null;
  link?: string | null;
};

/**
 * The person a notification is about, if it is about a person at all.
 *
 * `actor_id` is authoritative. The link is the fallback for rows written before
 * that column existed — every resolved follow notification points at the
 * person's profile.
 */
export const notificationActorId = (n: VisibilityNotification): string | null => {
  if (n.actor_id) return n.actor_id;
  const m = n.link?.match(PROFILE_LINK);
  return m ? m[1] : null;
};

export type BlockSets = {
  /** People I have blocked. */
  iBlocked: Set<string>;
  /** People who have blocked me. */
  blockedMe: Set<string>;
};

/**
 * Hide the card when either side has blocked the other. Direction does not
 * matter: I do not want notifications about someone I blocked, and someone who
 * blocked me must not be visible to me at all.
 */
export const isNotificationHidden = (
  n: VisibilityNotification,
  blocks?: Partial<BlockSets>,
): boolean => {
  const actorId = notificationActorId(n);
  if (!actorId) return false;
  return !!blocks?.iBlocked?.has(actorId) || !!blocks?.blockedMe?.has(actorId);
};

/** The same rule applied to a list, keeping the original order. */
export const visibleNotifications = <T extends VisibilityNotification>(
  notifs: T[],
  blocks?: Partial<BlockSets>,
): T[] => notifs.filter((n) => !isNotificationHidden(n, blocks));
