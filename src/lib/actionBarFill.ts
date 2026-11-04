// The listing action bar reads best as three tiles. A place with nowhere to
// travel to — "Hoedspruit & Surrounds" is an area, not an address, so it gets
// no directions — can fall to just two, so the next populated contact fills the
// gap. The bar's own contents decide what is still missing: whatever tile is
// already there is never repeated, and a contact whose link is already shown
// under another name (a Facebook page sitting in the website slot, say) is the
// same tile twice, so it is skipped too.

export const ACTION_BAR_TARGET = 3;

type BarTile = { key: string; href?: string };

// Appends the first candidates the bar still needs, in the order given.
// A bar already at or above the target is returned untouched.
export const fillActionBar = <T extends BarTile>(
  actions: T[],
  candidates: (T | null | undefined | false)[],
  target: number = ACTION_BAR_TARGET,
): T[] => {
  const out = [...actions];
  if (out.length >= target) return out;
  for (const candidate of candidates) {
    if (out.length >= target) break;
    if (!candidate) continue;
    const repeats = out.some(
      (a) => a.key === candidate.key || (!!candidate.href && a.href === candidate.href),
    );
    if (repeats) continue;
    out.push(candidate);
  }
  return out;
};
