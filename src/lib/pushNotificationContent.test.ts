import { describe, expect, it } from "vitest";
import {
  NEW_LISTING_PUSH_BODY,
  NEW_EVENT_PUSH_BODY,
  NEW_EVENTS_PUSH_BODY,
  pushNotificationContent,
} from "../../supabase/functions/send-push/notificationContent";

describe("new-listing phone notification content", () => {
  it("uses the business name as a bold subtitle for one new listing", () => {
    expect(pushNotificationContent({
      kind: "listing_new",
      title: "New listing: Lowveld Computers",
      body: "389 Huilboerboom Street",
    })).toEqual({
      title: "New Business Listing",
      subtitle: "Lowveld Computers",
      body: NEW_LISTING_PUSH_BODY,
    });
  });

  it("uses plural headings and capitalises Others for grouped listings", () => {
    expect(pushNotificationContent({
      kind: "listing_new",
      title: "New listings: Lowveld Computers & 3 others",
      body: "Tap to see them all.",
    })).toEqual({
      title: "New Business Listings",
      subtitle: "Lowveld Computers & 3 Others",
      body: NEW_LISTING_PUSH_BODY,
    });
  });

  it("uses the singular Other when one more listing joins the group", () => {
    expect(pushNotificationContent({
      kind: "listing_new",
      title: "New listings: Lowveld Computers & 1 other",
    }).subtitle).toBe("Lowveld Computers & 1 Other");
  });

  it("leaves every other notification type unchanged", () => {
    expect(pushNotificationContent({
      kind: "special_new",
      title: "Weekend Special",
      body: "Available this Saturday.",
    })).toEqual({ title: "Weekend Special", body: "Available this Saturday." });
  });
});

describe("new-event phone notification content", () => {
  it("one event", () => {
    expect(pushNotificationContent({ kind: "event_new", title: "New event: Hoedspruit Farmers Market" })).toEqual({
      title: "New Event Added", subtitle: "Hoedspruit Farmers Market", body: NEW_EVENT_PUSH_BODY,
    });
  });
  it("grouped events", () => {
    expect(pushNotificationContent({ kind: "event_new", title: "New events: Hoedspruit Farmers Market & 3 others" })).toEqual({
      title: "New Events Added", subtitle: "Hoedspruit Farmers Market & 3 Others", body: NEW_EVENTS_PUSH_BODY,
    });
  });
});
