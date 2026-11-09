/**
 * The product's trust and freshness rules as pure functions of stored facts.
 * Nothing here stores or computes a score: a label is derived every time it is read.
 */
import type { LocationCheck } from '../entities';

export type TrustLabel = 'community' | 'location';

/** "Location checked" only when the device was near the hotel at upload. Everything else is a plain community photo. */
export function trustLabel(check: LocationCheck): TrustLabel {
  return check === 'near' ? 'location' : 'community';
}

export const TRUST_TEXT: Record<TrustLabel, { label: string; why: string }> = {
  community: { label: 'Community photo', why: 'Uploaded by a guest. The stay has not been independently verified.' },
  location: { label: 'Location checked', why: 'The contributor’s device was near the hotel when they uploaded. This does not prove where the photo was taken.' },
};

/** Whole months between a YYYY-MM stay month and a date. October 2026 seen in November 2026 is 1. */
export function monthsBetween(stayMonth: string, today: Date): number {
  const [y, m] = stayMonth.split('-').map(Number);
  return (today.getUTCFullYear() - y) * 12 + (today.getUTCMonth() + 1 - m);
}

/** Stale = more than 12 whole months before today. Exactly 12 is not stale. */
export function isStale(stayMonth: string, today = new Date()): boolean {
  return monthsBetween(stayMonth, today) > 12;
}

/** Sort key for "most recent stay": stay month desc, then upload time desc. */
export function byStayDesc<T extends { stayMonth: string; createdAt: Date }>(a: T, b: T): number {
  if (a.stayMonth !== b.stayMonth) return a.stayMonth < b.stayMonth ? 1 : -1;
  return b.createdAt.getTime() - a.createdAt.getTime();
}

export function latestStay<T extends { stayMonth: string; createdAt: Date }>(list: T[]): string | null {
  if (!list.length) return null;
  return list.slice().sort(byStayDesc)[0].stayMonth;
}

/** Distance in metres between two WGS84 points (haversine). */
export function distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Only the result is kept. Coordinates never leave this function's caller. */
export function locationResult(distanceM: number, radiusM: number): LocationCheck {
  return distanceM <= radiusM ? 'near' : 'far';
}
