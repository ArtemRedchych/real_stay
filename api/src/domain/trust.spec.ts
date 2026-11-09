import { byStayDesc, distanceMetres, isStale, latestStay, locationResult, monthsBetween, trustLabel } from './trust';
import { matches, near } from './search';

const today = new Date('2026-11-09T12:00:00Z');

describe('trust label', () => {
  it('is "location" only for a near check', () => {
    expect(trustLabel('near')).toBe('location');
    expect(trustLabel('far')).toBe('community');
    expect(trustLabel('not_run')).toBe('community');
  });
});

describe('staleness', () => {
  it('counts whole months', () => {
    expect(monthsBetween('2026-10', today)).toBe(1);
    expect(monthsBetween('2025-11', today)).toBe(12);
    expect(monthsBetween('2025-10', today)).toBe(13);
  });
  it('is stale strictly after 12 months', () => {
    expect(isStale('2025-11', today)).toBe(false);
    expect(isStale('2025-10', today)).toBe(true);
    expect(isStale('2026-10', today)).toBe(false);
  });
});

describe('ordering', () => {
  const u = (stayMonth: string, iso: string) => ({ stayMonth, createdAt: new Date(iso) });
  it('sorts by stay month, then upload time', () => {
    const list = [u('2026-09', '2026-10-21'), u('2026-10', '2026-11-02'), u('2026-10', '2026-11-05'), u('2025-06', '2025-07-12')];
    expect(list.sort(byStayDesc).map((x) => x.createdAt.toISOString().slice(0, 10))).toEqual(['2026-11-05', '2026-11-02', '2026-10-21', '2025-07-12']);
    expect(latestStay(list)).toBe('2026-10');
    expect(latestStay([])).toBeNull();
  });
});

describe('location check', () => {
  it('keeps only near/far', () => {
    // Hotel Marlow (seed) vs a point ~300 m away vs Porto
    const d1 = distanceMetres(38.7118, -9.1302, 38.7145, -9.1302);
    const d2 = distanceMetres(38.7118, -9.1302, 41.1408, -8.6111);
    expect(Math.round(d1)).toBeGreaterThan(250);
    expect(Math.round(d1)).toBeLessThan(350);
    expect(locationResult(d1, 500)).toBe('near');
    expect(locationResult(d2, 500)).toBe('far');
    expect(locationResult(500, 500)).toBe('near');
  });
});

describe('search', () => {
  const marlow = { name: 'Hotel Marlow', type: 'Hotel', area: 'Alfama', city: 'Lisbon', country: 'Portugal' };
  const res = { name: 'Marlow Residences', type: 'Aparthotel', area: 'Parque das Nações', city: 'Lisbon', country: 'Portugal' };
  const house = { name: 'The Marlow House', type: 'Guesthouse', area: 'Ribeira', city: 'Porto', country: 'Portugal' };
  const all = [marlow, res, house];
  it('matches booking-style strings in any order', () => {
    expect(all.filter((h) => matches(h, 'Hotel Marlow Lisbon')).map((h) => h.name)).toEqual(['Hotel Marlow']);
    expect(all.filter((h) => matches(h, 'marlow hotel')).map((h) => h.name)).toEqual(['Hotel Marlow']);
    expect(all.filter((h) => matches(h, 'parque das nacoes')).map((h) => h.name)).toEqual(['Marlow Residences']);
  });
  it('tolerates one typo on longer words, but not in strict mode', () => {
    expect(all.filter((h) => matches(h, 'Marlowe')).length).toBe(3);
    expect(all.filter((h) => matches(h, 'Marlowe', true)).length).toBe(0);
  });
  it('finds neighbours for a miss', () => {
    expect(all.filter((h) => matches(h, 'Marlow Palace')).length).toBe(0);
    expect(all.filter((h) => near(h, 'Marlow Palace')).length).toBe(3);
    expect(all.filter((h) => near(h, 'Grand Budapest')).length).toBe(0);
  });
});
