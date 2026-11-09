import { BadRequestException, Body, Controller, Get, Module, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Hotel, Upload } from '../entities';
import { PhotoStorage } from '../storage/photo-storage';
import { hotelView, HotelView, uploadView, UploadView } from '../views';
import { isCityQuery, matches, near, norm } from '../domain/search';
import { byStayDesc, distanceMetres, locationResult } from '../domain/trust';

export type SearchMode = 'all' | 'city' | 'exact' | 'fuzzy' | 'none';
export interface SearchResult { q: string; mode: SearchMode; hotels: HotelView[]; near: HotelView[]; openDirectly: string | null }

@Controller('hotels')
export class HotelsController {
  constructor(@InjectRepository(Hotel) private readonly hotels: Repository<Hotel>, @InjectRepository(Upload) private readonly uploads: Repository<Upload>, private readonly storage: PhotoStorage) {}

  private async publishedByHotel(hotelIds?: string[]): Promise<Map<string, Upload[]>> {
    const where: any = { status: 'published' };
    if (hotelIds) where.hotel = { id: In(hotelIds) };
    const list = await this.uploads.find({ where, relations: { hotel: true, account: true, photos: true } });
    const map = new Map<string, Upload[]>();
    for (const u of list) { const arr = map.get(u.hotel.id) || []; arr.push(u); map.set(u.hotel.id, arr); }
    return map;
  }

  private async views(hotels: Hotel[], published: Map<string, Upload[]>): Promise<HotelView[]> {
    const views = await Promise.all(hotels.map((h) => hotelView(h, published.get(h.id) || [], this.storage)));
    return views.sort((a, b) => b.photoCount - a.photoCount);
  }

  /** Search. Word-based, any order, accents ignored, one typo tolerated on longer words. */
  @Get()
  async search(@Query('q') q = ''): Promise<SearchResult> {
    q = String(q).slice(0, 100);
    const all = await this.hotels.find({ where: { status: 'seeded' }, relations: { roomTypes: true } });
    const published = await this.publishedByHotel();
    if (!norm(q)) return { q, mode: 'all', hotels: await this.views(all, published), near: [], openDirectly: null };
    const strict = all.filter((h) => matches(h, q, true));
    const loose = strict.length ? strict : all.filter((h) => matches(h, q, false));
    const city = isCityQuery(all, q);
    if (loose.length) {
      const hotels = await this.views(loose, published);
      const mode: SearchMode = city ? 'city' : strict.length ? 'exact' : 'fuzzy';
      return { q, mode, hotels, near: [], openDirectly: mode === 'exact' && hotels.length === 1 ? hotels[0].id : null };
    }
    const neighbours = all.filter((h) => near(h, q));
    return { q, mode: 'none', hotels: [], near: await this.views(neighbours, published), openDirectly: null };
  }

  @Get(':id')
  async one(@Param('id') id: string): Promise<HotelView> {
    const h = await this.hotels.findOne({ where: { id }, relations: { roomTypes: true } });
    if (!h) throw new NotFoundException('No such hotel');
    const published = await this.publishedByHotel([id]);
    return hotelView(h, published.get(id) || [], this.storage);
  }

  /** Published uploads of a hotel, one item per upload with its photos. sort = stay (default) | added | oldest */
  @Get(':id/uploads')
  async uploadsOf(@Param('id') id: string, @Query('roomType') roomType?: string, @Query('sort') sort: 'stay' | 'added' | 'oldest' = 'stay'): Promise<UploadView[]> {
    const h = await this.hotels.findOne({ where: { id } });
    if (!h) throw new NotFoundException('No such hotel');
    let list = (await this.publishedByHotel([id])).get(id) || [];
    if (roomType && roomType !== 'all') list = list.filter((u) => u.roomType === roomType);
    if (sort === 'added') list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    else if (sort === 'oldest') list.sort((a, b) => -byStayDesc(a, b));
    else list.sort(byStayDesc);
    const counts = await this.contributionCounts(list.map((u) => u.account.id));
    return Promise.all(list.map((u) => uploadView(u, this.storage, counts.get(u.account.id) || 1)));
  }

  /** Stateless preview of the location check, so the contributor sees near / far before submitting. Nothing is stored. */
  @Post(':id/location-preview')
  async locationPreview(@Param('id') id: string, @Body() body: { lat?: number; lng?: number }) {
    const h = await this.hotels.findOne({ where: { id } });
    if (!h) throw new NotFoundException('No such hotel');
    const lat = Number(body?.lat), lng = Number(body?.lng);
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new BadRequestException('A device position is needed for the check.');
    if (h.lat == null || h.lng == null) return { result: 'not_run' };
    return { result: locationResult(distanceMetres(lat, lng, h.lat, h.lng), Number(process.env.NEAR_RADIUS_M || 500)) };
  }

  private async contributionCounts(accountIds: string[]): Promise<Map<string, number>> {
    if (!accountIds.length) return new Map();
    const rows = await this.uploads.createQueryBuilder('u').select('u.accountId', 'id').addSelect('COUNT(*)', 'n').where('u.status = :s', { s: 'published' }).andWhere('u.accountId IN (:...ids)', { ids: [...new Set(accountIds)] }).groupBy('u.accountId').getRawMany();
    return new Map(rows.map((r) => [r.id, Number(r.n)]));
  }
}

@Module({ imports: [TypeOrmModule.forFeature([Hotel, Upload])], controllers: [HotelsController] })
export class HotelsModule {}
