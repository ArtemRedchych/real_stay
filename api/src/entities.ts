import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

export type LocationCheck = 'not_run' | 'near' | 'far';
export type UploadStatus = 'pending' | 'published' | 'rejected' | 'correction_requested';
export type DisplayName = 'name' | 'anonymous';

@Entity()
export class Hotel {
  /** slug, e.g. "marlow" */
  @PrimaryColumn() id: string;
  @Column() name: string;
  @Column() type: string;
  @Column() area: string;
  @Column() city: string;
  @Column() country: string;
  @Column({ type: 'double precision', nullable: true }) lat: number | null;
  @Column({ type: 'double precision', nullable: true }) lng: number | null;
  @Column({ type: 'text', nullable: true }) listingPhotoKey: string | null;
  /** seeded hotels are visible; a hotel added by a contributor stays pending until a moderator approves an upload for it */
  @Column({ default: 'seeded' }) status: 'seeded' | 'pending';
  @OneToMany(() => RoomType, (r) => r.hotel) roomTypes: RoomType[];
}

@Entity()
export class RoomType {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Hotel, (h) => h.roomTypes, { onDelete: 'CASCADE' }) hotel: Hotel;
  @Column() name: string;
  @Column({ default: 0 }) position: number;
}

@Entity()
export class Account {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() provider: string;
  @Index() @Column() subject: string;
  @Column() name: string;
  @Column({ default: false }) isModerator: boolean;
  @CreateDateColumn() createdAt: Date;
}

@Entity()
export class Upload {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @ManyToOne(() => Hotel, { onDelete: 'CASCADE', eager: true }) hotel: Hotel;
  /** the hotel's room type name, or "Not sure" */
  @Column() roomType: string;
  /** YYYY-MM, reported by the contributor */
  @Column({ length: 7 }) stayMonth: string;
  @ManyToOne(() => Account, { eager: true }) account: Account;
  @Column({ default: 'name' }) displayName: DisplayName;
  @Column({ type: 'text', nullable: true }) note: string | null;
  @Column({ default: 'not_run' }) locationCheck: LocationCheck;
  @Index() @Column({ default: 'pending' }) status: UploadStatus;
  @Column({ type: 'text', nullable: true }) decisionReason: string | null;
  @Column({ type: 'text', nullable: true }) decisionMessage: string | null;
  @Column({ type: 'uuid', nullable: true }) decidedBy: string | null;
  @Column({ type: 'timestamptz', nullable: true }) decidedAt: Date | null;
  @CreateDateColumn() createdAt: Date;
  @OneToMany(() => Photo, (p) => p.upload, { eager: true }) photos: Photo[];
}

@Entity()
export class Photo {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Upload, (u) => u.photos, { onDelete: 'CASCADE' }) upload: Upload;
  @Column() position: number;
  @Column() originalKey: string;
  @Column() thumbKey: string;
  @Column() mime: string;
  @Column({ type: 'bigint' }) bytes: string;
  @Column({ nullable: true }) width: number;
  @Column({ nullable: true }) height: number;
  /** EXIF DateTimeOriginal, when the file carries one */
  @Column({ type: 'timestamptz', nullable: true }) capturedAt: Date | null;
}

@Entity()
export class Report {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Photo, { onDelete: 'CASCADE' }) photo: Photo;
  @Column() reason: string;
  @CreateDateColumn() createdAt: Date;
}

export const ENTITIES = [Hotel, RoomType, Account, Upload, Photo, Report];
