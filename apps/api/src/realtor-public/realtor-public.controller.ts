import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ReviewCreateSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
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
  ) {}

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.realtors.getBySlug(slug);
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
