import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';

/**
 * Storage abstraction for rendered image variants — local disk today, Cloudflare R2
 * later (design spec §6.1). The upload/delete endpoints (media.service.ts) depend
 * only on this interface, so swapping the backend never touches them.
 */
export interface MediaStorage {
  /** `key` is relative to the storage root, e.g. "bx-001/01-360.webp" or "bx-001/og.jpg". */
  save(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Removes every object whose key starts with `keyPrefix` — one image's whole variant set. */
  remove(keyPrefix: string): Promise<void>;
}

/** Nest injection token — MediaStorage is an interface, which has no runtime value to key on. */
export const MEDIA_STORAGE = Symbol('MEDIA_STORAGE');

/**
 * Writes under apps/api/public/images/<listingId>/<name> — exactly the layout the
 * seed pipeline already uses (prisma/images.ts), so uploaded files are served by the
 * existing static-assets mount (bootstrap.ts) at /images/<listingId>/<name> with zero
 * extra wiring, and Image.base stays a relative path (task's storage decision).
 */
export class LocalDiskStorage implements MediaStorage {
  private readonly imagesRoot: string;

  constructor(publicRoot: string) {
    this.imagesRoot = join(publicRoot, 'images');
  }

  async save(key: string, body: Buffer, _contentType: string): Promise<void> {
    const filePath = join(this.imagesRoot, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, body);
  }

  async remove(keyPrefix: string): Promise<void> {
    const fullPrefix = join(this.imagesRoot, keyPrefix);
    const dir = dirname(fullPrefix);
    const stem = fullPrefix.slice(dir.length + 1);

    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return; // Nothing on disk for this listing — nothing to remove.
    }

    await Promise.all(
      entries.filter((name) => name.startsWith(stem)).map((name) => rm(join(dir, name), { force: true })),
    );
  }
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
}

/**
 * Not implemented yet — this stage ships LocalDiskStorage only (task's storage
 * decision: local disk now, R2 later, do not require R2 credentials). Present so
 * createMediaStorage can already branch on env without a later migration; every
 * method throws until a real R2 client (S3-compatible PUT/DELETE) replaces the body.
 * Only constructed when every R2_* env var is set — see createMediaStorage below.
 */
export class R2Storage implements MediaStorage {
  constructor(private readonly config: R2Config) {}

  async save(_key: string, _body: Buffer, _contentType: string): Promise<void> {
    throw new Error(`R2 storage hali ulanmagan (TODO): bucket ${this.config.bucket}`);
  }

  async remove(_keyPrefix: string): Promise<void> {
    throw new Error(`R2 storage hali ulanmagan (TODO): bucket ${this.config.bucket}`);
  }
}

const DEFAULT_PUBLIC_ROOT = resolve(__dirname, '..', '..', 'public');

/**
 * Picks the storage backend by env: all five R2_* / MEDIA_PUBLIC_URL vars present →
 * R2Storage, otherwise LocalDiskStorage — the only backend this stage actually
 * exercises (spec §6.5, overridden per the task: media always registers, it never
 * disables itself, because local disk needs zero extra config).
 */
export function createMediaStorage(
  config: ConfigService<Env, true>,
  publicRoot: string = DEFAULT_PUBLIC_ROOT,
): MediaStorage {
  const accountId = config.get('R2_ACCOUNT_ID', { infer: true });
  const accessKeyId = config.get('R2_ACCESS_KEY_ID', { infer: true });
  const secretAccessKey = config.get('R2_SECRET_ACCESS_KEY', { infer: true });
  const bucket = config.get('R2_BUCKET', { infer: true });
  const publicUrl = config.get('MEDIA_PUBLIC_URL', { infer: true });

  if (accountId && accessKeyId && secretAccessKey && bucket && publicUrl) {
    return new R2Storage({ accountId, accessKeyId, secretAccessKey, bucket, publicUrl });
  }
  return new LocalDiskStorage(publicRoot);
}
