/** Typed client for the RealStay API. Base URL comes from VITE_API_URL at build time. */
export const API = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000';

export interface RoomTypeView { name: string; photoCount: number; latestStay: string | null; stale: boolean }
export interface HotelView {
  id: string; name: string; type: string; area: string; city: string; country: string; status: string; listingPhotoUrl: string | null;
  photoCount: number; uploadCount: number; latestStay: string | null; latestUploadAt: string | null; coverThumbUrl: string | null; coverTrust: 'community' | 'location' | null; roomTypes: RoomTypeView[];
}
export interface SearchResult { q: string; mode: 'all' | 'city' | 'exact' | 'fuzzy' | 'none'; hotels: HotelView[]; near: HotelView[]; openDirectly: string | null }
export interface PhotoView { id: string; position: number; url: string; thumbUrl: string; width: number | null; height: number | null; capturedAt: string | null }
export interface UploadView {
  id: string; hotelId: string; roomType: string; stayMonth: string; stale: boolean; uploadedAt: string;
  trust: { kind: 'community' | 'location'; label: string; why: string }; contributor: { display: string; contributions: number };
  note: string | null; status: string; decisionReason: string | null; decisionMessage: string | null; photos: PhotoView[];
}
export interface Signal { kind: string; level: 'ok' | 'warn' | 'neutral'; text: string }
export interface QueueItem extends UploadView { hotelName: string; hotelPlace: string; hotelPending: boolean; contributorName: string; account: { ageDays: number; approved: number; rejected: number }; signals: Signal[] }
export interface Account { id: string; name: string; isModerator: boolean }

export class ApiError extends Error { constructor(public status: number, public messages: string[]) { super(messages.join(' ')); } }

async function call<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) {
    let msgs: string[] = [`Request failed (${res.status})`];
    try { const body = await res.json(); const m = body?.message; msgs = Array.isArray(m) ? m : m ? [String(m)] : msgs; } catch { /* keep default */ }
    throw new ApiError(res.status, msgs);
  }
  return res.json() as Promise<T>;
}
const json = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

export const api = {
  search: (q: string) => call<SearchResult>(`/hotels?q=${encodeURIComponent(q)}`),
  hotel: (id: string) => call<HotelView>(`/hotels/${encodeURIComponent(id)}`),
  uploads: (id: string, roomType: string, sort: string) => call<UploadView[]>(`/hotels/${encodeURIComponent(id)}/uploads?roomType=${encodeURIComponent(roomType)}&sort=${sort}`),
  locationPreview: (hotelId: string, lat: number, lng: number) => call<{ result: 'near' | 'far' | 'not_run' }>(`/hotels/${encodeURIComponent(hotelId)}/location-preview`, json({ lat, lng })),
  devSignIn: (name: string, moderator = false) => call<{ token: string; account: Account }>('/auth/dev', json({ name, moderator })),
  createUpload: (form: FormData, token: string) => call<{ id: string; status: string; photoIds: string[] }>('/uploads', { method: 'POST', body: form }, token),
  locationCheck: (id: string, lat: number, lng: number, token: string) => call<{ result: 'near' | 'far' | 'not_run'; reason?: string }>(`/uploads/${id}/location-check`, json({ lat, lng }), token),
  myUpload: (id: string, token: string) => call<UploadView>(`/uploads/${id}`, {}, token),
  queue: (token: string) => call<QueueItem[]>('/moderation/queue', {}, token),
  decide: (id: string, action: 'approve' | 'reject' | 'request-correction', body: { reason?: string; message?: string }, token: string) => call<{ id: string; status: string }>(`/moderation/${id}/${action}`, json(body), token),
};
