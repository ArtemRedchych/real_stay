import { BadRequestException, Body, Controller, ForbiddenException, Get, Module, NotFoundException, Param, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { memoryStorage } from 'multer';
import sharp from 'sharp';
import exifr from 'exifr';
import { Account, Hotel, Photo, RoomType, Upload } from '../entities';
import { PhotoStorage } from '../storage/photo-storage';
import { AuthModule, AuthGuard, CurrentAccount } from '../auth/auth';
import { distanceMetres, locationResult } from '../domain/trust';
import { uploadView } from '../views';

export const MAX_PHOTOS = 3;
export const MAX_BYTES = 15 * 1024 * 1024;
const ACCEPTED = /^image\/(jpeg|png|heic|heif|webp)$/i;

interface UploadFields { hotelId?: string; newHotelName?: string; newHotelCity?: string; roomType?: string; stayMonth?: string; note?: string; displayName?: 'name' | 'anonymous' }

@Controller('uploads')
export class UploadsController {
  constructor(
    @InjectRepository(Hotel) private readonly hotels: Repository<Hotel>,
    @InjectRepository(RoomType) private readonly roomTypes: Repository<RoomType>,
    @InjectRepository(Upload) private readonly uploads: Repository<Upload>,
    @InjectRepository(Photo) private readonly photos: Repository<Photo>,
    private readonly storage: PhotoStorage,
  ) {}

  /** One submission: 1–3 photos of one stay. Validation errors name the file, so the contributor knows what to fix. */
  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('photos', 10, { storage: memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }))
  async create(@CurrentAccount() account: Account, @UploadedFiles() files: Express.Multer.File[] = [], @Body() body: UploadFields) {
    const problems: string[] = [];
    if (!files.length) problems.push('Add at least one photo.');
    if (files.length > MAX_PHOTOS) problems.push(`${files.length} photos were sent; the limit is ${MAX_PHOTOS} per submission.`);
    for (const f of files) {
      const okType = ACCEPTED.test(f.mimetype) || /\.(heic|heif)$/i.test(f.originalname);
      if (!okType) problems.push(`${f.originalname} isn’t a supported format. Use JPG, PNG or HEIC.`);
      if (f.size > MAX_BYTES) problems.push(`${f.originalname} is ${(f.size / 1048576).toFixed(0)} MB. The limit is 15 MB per photo.`);
    }
    const stay = String(body.stayMonth || '');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(stay)) problems.push('Tell us roughly when you stayed (month and year).');
    else if (stay > new Date().toISOString().slice(0, 7)) problems.push('The stay month can’t be in the future.');
    const note = (body.note || '').trim().slice(0, 140) || null;
    const displayName = body.displayName === 'anonymous' ? 'anonymous' : 'name';

    let hotel: Hotel | null = null;
    if (body.hotelId) hotel = await this.hotels.findOne({ where: { id: body.hotelId }, relations: { roomTypes: true } });
    if (!hotel && body.newHotelName && body.newHotelCity) {
      hotel = await this.hotels.save(this.hotels.create({ id: slug(`${body.newHotelName}-${body.newHotelCity}`), name: body.newHotelName.trim().slice(0, 80), type: 'Hotel', area: '', city: body.newHotelCity.trim().slice(0, 60), country: '', status: 'pending', roomTypes: [] }));
    }
    if (!hotel) problems.push('Choose the hotel (or add its name and city).');
    const roomType = (body.roomType || '').trim().slice(0, 60);
    if (!roomType) problems.push('Choose the room type, or pick “Not sure”.');
    else if (hotel && hotel.status === 'seeded' && roomType !== 'Not sure' && !(hotel.roomTypes || []).some((r) => r.name === roomType)) problems.push(`“${roomType}” isn’t a room type of ${hotel.name}.`);
    if (problems.length) throw new BadRequestException({ message: problems });

    const upload = await this.uploads.save(this.uploads.create({ hotel: hotel!, roomType, stayMonth: stay, account, displayName, note, locationCheck: 'not_run', status: 'pending' }));
    const saved: Photo[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = f.mimetype === 'image/png' ? 'png' : f.mimetype === 'image/webp' ? 'webp' : /heic|heif/i.test(f.mimetype + f.originalname) ? 'heic' : 'jpg';
      const originalKey = `uploads/${upload.id}/${i + 1}.${ext}`;
      const thumbKey = `uploads/${upload.id}/${i + 1}.thumb.jpg`;
      let width: number | null = null, height: number | null = null, thumb: Buffer | null = null;
      try {
        const img = sharp(f.buffer, { failOn: 'none' }).rotate();
        const meta = await img.metadata();
        width = meta.width ?? null; height = meta.height ?? null;
        thumb = await img.resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 78 }).toBuffer();
      } catch { /* HEIC without codec support: the original is served where the thumbnail would be */ }
      let capturedAt: Date | null = null;
      try { const ex = await exifr.parse(f.buffer, { pick: ['DateTimeOriginal'] }); if (ex?.DateTimeOriginal instanceof Date && !isNaN(ex.DateTimeOriginal.getTime())) capturedAt = ex.DateTimeOriginal; } catch { /* no EXIF */ }
      await this.storage.put(originalKey, f.buffer, f.mimetype);
      if (thumb) await this.storage.put(thumbKey, thumb, 'image/jpeg');
      saved.push(await this.photos.save(this.photos.create({ upload, position: i + 1, originalKey, thumbKey: thumb ? thumbKey : originalKey, mime: f.mimetype, bytes: String(f.size), width: width as any, height: height as any, capturedAt })));
    }
    upload.photos = saved;
    return { id: upload.id, status: upload.status, photoIds: saved.map((p) => p.id), trust: 'community' };
  }

  /**
   * Location check: the device position comes in once, the distance is computed, and only near / far is stored.
   * The coordinates are not persisted or logged.
   */
  @Post(':id/location-check')
  @UseGuards(AuthGuard)
  async locationCheck(@CurrentAccount() account: Account, @Param('id') id: string, @Body() body: { lat?: number; lng?: number }) {
    const u = await this.owned(id, account);
    const lat = Number(body?.lat), lng = Number(body?.lng);
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new BadRequestException('A device position is needed for the check.');
    if (u.hotel.lat == null || u.hotel.lng == null) return { result: 'not_run', reason: 'We don’t have a location for this hotel yet.' };
    const radius = Number(process.env.NEAR_RADIUS_M || 500);
    u.locationCheck = locationResult(distanceMetres(lat, lng, u.hotel.lat, u.hotel.lng), radius);
    await this.uploads.save(u);
    return { result: u.locationCheck };
  }

  /** The contributor's own view of a submission, including the moderation outcome. */
  @Get(':id')
  @UseGuards(AuthGuard)
  async mine(@CurrentAccount() account: Account, @Param('id') id: string) {
    const u = await this.owned(id, account);
    return uploadView(u, this.storage, 1);
  }

  private async owned(id: string, account: Account): Promise<Upload> {
    const u = await this.uploads.findOne({ where: { id }, relations: { hotel: true, account: true, photos: true } });
    if (!u) throw new NotFoundException('No such upload');
    if (u.account.id !== account.id) throw new ForbiddenException('Not your upload');
    return u;
  }
}

function slug(s: string): string { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) + '-' + Math.random().toString(36).slice(2, 6); }

@Module({ imports: [TypeOrmModule.forFeature([Hotel, RoomType, Upload, Photo]), AuthModule], controllers: [UploadsController] })
export class UploadsModule {}
