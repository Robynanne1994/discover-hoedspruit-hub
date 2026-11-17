import { describe, expect, it } from "vitest";
import {
  adminNavEntries,
  adminNavGroups,
  allAdminNavItems,
  isNavGroup,
} from "./adminNav";

const groupByLabel = (label: string) =>
  adminNavGroups.find((group) => group.label === label);

describe("admin sidebar navigation", () => {
  it("nests Upcoming Events, Past Events and Event Hosts under Events", () => {
    const events = groupByLabel("Events");
    expect(events).toBeDefined();
    expect(events?.children.map((child) => child.label)).toEqual([
      "Upcoming Events",
      "Past Events",
      "Event Hosts",
    ]);
    expect(events?.children.map((child) => child.path)).toEqual([
      "/admin/events/upcoming",
      "/admin/events/past",
      "/admin/event-hosts",
    ]);
  });

  it("keeps Users as a group with App, Reported and Moderated users", () => {
    const users = groupByLabel("Users");
    expect(users?.children.map((child) => child.label)).toEqual([
      "App Users",
      "Reported Users",
      "Moderated Users",
    ]);
  });

  it("never shows Event Hosts as a top-level row", () => {
    const topLevel = adminNavEntries
      .filter((entry) => !isNavGroup(entry))
      .map((entry) => entry.label);
    expect(topLevel).not.toContain("Event Hosts");
    expect(topLevel).not.toContain("Events");
  });

  it("resolves nested event URLs to their section title", () => {
    expect(
      allAdminNavItems.find((item) => item.path === "/admin/events")?.label,
    ).toBe("Events");
    expect(
      allAdminNavItems.find((item) => item.path === "/admin/events/past")?.label,
    ).toBe("Past Events");
  });
});
