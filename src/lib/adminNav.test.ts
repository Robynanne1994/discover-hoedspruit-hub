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

  it("nests Active Specials and Past Specials under Specials", () => {
    const specials = groupByLabel("Specials");
    expect(specials?.children.map((child) => child.label)).toEqual([
      "Active Specials",
      "Past Specials",
    ]);
    expect(specials?.children.map((child) => child.path)).toEqual([
      "/admin/specials/active",
      "/admin/specials/past",
    ]);
  });

  it("nests Homepage, Search Suggestions, App Store and FAQs under App Content", () => {
    const appContent = groupByLabel("App Content");
    expect(appContent?.children.map((child) => child.label)).toEqual([
      "Homepage",
      "Search Suggestions",
      "App Store",
      "FAQs",
    ]);
    expect(appContent?.children.map((child) => child.path)).toEqual([
      "/admin/homepage",
      "/admin/search-suggested",
      "/admin/app-store",
      "/admin/faqs",
    ]);
  });

  it("nests Notifications and App Updates under Updates & Notifications", () => {
    const updates = groupByLabel("Updates & Notifications");
    expect(updates?.children.map((child) => child.label)).toEqual([
      "Notifications",
      "App Updates",
    ]);
    expect(updates?.children.map((child) => child.path)).toEqual([
      "/admin/notifications",
      "/admin/app-updates",
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

  it("never shows grouped destinations as top-level rows", () => {
    const topLevel = adminNavEntries
      .filter((entry) => !isNavGroup(entry))
      .map((entry) => entry.label);
    expect(topLevel).not.toContain("Event Hosts");
    expect(topLevel).not.toContain("Events");
    expect(topLevel).not.toContain("Specials");
    expect(topLevel).not.toContain("App Store");
    expect(topLevel).not.toContain("FAQs");
    expect(topLevel).not.toContain("Homepage");
    expect(topLevel).not.toContain("Search Suggestions");
    expect(topLevel).not.toContain("Notifications");
    expect(topLevel).not.toContain("App Updates");
  });

  it("resolves nested URLs to their section titles", () => {
    expect(
      allAdminNavItems.find((item) => item.path === "/admin/events")?.label,
    ).toBe("Events");
    expect(
      allAdminNavItems.find((item) => item.path === "/admin/events/past")?.label,
    ).toBe("Past Events");
    expect(
      allAdminNavItems.find((item) => item.path === "/admin/specials")?.label,
    ).toBe("Specials");
    expect(
      allAdminNavItems.find((item) => item.path === "/admin/specials/past")?.label,
    ).toBe("Past Specials");
    expect(
      allAdminNavItems.find((item) => item.path === "/admin/faqs")?.label,
    ).toBe("FAQs");
    expect(
      allAdminNavItems.find((item) => item.path === "/admin/homepage")?.label,
    ).toBe("Homepage");
    expect(
      allAdminNavItems.find((item) => item.path === "/admin/app-updates")?.label,
    ).toBe("App Updates");
  });
});
