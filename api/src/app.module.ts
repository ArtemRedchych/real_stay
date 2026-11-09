import { Controller, Get, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTITIES } from './entities';
import { PhotoStorage, storageFromEnv } from './storage/photo-storage';
import { AuthModule } from './auth/auth';
import { HotelsModule } from './hotels/hotels';
import { UploadsModule } from './uploads/uploads';
import { ModerationModule } from './moderation/moderation';

@Global()
@Module({ providers: [{ provide: PhotoStorage, useFactory: () => storageFromEnv(process.env) }], exports: [PhotoStorage] })
export class StorageModule {}

@Controller()
export class HealthController {
  @Get('health') health() { return { ok: true, storage: process.env.STORAGE === 'gcs' ? 'gcs' : 'local', auth: process.env.AUTH_PROVIDER || 'dev' }; }
}

export function typeOrmOptions() {
  return {
    type: 'postgres' as const,
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/real_stay',
    entities: ENTITIES,
    // Prototype trade-off: the schema follows the entities. A production service would use generated migrations.
    synchronize: true,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  };
}

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TypeOrmModule.forRoot(typeOrmOptions()), StorageModule, AuthModule, HotelsModule, UploadsModule, ModerationModule],
  controllers: [HealthController],
})
export class AppModule {}
