/**
 * Hotel search the way travelers type: words in any order, accents ignored,
 * each word a prefix of some word in name / type / area / city / country,
 * one typo tolerated on words of five letters or more.
 */
export interface Searchable { name: string; type: string; area: string; city: string; country: string }

export const norm = (s: string): string =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

export const tokens = (q: string): string[] => norm(q).split(' ').filter(Boolean);

export const words = (h: Searchable): string[] => norm([h.name, h.type, h.area, h.city, h.country].join(' ')).split(' ');

export function levenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 9;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

const hit = (ws: string[], t: string, strict: boolean) => ws.some((w) => w.startsWith(t) || (!strict && t.length >= 5 && levenshtein(t, w) <= 1));

/** strict = prefix matches only (used to decide whether one result is unambiguous enough to open directly). */
export function matches(h: Searchable, q: string, strict = false): boolean {
  const t = tokens(q);
  if (!t.length) return true;
  const ws = words(h);
  return t.every((x) => hit(ws, x, strict));
}

/** Hotels sharing at least one word of 3+ letters with the query; the "did you mean" list when nothing matches. */
export function near(h: Searchable, q: string): boolean {
  const t = tokens(q).filter((x) => x.length >= 3);
  return t.length > 0 && t.some((x) => hit(words(h), x, false));
}

export function isCityQuery(hotels: Searchable[], q: string): boolean {
  const n = norm(q);
  return n.length > 0 && hotels.some((h) => norm(h.city) === n);
}
