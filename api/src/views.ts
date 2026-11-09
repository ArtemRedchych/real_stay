import { Hotel, Photo, Upload } from './entities';
import { PhotoStorage } from './storage/photo-storage';
import { byStayDesc, isStale, latestStay, TRUST_TEXT, trustLabel } from './domain/trust';

export interface PhotoView { id: string; position: number; url: string; thumbUrl: string; width: number | null; height: number | null; capturedAt: string | null }
export interface UploadView {
  id: string; hotelId: string; roomType: string; stayMonth: string; stale: boolean; uploadedAt: string;
  trust: { kind: 'community' | 'location'; label: string; why: string };
  contributor: { display: string; contributions: number };
  note: string | null; status: string; decisionReason: string | null; decisionMessage: string | null; photos: PhotoView[];
}
export interface RoomTypeView { name: string; photoCount: number; latestStay: string | null; stale: boolean }
export interface HotelView {
  id: string; name: string; type: string; area: string; city: string; country: string; status: string;
  listingPhotoUrl: string | null; photoCount: number; uploadCount: number; latestStay: string | null; latestUploadAt: string | null;
  coverThumbUrl: string | null; coverTrust: 'community' | 'location' | null; roomTypes: RoomTypeView[];
}

export async function photoView(p: Photo, storage: PhotoStorage): Promise<PhotoView> {
  return { id: p.id, position: p.position, url: await storage.url(p.originalKey), thumbUrl: await storage.url(p.thumbKey), width: p.width ?? null, height: p.height ?? null, capturedAt: p.capturedAt ? p.capturedAt.toISOString() : null };
}

export function displayName(u: Upload): string {
  if (u.displayName === 'anonymous') return 'Anonymous contributor';
  const parts = u.account.name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
}

export async function uploadView(u: Upload, storage: PhotoStorage, contributions: number, today = new Date()): Promise<UploadView> {
  const kind = trustLabel(u.locationCheck);
  const photos = await Promise.all(u.photos.slice().sort((a, b) => a.position - b.position).map((p) => photoView(p, storage)));
  return {
    id: u.id, hotelId: u.hotel.id, roomType: u.roomType, stayMonth: u.stayMonth, stale: isStale(u.stayMonth, today), uploadedAt: u.createdAt.toISOString(),
    trust: { kind, ...TRUST_TEXT[kind] }, contributor: { display: displayName(u), contributions },
    note: u.note, status: u.status, decisionReason: u.decisionReason, decisionMessage: u.decisionMessage, photos,
  };
}

/** Summary of a hotel from its published uploads only. */
export async function hotelView(h: Hotel, published: Upload[], storage: PhotoStorage, today = new Date()): Promise<HotelView> {
  const sorted = published.slice().sort(byStayDesc);
  const roomTypes: RoomTypeView[] = (h.roomTypes || []).slice().sort((a, b) => a.position - b.position).map((rt) => {
    const mine = sorted.filter((u) => u.roomType === rt.name);
    const ls = latestStay(mine);
    return { name: rt.name, photoCount: mine.reduce((n, u) => n + u.photos.length, 0), latestStay: ls, stale: ls ? isStale(ls, today) : false };
  });
  const cover = sorted[0]?.photos?.slice().sort((a, b) => a.position - b.position)[0];
  const newestUpload = published.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  return {
    id: h.id, name: h.name, type: h.type, area: h.area, city: h.city, country: h.country, status: h.status,
    listingPhotoUrl: h.listingPhotoKey ? await storage.url(h.listingPhotoKey) : null,
    photoCount: published.reduce((n, u) => n + u.photos.length, 0), uploadCount: published.length,
    latestStay: latestStay(sorted), latestUploadAt: newestUpload ? newestUpload.createdAt.toISOString() : null,
    coverThumbUrl: cover ? await storage.url(cover.thumbKey) : null, coverTrust: sorted[0] ? trustLabel(sorted[0].locationCheck) : null, roomTypes,
  };
}
