import { describe, it, expect } from "vitest";
import { parseHostCells, serializeHostCells, hostsToColumns } from "./eventHostsCsv";

const resolve = (t: string) => (t === "Local Shopping Centre" ? "L1" : null);

describe("event host sheet cells", () => {
  it("pairs names, subtitles and links by position; links vs listing titles", () => {
    const h = parseHostCells("A|B|C", "Local Shopping Centre|Author|-", "https://sowc.alueducation.com/dr-michael-musgrave/|-|Local Shopping Centre", resolve);
    expect(h).toEqual([
      { name: "A", subtitle: "Local Shopping Centre", link: "https://sowc.alueducation.com/dr-michael-musgrave/", listingId: null },
      { name: "B", subtitle: "Author", link: null, listingId: null },
      { name: "C", subtitle: null, link: null, listingId: "L1" },
    ]);
  });
  it("writes '-' for missing subtitles and links", () => {
    expect(serializeHostCells([{ name: "A", link: "https://x.co" }, { name: "B", subtitle: "Author" }, { name: "C", listingTitle: "Local Shopping Centre" }])).toEqual({
      hosted_by_name: "A|B|C", hosted_by_subtitle: "-|Author|-", hosted_by_link: "https://x.co|-|Local Shopping Centre",
    });
  });
  it("stores hosts beyond three in extra_hosts", () => {
    const cols = hostsToColumns(parseHostCells("A|B|C|D", "", "", resolve));
    expect(cols.hosted_by_name_3).toBe("C");
    expect(cols.extra_hosts).toEqual([{ name: "D", subtitle: null, link: null, listing_id: null }]);
  });
});
