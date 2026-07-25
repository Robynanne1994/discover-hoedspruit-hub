import { useEffect, useState } from "react";
import {
  fetchNotificationOptions,
  NotificationOption,
  NotificationSource,
} from "@/lib/notificationCategories";

// Fetches the live options (real categories / event tags / special tags) for a
// notification filter. Results are cached per-source for the session so the
// preferences screens don't re-query on every mount.
const cache = new Map<NotificationSource, NotificationOption[]>();

export function useNotificationOptions(source: NotificationSource | null) {
  const [options, setOptions] = useState<NotificationOption[]>(
    source && cache.has(source) ? cache.get(source)! : [],
  );
  const [loading, setLoading] = useState(!(source && cache.has(source)));

  useEffect(() => {
    if (!source) return;
    if (cache.has(source)) {
      setOptions(cache.get(source)!);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchNotificationOptions(source).then((opts) => {
      cache.set(source, opts);
      if (active) {
        setOptions(opts);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [source]);

  return { options, loading };
}
