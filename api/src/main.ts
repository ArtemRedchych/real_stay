import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { AppModule } from './app.module';
import { PhotoStorage } from './storage/photo-storage';
import { seed } from './seed';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Behind the shared load balancer the API is mounted under /api; locally it is the root.
  if (process.env.API_PREFIX) app.setGlobalPrefix(process.env.API_PREFIX.replace(/^\//, ''));
  const origins = (process.env.APP_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());
  app.enableCors({ origin: origins, credentials: false });
  if (process.env.STORAGE !== 'gcs') {
    // Local storage: photos are served straight from the data directory. GCS serves signed URLs instead.
    app.useStaticAssets(process.env.LOCAL_STORAGE_DIR || join(process.cwd(), 'data'), { prefix: '/files/', maxAge: '1h' });
  }
  if (process.env.SEED_ON_BOOT === 'true') {
    // Idempotent: seeds the sample hotels and photos only into an empty database.
    await seed(app.get(DataSource), app.get(PhotoStorage), false);
  }
  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  console.log(`RealStay API on :${port} · storage=${process.env.STORAGE || 'local'} · auth=${process.env.AUTH_PROVIDER || 'dev'}`);
}
void bootstrap();
