import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ArticleCategorySchema } from '@rieltor/shared';
import { JournalPublicService } from './journal-public.service';

@ApiExcludeController() // matches complexes-public/realtor-public — keep public SSR surfaces out of Swagger
@Controller('jurnal')
export class JournalPublicController {
  constructor(private readonly journal: JournalPublicService) {}

  @Get()
  list(@Query('category') category?: string) {
    const parsed = ArticleCategorySchema.safeParse(category);
    return this.journal.list(parsed.success ? parsed.data : undefined);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.journal.getBySlug(slug);
  }
}
