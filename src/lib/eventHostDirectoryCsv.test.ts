import { describe, expect, it } from "vitest";
import { exportHostCsv, planHostImport, type DirectoryHost } from "./eventHostDirectoryCsv";

const host: DirectoryHost = { id: "existing-id", name: 'Music, "Live"', subtitle: "First\nSecond", link: "https://example.com", image_url: "/photo.jpg" };
describe("Event Hosts CSV", () => {
  it("round-trips all host fields including commas, quotes and line breaks", () => {
    expect(planHostImport(exportHostCsv([host]), [host])).toEqual([{ id: host.id, row: 2, payload: { name: host.name, subtitle: host.subtitle, link: host.link, image_url: host.image_url } }]);
  });
  it("matches an exported ID before a renamed host name", () => {
    expect(planHostImport("id,name\nexisting-id,Renamed", [host])[0]).toEqual({ id: host.id, row: 2, payload: { name: "Renamed" } });
  });
  it("matches names case-insensitively and leaves omitted fields untouched", () => {
    expect(planHostImport('name\n"music, ""live"""', [host])[0]).toEqual({ id: host.id, row: 2, payload: { name: 'music, "live"' } });
  });
  it("creates a new host without deleting omitted hosts", () => {
    expect(planHostImport("name,subtitle\nNew Host,Performer", [host])).toEqual([{ id: undefined, row: 2, payload: { name: "New Host", subtitle: "Performer" } }]);
  });
  it("clears optional values only when their column is supplied empty", () => {
    expect(planHostImport("id,name,link\nexisting-id,New Name,", [host])[0].payload).toEqual({ name: "New Name", link: null });
  });
  it("rejects unknown IDs instead of creating duplicate hosts", () => {
    expect(() => planHostImport("id,name\nmissing,New Host", [host])).toThrow("host ID was not found");
  });
  it("rejects duplicate names before any writes", () => {
    expect(() => planHostImport("name\nNew Host\nnew host", [])).toThrow("duplicate host name");
  });
  it("requires a host name", () => {
    expect(() => planHostImport("id,name\nexisting-id,", [host])).toThrow("host name is required");
  });
  it("rejects malformed quotes and unexpected columns", () => {
    expect(() => planHostImport('name\n"unfinished', [])).toThrow("unfinished");
    expect(() => planHostImport("name,unknown\nHost,value", [])).toThrow("Unknown columns");
  });
});