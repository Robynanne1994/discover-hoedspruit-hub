// Concurrent image-URL reachability checker.
// Uses `fetch` with no-cors to test reachability; cross-origin servers won't
// allow reading the status, so we treat a thrown error / timeout as broken
// and a successful (opaque) response as reachable.

export type ImageStatus = "ok" | "broken" | "missing";

export async function checkImage(url: string | null | undefined, timeoutMs = 6000): Promise<ImageStatus> {
  if (!url || !url.trim()) return "missing";
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Try HEAD first; some hosts disallow it, fall back to GET
    const res = await fetch(url, { method: "GET", mode: "no-cors", signal: controller.signal });
    clearTimeout(t);
    // For no-cors we typically get an opaque response (status 0). If we got
    // a real status we can use it; otherwise assume reachable.
    if (res.type === "opaque") return "ok";
    if (res.ok) return "ok";
    return "broken";
  } catch {
    clearTimeout(t);
    return "broken";
  }
}

export async function checkImagesConcurrent<T>(
  items: T[],
  getUrl: (item: T) => string | null | undefined,
  onProgress: (done: number, total: number) => void,
  concurrency = 8,
): Promise<Map<T, ImageStatus>> {
  const results = new Map<T, ImageStatus>();
  let index = 0;
  let done = 0;
  const total = items.length;
  onProgress(0, total);
  const workers = Array.from({ length: Math.min(concurrency, total) }, async () => {
    while (index < total) {
      const i = index++;
      const item = items[i];
      const status = await checkImage(getUrl(item));
      results.set(item, status);
      done++;
      onProgress(done, total);
    }
  });
  await Promise.all(workers);
  return results;
}
