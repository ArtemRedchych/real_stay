import { BadRequestException, Body, ConflictException, Controller, Get, Module, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, Hotel, Upload, UploadStatus } from '../entities';
import { PhotoStorage } from '../storage/photo-storage';
import { AuthModule, CurrentAccount, ModeratorGuard } from '../auth/auth';
import { uploadView, UploadView } from '../views';

export const REJECT_REASONS = ['Not a hotel room', 'People are identifiable', 'Personal information is visible', 'Professional or marketing image', 'Duplicate of an existing photo', 'Offensive content', 'Other'];
export const CORRECTION_REASONS = ['Wrong room type', 'Wrong hotel', 'Too dark or blurry to be useful', 'Stay date looks wrong'];

export interface Signal { kind: 'location' | 'capture' | 'account'; level: 'ok' | 'warn' | 'neutral'; text: string }
export interface QueueItem extends UploadView { hotelName: string; hotelPlace: string; hotelPending: boolean; contributorName: string; account: { ageDays: number; approved: number; rejected: number }; signals: Signal[] }

/** Signals inform the moderator; they never decide. */
export function signals(u: Upload, account: { ageDays: number; approved: number; rejected: number }): Signal[] {
  const out: Signal[] = [];
  if (u.locationCheck === 'near') out.push({ kind: 'location', level: 'ok', text: 'Location check: device was near the property at upload.' });
  else if (u.locationCheck === 'far') out.push({ kind: 'location', level: 'warn', text: 'Location check: device was not near the property at upload.' });
  else out.push({ kind: 'location', level: 'neutral', text: 'Location check: not performed.' });

  const captured = u.photos.map((p) => p.capturedAt).filter((d): d is Date => !!d);
  if (!captured.length) out.push({ kind: 'capture', level: 'neutral', text: 'Photo data: no capture date in the files.' });
  else {
    const [y, m] = u.stayMonth.split('-').map(Number);
    const stayStart = Date.UTC(y, m - 1, 1), stayEnd = Date.UTC(y, m, 0, 23, 59, 59);
    const bad = captured.find((d) => d.getTime() < stayStart - 60 * 86400000 || d.getTime() > stayEnd + 7 * 86400000);
    if (bad) out.push({ kind: 'capture', level: 'warn', text: `Photo data: a capture date of ${bad.toISOString().slice(0, 10)} does not match the reported stay (${u.stayMonth}).` });
    else out.push({ kind: 'capture', level: 'ok', text: `Photo data: capture date${captured.length > 1 ? 's' : ''} within the reported stay month.` });
  }

  if (account.ageDays < 2 && account.approved === 0) out.push({ kind: 'account', level: 'neutral', text: `Account: new (${account.ageDays} day${account.ageDays === 1 ? '' : 's'} old), no earlier contributions.` });
  else out.push({ kind: 'account', level: account.rejected > account.approved ? 'warn' : 'ok', text: `Account: ${account.ageDays} days old · ${account.approved} approved · ${account.rejected} rejected.` });
  return out;
}

@Controller('moderation')
@UseGuards(ModeratorGuard)
export class ModerationController {
  constructor(@InjectRepository(Upload) private readonly uploads: Repository<Upload>, @InjectRepository(Hotel) private readonly hotels: Repository<Hotel>, private readonly storage: PhotoStorage) {}

  @Get('queue')
  async queue(): Promise<QueueItem[]> {
    const pending = await this.uploads.find({ where: { status: 'pending' }, relations: { hotel: true, account: true, photos: true }, order: { createdAt: 'ASC' } });
    const items: QueueItem[] = [];
    for (const u of pending) {
      const stats = await this.accountStats(u.account);
      const view = await uploadView(u, this.storage, stats.approved);
      items.push({ ...view, hotelName: u.hotel.name, hotelPlace: [u.hotel.type, u.hotel.area, u.hotel.city].filter(Boolean).join(' · '), hotelPending: u.hotel.status === 'pending', contributorName: u.account.name, account: stats, signals: signals(u, stats) });
    }
    return items;
  }

  @Post(':id/approve')
  async approve(@CurrentAccount() mod: Account, @Param('id') id: string) {
    const u = await this.pendingOr409(id);
    await this.decide(u, mod, 'published', null, null);
    if (u.hotel.status === 'pending') { u.hotel.status = 'seeded'; await this.hotels.save(u.hotel); }
    return { id: u.id, status: u.status };
  }

  @Post(':id/reject')
  async reject(@CurrentAccount() mod: Account, @Param('id') id: string, @Body() body: { reason?: string; message?: string }) {
    if (!REJECT_REASONS.includes(body?.reason || '')) throw new BadRequestException(`Choose a reason: ${REJECT_REASONS.join(', ')}`);
    const u = await this.pendingOr409(id);
    await this.decide(u, mod, 'rejected', body.reason!, body.message);
    return { id: u.id, status: u.status };
  }

  @Post(':id/request-correction')
  async correction(@CurrentAccount() mod: Account, @Param('id') id: string, @Body() body: { reason?: string; message?: string }) {
    if (!CORRECTION_REASONS.includes(body?.reason || '')) throw new BadRequestException(`Choose a reason: ${CORRECTION_REASONS.join(', ')}`);
    const u = await this.pendingOr409(id);
    await this.decide(u, mod, 'correction_requested', body.reason!, body.message);
    return { id: u.id, status: u.status };
  }

  private async pendingOr409(id: string): Promise<Upload> {
    const u = await this.uploads.findOne({ where: { id }, relations: { hotel: true, account: true, photos: true } });
    if (!u) throw new NotFoundException('No such upload');
    if (u.status !== 'pending') throw new ConflictException(`This submission is already ${u.status.replace('_', ' ')}.`);
    return u;
  }

  private async decide(u: Upload, mod: Account, status: UploadStatus, reason: string | null, message?: string | null) {
    u.status = status; u.decisionReason = reason; u.decisionMessage = (message || '').trim().slice(0, 500) || null; u.decidedBy = mod.id; u.decidedAt = new Date();
    await this.uploads.save(u);
  }

  private async accountStats(account: Account): Promise<{ ageDays: number; approved: number; rejected: number }> {
    const rows = await this.uploads.createQueryBuilder('u').select('u.status', 'status').addSelect('COUNT(*)', 'n').where('u.accountId = :id', { id: account.id }).groupBy('u.status').getRawMany();
    const n = (s: string) => Number(rows.find((r) => r.status === s)?.n || 0);
    return { ageDays: Math.max(0, Math.floor((Date.now() - account.createdAt.getTime()) / 86400000)), approved: n('published'), rejected: n('rejected') };
  }
}

@Module({ imports: [TypeOrmModule.forFeature([Upload, Hotel]), AuthModule], controllers: [ModerationController] })
export class ModerationModule {}
