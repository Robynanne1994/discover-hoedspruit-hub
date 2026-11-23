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
}): PushNotificationContent {
  const originalTitle = notification.title || "Hello Hoedspruit";
  if (notification.kind === "event_new") {
    const m = originalTitle.match(/^New (event|events):\s*(.+)$/i);
    const plural = m?.[1].toLowerCase() === "events";
    return {
      title: plural ? "New Events Added" : "New Event Added",
      ...(m ? { subtitle: capitaliseOthers(m[2]) } : {}),
      body: plural ? NEW_EVENTS_PUSH_BODY : NEW_EVENT_PUSH_BODY,
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
