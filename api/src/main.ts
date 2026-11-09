import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { AppModule } from './app.module';
import { PhotoStorage } from './storage/photo-storage';
import { seed } from './seed';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Behind the shared load balancer the API is reached as /api/* (path forwarded unchanged); probes hit /health at the root.
  // Stripping the prefix here keeps every route reachable both ways. On by default in production, configurable with API_PREFIX.
  const prefix = (process.env.API_PREFIX ?? (process.env.NODE_ENV === 'production' ? 'api' : '')).replace(/^\/|\/$/g, '');
  if (prefix) app.use((req: any, _res: any, next: () => void) => { if (req.url === `/${prefix}` || req.url.startsWith(`/${prefix}/`) || req.url.startsWith(`/${prefix}?`)) req.url = req.url.slice(prefix.length + 1) || '/'; next(); });
  const origins = (process.env.APP_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());
  app.enableCors({ origin: origins, credentials: false });
  if (process.env.STORAGE !== 'gcs' && !process.env.PHOTO_BUCKET) {
    // Local storage: photos are served straight from the data directory. GCS serves signed URLs instead.
    app.useStaticAssets(process.env.LOCAL_STORAGE_DIR || join(process.cwd(), 'data'), { prefix: '/files/', maxAge: '1h' });
  }
  if (process.env.SEED_ON_BOOT !== 'false') {
    // Idempotent: seeds the sample hotels and photos only into an empty database. Off with SEED_ON_BOOT=false.
    await seed(app.get(DataSource), app.get(PhotoStorage), false);
  }
  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  console.log(`RealStay API on :${port} · storage=${process.env.STORAGE === 'gcs' || process.env.PHOTO_BUCKET ? 'gcs' : 'local'} · auth=${process.env.AUTH_PROVIDER || 'dev'}`);
}
void bootstrap();
