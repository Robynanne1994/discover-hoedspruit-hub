import { describe, expect, it } from 'vitest';
import { isUpcomingSpecial, isVisibleSpecial, specialToday } from './specialVisibility';

const today = '2026-10-27';
describe('specials visibility', () => {
  it('shows future-starting specials even when active is false', () => {
    const special = { is_active: false, valid_from: '2026-11-01', valid_until: '2026-11-30' };
    expect(isUpcomingSpecial(special, today)).toBe(true);
    expect(isVisibleSpecial(special, today)).toBe(true);
  });
  it('does not treat a future end date alone as upcoming', () => {
    expect(isVisibleSpecial({ is_active: false, valid_until: '2026-11-30' }, today)).toBe(false);
    expect(isUpcomingSpecial({ valid_from: today, valid_until: '2026-11-30' }, today)).toBe(false);
  });
  it('keeps active unexpired deals and excludes expired ones', () => {
    expect(isVisibleSpecial({ is_active: true, valid_until: today }, today)).toBe(true);
    expect(isVisibleSpecial({ is_active: true }, today)).toBe(true);
    expect(isVisibleSpecial({ is_active: true, valid_until: '2026-10-26' }, today)).toBe(false);
  });
  it('accepts an upcoming start without an end but rejects reversed dates', () => {
    expect(isUpcomingSpecial({ valid_from: '2026-11-01' }, today)).toBe(true);
    expect(isUpcomingSpecial({ valid_from: '2026-11-01', valid_until: '2026-10-30' }, today)).toBe(false);
  });
  it('uses the Johannesburg date at the midnight boundary', () => {
    expect(specialToday(new Date('2026-10-27T22:30:00Z'))).toBe('2026-10-28');
  });
});