import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArticleCreateSchema, ArticleUpdateSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { ModerationJournalService } from './moderation-journal.service';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX = 10 * 1024 * 1024;

@Controller('moderation/journal')
@UseGuards(JwtGuard, RolesGuard)
@Roles('MODERATOR', 'ADMIN')
export class ModerationJournalController {
  constructor(private readonly journal: ModerationJournalService) {}

  @Get() list() {
    return this.journal.list();
  }
  @Get(':id') get(@Param('id') id: string) {
    return this.journal.get(id);
  }

  @Post() create(@CurrentUser() u: { id: string }, @Body() body: unknown) {
    return this.journal.create(u.id, ArticleCreateSchema.parse(body));
  }
  @Patch(':id') update(@Param('id') id: string, @Body() body: unknown) {
    return this.journal.update(id, ArticleUpdateSchema.parse(body));
  }
  @Post(':id/publish') publish(@Param('id') id: string) {
    return this.journal.publish(id);
  }
  @Post(':id/unpublish') unpublish(@Param('id') id: string) {
    return this.journal.unpublish(id);
  }

  @Post(':id/cover')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX } }))
  cover(@Param('id') id: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Rasm fayli talab qilinadi');
    if (!ALLOWED.has(file.mimetype)) throw new BadRequestException('Faqat JPEG, PNG yoki WebP');
    return this.journal.setCover(id, file);
  }
}
