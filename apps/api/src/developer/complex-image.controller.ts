import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { DeveloperGuard } from './developer.guard';
import { DeveloperService } from './developer.service';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Multipart upload wiring (multer interceptor, mimetype/size validation) is a
// distinct concern from the JSON CRM CRUD in DeveloperController — separate
// controller, same '/crm' base path, disjoint complex-image routes.
@Controller('crm')
@UseGuards(JwtGuard, DeveloperGuard)
export class ComplexImageController {
  constructor(private readonly developer: DeveloperService) {}

  @Post('complexes/:id/images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }))
  upload(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Rasm fayli talab qilinadi');
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Faqat JPEG, PNG yoki WebP formatidagi rasm qabul qilinadi');
    }
    return this.developer.addComplexImage(user.id, id, file);
  }

  @Delete('complexes/:id/images/:imageId')
  remove(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.developer.removeComplexImage(user.id, id, imageId);
  }
}
