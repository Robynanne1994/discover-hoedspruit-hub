// Lets a screen opt its mounted lifetime out of StatusBarCover's blanket
// cream overlay — for the handful of pages that intentionally run a photo
// edge-to-edge behind the status bar (the detail-page hero image) rather
// than padding content below it. StatusBarCover exists to paper over pages
// that get --safe-top padding wrong; it has no way to tell "wrong" apart
// from "deliberately none" on its own, so those pages say so explicitly.
//
// A counter, not a boolean: two suppressing screens can be mounted at once
// during a route transition, and the cover should only reappear once both
// have unmounted.
import { useEffect } from "react";

type Listener = () => void;

let count = 0;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function suppressStatusBarCover(): () => void {
  count += 1;
  notify();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    count -= 1;
    notify();
  };
}

export function subscribeStatusBarCoverSuppressed(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isStatusBarCoverSuppressed(): boolean {
  return count > 0;
}

/**
 * Call from a screen while it's showing an edge-to-edge hero image behind
 * the status bar. Pass `active` (usually the same boolean that decides
 * whether the hero is actually rendered — a listing/event/special with no
 * image falls back to a normal padded header, which still wants the cover).
 */
export function useSuppressStatusBarCover(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    return suppressStatusBarCover();
  }, [active]);
}
