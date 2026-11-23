import { describe, expect, it } from "vitest";
import {
  NEW_LISTING_PUSH_BODY,
  NEW_EVENT_PUSH_BODY,
  NEW_EVENTS_PUSH_BODY,
  NEW_SPECIAL_PUSH_BODY,
  NEW_SPECIALS_PUSH_BODY,
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
      kind: "special_update",
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

describe("new-special phone notification content", () => {
  it("one special", () => {
    expect(pushNotificationContent({ kind: "special_new", title: "New special: Friday Pizza Special" })).toEqual({
      title: "New Special Added", subtitle: "Friday Pizza Special", body: NEW_SPECIAL_PUSH_BODY,
    });
  });
  it("grouped specials", () => {
    expect(pushNotificationContent({ kind: "special_new", title: "New specials: Friday Pizza Special & 3 others" })).toEqual({
      title: "New Specials Added", subtitle: "Friday Pizza Special & 3 Others", body: NEW_SPECIALS_PUSH_BODY,
    });
  });
});

describe("saved event reminder phone content", () => {
  it("3 days", () => {
    expect(pushNotificationContent({ kind: "event_reminder_3d", title: "x", itemTitle: "Hoedspruit Farmers Market" })).toEqual({
      title: "Saved Event Reminder", subtitle: "Hoedspruit Farmers Market",
      body: "This event is coming up in 3 days! Tap to revisit the details and plan ahead.",
    });
  });
  it("7 days", () => {
    expect(pushNotificationContent({ kind: "event_reminder_7d", itemTitle: "A" }).body)
      .toBe("This event is coming up in 7 days! Tap to revisit the details and plan ahead.");
  });
  it("1 day says tomorrow", () => {
    expect(pushNotificationContent({ kind: "event_reminder_1d", itemTitle: "A" }).body)
      .toBe("This event is coming up tomorrow! Tap to revisit the details and plan ahead.");
  });
});

describe("saved special reminder phone content", () => {
  it("3 days", () => {
    expect(pushNotificationContent({ kind: "special_reminder_3d", title: "x", itemTitle: "Wild Blue Lodge – Escape the Everyday" })).toEqual({
      title: "Your Saved Special Ends Soon!", subtitle: "Wild Blue Lodge – Escape the Everyday",
      body: "This special ends in 3 days! Tap to revisit the details before it's too late.",
    });
  });
  it("7 days", () => {
    expect(pushNotificationContent({ kind: "special_reminder_7d", itemTitle: "A" }).body)
      .toBe("This special ends in 7 days! Tap to revisit the details before it's too late.");
  });
  it("1 day says tomorrow", () => {
    expect(pushNotificationContent({ kind: "special_reminder_1d", itemTitle: "A" }).body)
      .toBe("This special ends tomorrow! Tap to revisit the details before it's too late.");
  });
});
