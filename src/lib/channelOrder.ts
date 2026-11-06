type OrderedChannel = { is_featured?: boolean | null; sort_order: number };

export function compareChannels(a: OrderedChannel, b: OrderedChannel): number {
  return Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)) || a.sort_order - b.sort_order;
}

export function channelOrderUpdates<T extends OrderedChannel & { id: string }>(channels: T[]) {
  return channels.filter((channel) => !channel.is_featured).map((channel, index) => ({ id: channel.id, sort_order: index + 1 }));
}