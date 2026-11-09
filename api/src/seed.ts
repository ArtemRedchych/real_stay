/**
 * Sample content: five fictional hotels, thirteen published photos in eleven uploads, three pending uploads
 * for the moderation queue. Photos are Unsplash images edited to resemble guest uploads (see README).
 * Idempotent: does nothing when hotels already exist, unless `reset` is true.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { Account, Hotel, Photo, RoomType, Upload } from './entities';
import { PhotoStorage, storageFromEnv } from './storage/photo-storage';

const HOTELS = [
  { id: 'marlow', name: 'Hotel Marlow', type: 'Hotel', area: 'Alfama', city: 'Lisbon', country: 'Portugal', lat: 38.7118, lng: -9.1302, cats: ['Standard Double', 'Superior King', 'Junior Suite', 'Family Room'] },
  { id: 'marlow-res', name: 'Marlow Residences', type: 'Aparthotel', area: 'Parque das Nações', city: 'Lisbon', country: 'Portugal', lat: 38.7686, lng: -9.0977, cats: ['Studio', 'One-Bedroom Apartment'] },
  { id: 'marlow-house', name: 'The Marlow House', type: 'Guesthouse', area: 'Ribeira', city: 'Porto', country: 'Portugal', lat: 41.1408, lng: -8.6111, cats: ['Double Room', 'Twin Room', 'Attic Suite'] },
  { id: 'palm-court', name: 'Palm Court Resort', type: 'Resort', area: 'Bophut Beach', city: 'Koh Samui', country: 'Thailand', lat: 9.5565, lng: 100.0254, cats: ['Garden Villa', 'Beachfront Villa', 'Family Villa'], listing: 'p08' },
  { id: 'kinsley', name: 'Kinsley Hotel', type: 'Hotel', area: 'New Town', city: 'Edinburgh', country: 'United Kingdom', lat: 55.956, lng: -3.2, cats: ['Classic Double', 'Twin Room', 'Family Room'] },
];

const ACCOUNTS: Record<string, { name: string; created: string; moderator?: boolean }> = {
  marta: { name: 'Marta Silva', created: '2025-09-01' }, jonas: { name: 'Jonas Weber', created: '2026-10-20' }, priya: { name: 'Priya Rao', created: '2026-06-02' },
  tom: { name: 'Tom Hale', created: '2025-01-15' }, nils: { name: 'Nils Fischer', created: '2024-11-01' }, daniel: { name: 'Daniel Okafor', created: '2025-03-10' },
  ewan: { name: 'Ewan MacLeod', created: '2026-10-27' }, guest1: { name: 'Guest One', created: '2026-08-01' }, guest2: { name: 'Guest Two', created: '2026-09-01' },
  chris: { name: 'Chris Dawson', created: 'today' }, moderator: { name: 'Sam Moderator', created: '2025-01-01', moderator: true },
};

type Up = { hotel: string; cat: string; stay: string; up: string; loc: 'not_run' | 'near' | 'far'; by: string; anon?: boolean; note?: string; photos: { img: string; taken?: string }[]; status?: 'pending' };
const UPLOADS: Up[] = [
  { hotel: 'marlow', cat: 'Superior King', stay: '2026-10', up: '2026-11-05', loc: 'near', by: 'marta', note: 'Room 412, taken from the door. Sofa is a bit worn but clean. Bathroom has a tub only, no shower screen.', photos: [{ img: 'p03', taken: '2026-10-14T09:12:00Z' }, { img: 'p13', taken: '2026-10-14T09:15:00Z' }] },
  { hotel: 'marlow', cat: 'Standard Double', stay: '2026-10', up: '2026-11-02', loc: 'not_run', by: 'guest1', anon: true, note: '5th floor, street side. The window doesn’t fully open.', photos: [{ img: 'p02' }] },
  { hotel: 'marlow', cat: 'Standard Double', stay: '2026-09', up: '2026-10-21', loc: 'not_run', by: 'jonas', photos: [{ img: 'p06', taken: '2026-09-28T18:40:00Z' }] },
  { hotel: 'marlow', cat: 'Standard Double', stay: '2026-09', up: '2026-09-14', loc: 'near', by: 'priya', note: 'Darker than the listing photos. All lamps are warm bulbs. Bathroom is small but renovated.', photos: [{ img: 'p04' }, { img: 'p12' }] },
  { hotel: 'marlow', cat: 'Superior King', stay: '2026-08', up: '2026-08-30', loc: 'not_run', by: 'guest2', anon: true, photos: [{ img: 'p09' }] },
  { hotel: 'marlow', cat: 'Junior Suite', stay: '2025-06', up: '2025-07-12', loc: 'not_run', by: 'tom', note: 'Living area of the suite.', photos: [{ img: 'p11', taken: '2025-06-30T11:00:00Z' }] },
  { hotel: 'marlow-res', cat: 'Studio', stay: '2026-09', up: '2026-10-02', loc: 'not_run', by: 'guest1', anon: true, note: 'Top floor studio. Kitchenette is behind the camera.', photos: [{ img: 'p10' }] },
  { hotel: 'marlow-res', cat: 'One-Bedroom Apartment', stay: '2026-05', up: '2026-05-20', loc: 'near', by: 'nils', photos: [{ img: 'p14', taken: '2026-05-08T16:20:00Z' }] },
  { hotel: 'palm-court', cat: 'Garden Villa', stay: '2026-10', up: '2026-11-01', loc: 'near', by: 'daniel', note: 'Evening, lights on. Matches the listing fairly well.', photos: [{ img: 'p01', taken: '2026-10-22T19:05:00Z' }] },
  { hotel: 'palm-court', cat: 'Beachfront Villa', stay: '2026-08', up: '2026-09-09', loc: 'not_run', by: 'guest2', anon: true, note: 'Morning light. The bed decoration was only there on arrival day.', photos: [{ img: 'p05' }] },
  { hotel: 'kinsley', cat: 'Twin Room', stay: '2026-10', up: '2026-10-28', loc: 'not_run', by: 'ewan', note: 'Ground floor twin. The ceiling light is harsh; bring the lamps closer.', photos: [{ img: 'p07' }] },
  // pending: one per moderation signal case
  { hotel: 'palm-court', cat: 'Family Villa', stay: '2026-08', up: 'today-5h', loc: 'not_run', by: 'guest2', anon: true, photos: [{ img: 'p05', taken: '2026-08-14T07:30:00Z' }], status: 'pending' },
  { hotel: 'kinsley', cat: 'Classic Double', stay: '2026-11', up: 'today-1d', loc: 'far', by: 'chris', photos: [{ img: 'p06', taken: '2024-02-02T12:00:00Z' }, { img: 'p04' }, { img: 'p13' }], status: 'pending' },
  { hotel: 'marlow-res', cat: 'Studio', stay: '2026-10', up: 'today-2d', loc: 'near', by: 'nils', note: 'Studio on the 3rd floor, afternoon.', photos: [{ img: 'p14' }], status: 'pending' },
];

function when(s: string): Date {
  const now = Date.now();
  if (s === 'today') return new Date(now);
  const m = s.match(/^today-(\d+)([hd])$/);
  if (m) return new Date(now - Number(m[1]) * (m[2] === 'h' ? 3600000 : 86400000));
  return new Date(`${s}T14:10:00Z`);
}

export async function seed(ds: DataSource, storage: PhotoStorage, reset: boolean): Promise<void> {
  const hotels = ds.getRepository(Hotel), roomTypes = ds.getRepository(RoomType), accounts = ds.getRepository(Account), uploads = ds.getRepository(Upload), photos = ds.getRepository(Photo);
  if (reset) await ds.synchronize(true);
  if ((await hotels.count()) > 0) { console.log('seed: hotels exist, skipping'); return; }
  const imgDir = join(__dirname, '..', 'seed', 'img');
  const putImg = async (name: string, key: string) => { const buf = await fs.readFile(join(imgDir, `${name}.jpg`)); await storage.put(key, buf, 'image/jpeg'); const m = await sharp(buf).metadata(); return { width: m.width || null, height: m.height || null, bytes: buf.length }; };

  for (const h of HOTELS) {
    let listingPhotoKey: string | null = null;
    if (h.listing) { listingPhotoKey = `listing/${h.id}.jpg`; await putImg(`t_${h.listing}`, listingPhotoKey); }
    const hotel = await hotels.save(hotels.create({ id: h.id, name: h.name, type: h.type, area: h.area, city: h.city, country: h.country, lat: h.lat, lng: h.lng, listingPhotoKey, status: 'seeded' }));
    await roomTypes.save(h.cats.map((name, i) => roomTypes.create({ hotel, name, position: i })));
  }
  const acc: Record<string, Account> = {};
  for (const [k, a] of Object.entries(ACCOUNTS)) acc[k] = await accounts.save(accounts.create({ provider: 'seed', subject: k, name: a.name, isModerator: !!a.moderator, createdAt: when(a.created) }));

  for (const u of UPLOADS) {
    const hotel = await hotels.findOneByOrFail({ id: u.hotel });
    const upload = await uploads.save(uploads.create({ hotel, roomType: u.cat, stayMonth: u.stay, account: acc[u.by], displayName: u.anon ? 'anonymous' : 'name', note: u.note || null, locationCheck: u.loc, status: u.status || 'published', createdAt: when(u.up) }));
    for (let i = 0; i < u.photos.length; i++) {
      const p = u.photos[i];
      const originalKey = `uploads/${upload.id}/${i + 1}.jpg`, thumbKey = `uploads/${upload.id}/${i + 1}.thumb.jpg`;
      const meta = await putImg(p.img, originalKey);
      await putImg(`t_${p.img}`, thumbKey);
      await photos.save(photos.create({ upload, position: i + 1, originalKey, thumbKey, mime: 'image/jpeg', bytes: String(meta.bytes), width: meta.width as any, height: meta.height as any, capturedAt: p.taken ? new Date(p.taken) : null }));
    }
  }
  console.log(`seed: ${HOTELS.length} hotels, ${UPLOADS.length} uploads`);
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { typeOrmOptions } = require('./app.module');
  const ds = new DataSource(typeOrmOptions());
  ds.initialize().then(async () => { await seed(ds, storageFromEnv(process.env), process.argv.includes('--reset')); await ds.destroy(); }).catch((e) => { console.error(e); process.exit(1); });
}
