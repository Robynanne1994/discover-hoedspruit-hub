type EventTags = {
  tag?: string | null;
  sub_tag_1?: string | null;
  sub_tag_2?: string | null;
};

function eventTagKey(tag: string): string {
  return tag.trim().replace(/\s+/g, " ").toLowerCase();
}

export function collectEventTags(event: EventTags): string[] {
  const tags = new Map<string, string>();
  for (const raw of [event.tag, event.sub_tag_1, event.sub_tag_2]) {
    const label = raw?.trim().replace(/\s+/g, " ");
    if (label && !tags.has(eventTagKey(label))) tags.set(eventTagKey(label), label);
  }
  return [...tags.values()];
}

export function availableEventTags(events: EventTags[]): string[] {
  const tags = new Map<string, string>();
  for (const event of events) {
    for (const label of collectEventTags(event)) {
      if (!tags.has(eventTagKey(label))) tags.set(eventTagKey(label), label);
    }
  }
  return [...tags.values()].sort((a, b) => a.localeCompare(b));
}

export function eventMatchesTag(event: EventTags, category: string): boolean {
  return collectEventTags(event).some((tag) => eventTagKey(tag) === eventTagKey(category));
}

export function countEventTags(events: EventTags[], categories: string[]): Map<string, number> {
  return new Map(categories.map((category) => [
    category,
    events.filter((event) => eventMatchesTag(event, category)).length,
  ]));
}

export function eventMatchesSearch(event: EventTags & { title: string; location?: string | null }, query: string): boolean {
  const q = query.trim().toLowerCase();
  return [event.title, event.location, ...collectEventTags(event)]
    .some((value) => value?.toLowerCase().includes(q));
}