import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';

/** Where photo bytes live. Keys are opaque; URLs are produced on read so the backing store can change. */
export abstract class PhotoStorage {
  abstract put(key: string, data: Buffer, mime: string): Promise<void>;
  /** A URL a browser can load for roughly an hour. */
  abstract url(key: string): Promise<string>;
}

@Injectable()
export class LocalDiskStorage extends PhotoStorage {
  constructor(private readonly dir: string, private readonly publicBase: string) { super(); }
  async put(key: string, data: Buffer): Promise<void> {
    const path = join(this.dir, key);
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, data);
  }
  async url(key: string): Promise<string> { return `${this.publicBase}/files/${key}`; }
}

@Injectable()
export class GcsStorage extends PhotoStorage {
  private bucket: any;
  constructor(bucketName: string) {
    super();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Storage } = require('@google-cloud/storage');
    this.bucket = new Storage().bucket(bucketName);
  }
  async put(key: string, data: Buffer, mime: string): Promise<void> {
    await this.bucket.file(key).save(data, { contentType: mime, resumable: false });
  }
  async url(key: string): Promise<string> {
    const [signed] = await this.bucket.file(key).getSignedUrl({ action: 'read', expires: Date.now() + 60 * 60 * 1000 });
    return signed;
  }
}

export function storageFromEnv(env: NodeJS.ProcessEnv): PhotoStorage {
  if (env.STORAGE === 'gcs') {
    if (!env.PHOTO_BUCKET) throw new Error('STORAGE=gcs needs PHOTO_BUCKET');
    return new GcsStorage(env.PHOTO_BUCKET);
  }
  return new LocalDiskStorage(env.LOCAL_STORAGE_DIR || join(process.cwd(), 'data'), env.PUBLIC_API_URL || `http://localhost:${env.PORT || 4000}`);
}
