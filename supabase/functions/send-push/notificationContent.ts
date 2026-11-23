export interface PushNotificationContent {
  title: string;
  subtitle?: string;
  body: string;
}

export const NEW_LISTING_PUSH_BODY =
  "Now listed on Hello Hoedspruit! Tap to explore latest businesses added to the app.";

export const NEW_EVENT_PUSH_BODY =
  "Just added to Hello Hoedspruit! Tap to find out more about this event.";
export const NEW_EVENTS_PUSH_BODY =
  "Just added to Hello Hoedspruit! Tap to explore more about new upcoming events in the area.";

export const NEW_SPECIAL_PUSH_BODY =
  "Just added to Hello Hoedspruit! Tap to check out this latest special and see what's on offer.";
export const NEW_SPECIALS_PUSH_BODY =
  "Just added to Hello Hoedspruit! Tap to explore the latest specials and offers on at the moment.";

export function eventReminderBody(days: number): string {
  const when = days === 1 ? "tomorrow" : `in ${days} days`;
  return `This event is coming up ${when}! Tap to revisit the details and plan ahead.`;
}

export function specialReminderBody(days: number): string {
  const when = days === 1 ? "tomorrow" : `in ${days} days`;
  return `This special ends ${when}! Tap to revisit the details before it's too late.`;
}

function capitaliseOthers(subject: string): string {
  return subject.replace(
    / & (\d+) others?$/i,
    (_, count: string) => ` & ${count} ${count === "1" ? "Other" : "Others"}`,
  );
}

/**
 * Phone-only presentation. The in-app notification keeps its existing wording,
 * while iOS can show the business name as a second bold line (alert.subtitle).
 */
export function pushNotificationContent(notification: {
  kind?: string | null;
  title?: string | null;
  body?: string | null;
  itemTitle?: string | null;
}): PushNotificationContent {
  const originalTitle = notification.title || "Hello Hoedspruit";
  const reminder = notification.kind?.match(/^event_reminder_(\d+)d$/);
  if (reminder) {
    return {
      title: "Saved Event Reminder",
      ...(notification.itemTitle ? { subtitle: notification.itemTitle } : {}),
      body: eventReminderBody(Number(reminder[1])),
    };
  }
  const specialReminder = notification.kind?.match(/^special_reminder_(\d+)d$/);
  if (specialReminder) {
    return {
      title: "Your Saved Special Ends Soon!",
      ...(notification.itemTitle ? { subtitle: notification.itemTitle } : {}),
      body: specialReminderBody(Number(specialReminder[1])),
    };
  }
  if (notification.kind === "new_follower") {
    const name = originalTitle.replace(/\s*started following you\.?$/i, "").trim();
    return { title: "New Follower", body: `${name || "Someone"} started following you.` };
  }
  if (notification.kind === "follow_request") {
    const name = originalTitle.replace(/\s*wants to follow you\.?$/i, "").trim();
    return { title: "Follow Request", body: `${name || "Someone"} requested to follow you.` };
  }
  if (notification.kind === "event_new") {
    const m = originalTitle.match(/^New (event|events):\s*(.+)$/i);
    const plural = m?.[1].toLowerCase() === "events";
    return {
      title: plural ? "New Events Added" : "New Event Added",
      ...(m ? { subtitle: capitaliseOthers(m[2]) } : {}),
      body: plural ? NEW_EVENTS_PUSH_BODY : NEW_EVENT_PUSH_BODY,
    };
  }
  if (notification.kind === "special_new") {
    const m = originalTitle.match(/^New (special|specials):\s*(.+)$/i);
    const plural = m?.[1].toLowerCase() === "specials";
    return {
      title: plural ? "New Specials Added" : "New Special Added",
      ...(m ? { subtitle: capitaliseOthers(m[2]) } : {}),
      body: plural ? NEW_SPECIALS_PUSH_BODY : NEW_SPECIAL_PUSH_BODY,
    };
  }
  if (notification.kind !== "listing_new") {
    return { title: originalTitle, body: notification.body || "" };
  }

  const match = originalTitle.match(/^New (listing|listings):\s*(.+)$/i);
  if (!match) {
    return {
      title: "New Business Listing",
      body: NEW_LISTING_PUSH_BODY,
    };
  }

  const subject = capitaliseOthers(match[2]);

  return {
    title: match[1].toLowerCase() === "listings" ? "New Business Listings" : "New Business Listing",
    subtitle: subject,
    body: NEW_LISTING_PUSH_BODY,
  };
}
