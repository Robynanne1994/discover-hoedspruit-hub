export interface PushNotificationContent {
  title: string;
  subtitle?: string;
  body: string;
}

export const NEW_LISTING_PUSH_BODY =
  "Now listed on Hello Hoedspruit! Tap to explore latest businesses added to the app.";

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

  const subject = match[2].replace(
    / & (\d+) others?$/i,
    (_, count: string) => ` & ${count} ${count === "1" ? "Other" : "Others"}`,
  );

  return {
    title: match[1].toLowerCase() === "listings" ? "New Business Listings" : "New Business Listing",
    subtitle: subject,
    body: NEW_LISTING_PUSH_BODY,
  };
}
