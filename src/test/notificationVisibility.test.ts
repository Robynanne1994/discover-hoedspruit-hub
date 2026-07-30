import { describe, it, expect } from "vitest";
import {
  isNotificationHidden,
  notificationActorId,
  visibleNotifications,
} from "@/lib/notificationVisibility";

const ACTOR = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

const blocks = (iBlocked: string[], blockedMe: string[]) => ({
  iBlocked: new Set(iBlocked),
  blockedMe: new Set(blockedMe),
});

describe("notificationActorId", () => {
  it("uses actor_id when the row has one", () => {
    expect(notificationActorId({ kind: "new_follower", actor_id: ACTOR, link: null })).toBe(ACTOR);
  });

  it("falls back to the profile link for rows written before actor_id existed", () => {
    expect(
      notificationActorId({ kind: "new_follower", actor_id: null, link: `/profile/${ACTOR}` }),
    ).toBe(ACTOR);
  });

  it("returns nothing for a notification that is not about a person", () => {
    expect(notificationActorId({ kind: "event_reminder", actor_id: null, link: "/events/123" })).toBeNull();
    expect(notificationActorId({ kind: "follow_request", actor_id: null, link: "/follow-requests" })).toBeNull();
  });
});

describe("isNotificationHidden", () => {
  it("hides a notification about someone who blocked me", () => {
    expect(
      isNotificationHidden({ kind: "new_follower", actor_id: ACTOR, link: null }, blocks([], [ACTOR])),
    ).toBe(true);
  });

  it("hides a notification about someone I blocked", () => {
    expect(
      isNotificationHidden({ kind: "new_follower", actor_id: ACTOR, link: null }, blocks([ACTOR], [])),
    ).toBe(true);
  });

  it("hides a legacy row that only carries the person in its link", () => {
    expect(
      isNotificationHidden(
        { kind: "follow_request_accepted", actor_id: null, link: `/profile/${ACTOR}` },
        blocks([], [ACTOR]),
      ),
    ).toBe(true);
  });

  it("leaves everyone else alone", () => {
    expect(
      isNotificationHidden({ kind: "new_follower", actor_id: OTHER, link: null }, blocks([ACTOR], [ACTOR])),
    ).toBe(false);
  });

  it("never hides content notifications, which have no person behind them", () => {
    expect(
      isNotificationHidden({ kind: "event_reminder", actor_id: null, link: "/events/123" }, blocks([ACTOR], [])),
    ).toBe(false);
  });

  it("shows everything while the block sets are still loading", () => {
    expect(isNotificationHidden({ kind: "new_follower", actor_id: ACTOR, link: null }, undefined)).toBe(false);
  });
});

describe("visibleNotifications", () => {
  it("drops the blocked pair's cards and keeps the order of the rest", () => {
    const list = [
      { id: "a", kind: "new_follower", actor_id: ACTOR, link: null },
      { id: "b", kind: "event_reminder", actor_id: null, link: "/events/1" },
      { id: "c", kind: "follow_accepted", actor_id: OTHER, link: null },
    ];
    expect(visibleNotifications(list, blocks([], [ACTOR])).map((n) => n.id)).toEqual(["b", "c"]);
  });
});
