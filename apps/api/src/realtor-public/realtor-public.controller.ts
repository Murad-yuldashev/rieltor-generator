import { Body, Controller, Get, Header, Ip, Param, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { RealtorInquiryCreateSchema, ReviewCreateSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import type { Env } from '../config/env';
import { ReviewsService } from '../reviews/reviews.service';
import { RealtorPublicService } from './realtor-public.service';

// Global prefix ('api', see bootstrap.ts) makes the real URL /api/r/:slug. PUBLIC
// and slug-gated: no JwtGuard/RealtorGuard — anyone with the link must be able to
// view a realtor's microsite even if the realtor's subscription has lapsed.
// Excluded from the OpenAPI doc, like the other public/SSR surfaces.
@ApiExcludeController()
@Controller('r')
export class RealtorPublicController {
  constructor(
    private readonly realtors: RealtorPublicService,
    private readonly reviews: ReviewsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.realtors.getBySlug(slug);
  }

  // Global prefix makes the real URL /api/r/:slug/widget.js. The iframe always
  // points at the platform origin (PUBLIC_BASE_URL), which serves the /r/:slug/embed
  // page — a server-trusted value, so a spoofed Host or a poisoned CDN cache can't
  // repoint an embedding site's iframe at an attacker origin.
  @Get(':slug/widget.js')
  @Header('content-type', 'application/javascript; charset=utf-8')
  @Header('cache-control', 'public, max-age=3600')
  widget(@Param('slug') slug: string): string {
    return this.realtors.buildWidgetScript(
      slug,
      this.config.get('PUBLIC_BASE_URL', { infer: true }),
    );
  }

  // PUBLIC (no guard) — a site visitor's "Qo'ng'iroq so'rash" form. In-process
  // rate-limited by [ip, slug] inside the service; @Ip() is the client IP (behind
  // `trust proxy`, the first X-Forwarded-For hop).
  @Post(':slug/inquiry')
  createInquiry(@Param('slug') slug: string, @Ip() ip: string, @Body() body: unknown) {
    return this.realtors.createInquiry(slug, ip, RealtorInquiryCreateSchema.parse(body));
  }

  // Method-level guard — the class stays guard-less so GET :slug remains anonymous.
  @Post(':slug/reviews')
  @UseGuards(JwtGuard)
  submitReview(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
    @Body() body: unknown,
  ) {
    return this.reviews.submit(slug, user.id, ReviewCreateSchema.parse(body));
  }

  @Get(':slug/my-review')
  @UseGuards(JwtGuard)
  myReview(@Param('slug') slug: string, @CurrentUser() user: { id: string }) {
    return this.reviews.myReview(slug, user.id);
  }
}
