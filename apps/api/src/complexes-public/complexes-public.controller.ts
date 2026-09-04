import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ComplexInquirySchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { ComplexesPublicService } from './complexes-public.service';

// Global prefix ('api', see bootstrap.ts) makes the real URLs /api/jk[...]. The list
// and detail reads are PUBLIC and slug-gated — no guard — so any buyer can browse a
// published ЖК. Only the inquiry write is authenticated (method-level JwtGuard), keeping
// the class guard-less. Excluded from the OpenAPI doc, like the other public surfaces.
@ApiExcludeController()
@Controller('jk')
export class ComplexesPublicController {
  constructor(private readonly svc: ComplexesPublicService) {}

  @Get()
  list() {
    return this.svc.listPublished();
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.svc.getBySlug(slug);
  }

  // Method-level guard — the class stays guard-less so the reads remain anonymous.
  @Post(':slug/inquiry')
  @UseGuards(JwtGuard)
  inquiry(@Param('slug') slug: string, @CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.svc.inquiry(user.id, slug, ComplexInquirySchema.parse(body));
  }
}
