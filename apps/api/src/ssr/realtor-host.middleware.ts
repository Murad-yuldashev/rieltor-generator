import { Injectable, type NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';

// Attach the resolved realtor slug onto the Express request for the SSR handlers.
declare module 'express' {
  interface Request {
    realtorSlug?: string;
  }
}

interface CacheEntry {
  slug: string | null;
  at: number;
}

/**
 * Resolves req.hostname → a verified realtor's slug, with a short in-process cache
 * (the same Map pattern as ViewsService.lastSeen / RealtorPublicService.inquiryHits)
 * so static-asset requests on a custom host do not each hit the DB. A host that is
 * the canonical PUBLIC_BASE_URL host, localhost, or a bare IP is never resolved.
 */
@Injectable()
export class RealtorHostResolver {
  private readonly cache = new Map<string, CacheEntry>();
  private static readonly TTL_MS = 60_000;
  // Bounded like RealtorPublicService.inquiryHits — an attacker spraying distinct
  // Host / X-Forwarded-Host values must not grow this Map without limit (memory
  // exhaustion DoS). Pruned lazily on insert once past the cap.
  private static readonly MAX_KEYS = 10_000;
  private readonly canonicalHost: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.canonicalHost = new URL(
      config.get('PUBLIC_BASE_URL', { infer: true }),
    ).hostname.toLowerCase();
  }

  async resolve(hostname: string): Promise<string | null> {
    const host = hostname.toLowerCase();
    if (
      host === this.canonicalHost ||
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)
    ) {
      return null;
    }
    const now = Date.now();
    const hit = this.cache.get(host);
    if (hit && now - hit.at < RealtorHostResolver.TTL_MS) return hit.slug;
    const profile = await this.prisma.realtorProfile.findFirst({
      where: { customDomain: host, customDomainVerified: true },
      select: { slug: true },
    });
    const slug = profile?.slug ?? null;
    // Prune expired entries lazily once the map grows past the cap, so memory stays
    // bounded without a background timer (mirrors inquiryHits' RL_MAX_KEYS sweep).
    if (this.cache.size >= RealtorHostResolver.MAX_KEYS) {
      for (const [k, v] of this.cache) {
        if (now - v.at >= RealtorHostResolver.TTL_MS) this.cache.delete(k);
      }
      // Still at the cap (all fresh) → evict the oldest insertion to make room.
      if (this.cache.size >= RealtorHostResolver.MAX_KEYS) {
        const oldest = this.cache.keys().next().value;
        if (oldest !== undefined) this.cache.delete(oldest);
      }
    }
    this.cache.set(host, { slug, at: now });
    return slug;
  }
}

/** The realtor's own site base URL for a custom-host request (always https — a
 *  custom domain is TLS-terminated at the platform/CDN). Shared by SsrController and
 *  NotFoundShellFilter so the `https://<host>` idiom lives in one place. */
export function realtorHostBaseUrl(hostname: string): string {
  return `https://${hostname}`;
}

/**
 * Sets req.realtorSlug for GET navigations on a verified custom host. Skips the
 * host-agnostic prefixes so only shell navigations pay the lookup: /api (the API),
 * plus the static/SPA mounts bootstrap.ts serves (/assets, /images, /agent, /crm).
 * Keep this list in sync with those useStaticAssets/app.use mounts in bootstrap.ts.
 */
@Injectable()
export class RealtorHostMiddleware implements NestMiddleware {
  constructor(private readonly resolver: RealtorHostResolver) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    if (
      req.method === 'GET' &&
      !req.path.startsWith('/api') &&
      !req.path.startsWith('/assets') &&
      !req.path.startsWith('/images') &&
      !req.path.startsWith('/agent') &&
      !req.path.startsWith('/crm')
    ) {
      const slug = await this.resolver.resolve(req.hostname);
      if (slug) req.realtorSlug = slug;
    }
    next();
  }
}
