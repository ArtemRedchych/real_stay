/**
 * The contributor's draft lives in memory for the session (files cannot go to localStorage) and
 * survives the hash navigation to sign-in and back. With a redirecting OAuth provider it would move to IndexedDB.
 */
import { useSyncExternalStore } from 'react';
import type { HotelView } from './api';

export interface DraftFile { id: number; file: File; url: string; name: string; size: number; error?: string }
export type LocState = 'idle' | 'checking' | 'near' | 'far' | 'declined' | 'unavailable';
export interface Draft {
  hotel: HotelView | null; newHotel: { name: string; city: string } | null; hotelQ: string;
  roomType: string | null; month: string; year: string; note: string; display: 'name' | 'anonymous';
  files: DraftFile[]; fileErrors: { name: string; msg: string }[];
  loc: LocState; coords: { lat: number; lng: number } | null; ctxOpen: boolean; attempted: boolean; submitError: string | null; submitting: boolean; welcomeBack: boolean;
}
export const MAX_PHOTOS = 3;
export const MAX_BYTES = 15 * 1024 * 1024;

export function freshDraft(): Draft {
  return { hotel: null, newHotel: null, hotelQ: '', roomType: null, month: '', year: '', note: '', display: 'name', files: [], fileErrors: [], loc: 'idle', coords: null, ctxOpen: false, attempted: false, submitError: null, submitting: false, welcomeBack: false };
}

let draft: Draft = freshDraft();
const listeners = new Set<() => void>();
let seq = 0;
export function getDraft() { return draft; }
export function setDraft(patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) {
  draft = { ...draft, ...(typeof patch === 'function' ? patch(draft) : patch) };
  listeners.forEach((l) => l());
}
export function resetDraft() { draft.files.forEach((f) => URL.revokeObjectURL(f.url)); draft = freshDraft(); listeners.forEach((l) => l()); }
export function useDraft(): Draft { return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => draft); }

export function addFiles(list: FileList | File[]) {
  const arr = Array.from(list);
  const room = MAX_PHOTOS - draft.files.length;
  const files = [...draft.files]; const fileErrors = [...draft.fileErrors];
  arr.forEach((f, i) => {
    const ok = /^image\/(jpeg|png|heic|heif|webp)$/i.test(f.type) || /\.(heic|heif)$/i.test(f.name);
    if (!ok) { fileErrors.push({ name: f.name, msg: 'isn’t a supported format. Use JPG, PNG or HEIC.' }); return; }
    if (f.size > MAX_BYTES) { fileErrors.push({ name: f.name, msg: `is ${(f.size / 1048576).toFixed(0)} MB. The limit is 15 MB per photo.` }); return; }
    if (i >= room) { fileErrors.push({ name: f.name, msg: `wasn’t added: the limit is ${MAX_PHOTOS} photos per submission.` }); return; }
    files.push({ id: ++seq, file: f, url: URL.createObjectURL(f), name: f.name, size: f.size });
  });
  setDraft({ files, fileErrors });
}

export function validate(d: Draft): Record<string, string> {
  const e: Record<string, string> = {};
  if (!d.hotel && !(d.newHotel && d.newHotel.name.trim() && d.newHotel.city.trim())) e.hotel = 'Choose the hotel (or add its name and city).';
  if (!d.roomType) e.cat = 'Choose the room type, or pick “Not sure”.';
  if (!d.files.length) e.files = 'Add at least one photo.';
  if (!d.month || !d.year) e.date = 'Tell us roughly when you stayed (month and year).';
  return e;
}

export function toFormData(d: Draft): FormData {
  const fd = new FormData();
  d.files.forEach((f) => fd.append('photos', f.file, f.name));
  if (d.hotel) fd.append('hotelId', d.hotel.id);
  else if (d.newHotel) { fd.append('newHotelName', d.newHotel.name.trim()); fd.append('newHotelCity', d.newHotel.city.trim()); }
  fd.append('roomType', d.roomType || '');
  fd.append('stayMonth', `${d.year}-${String(d.month).padStart(2, '0')}`);
  if (d.note.trim()) fd.append('note', d.note.trim());
  fd.append('displayName', d.display);
  return fd;
}
