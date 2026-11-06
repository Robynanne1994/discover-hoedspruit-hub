export type ChannelBusiness = { id: string; title: string; title_override?: string | null };

export function resolveChannelBusiness(title: string, listings: ChannelBusiness[]): string | null {
  const name = title.trim();
  if (!name) return null;
  const matches = listings.filter((listing) => listing.title === name);
  if (matches.length === 0) throw new Error(`Associated business "${name}" does not exactly match a listing title`);
  if (matches.length > 1) throw new Error(`Associated business "${name}" matches more than one listing; select it in the editor instead`);
  return matches[0].id;
}

export function channelBusinessToCsv(id: string | null, listings: ChannelBusiness[]): string {
  return listings.find((listing) => listing.id === id)?.title ?? "";
}