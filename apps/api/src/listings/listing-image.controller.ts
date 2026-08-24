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
import { ListingsService } from './listings.service';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Separate from ListingDraftController: multipart upload wiring (multer
// interceptor, mimetype/size validation) is a distinct concern from the
// JSON draft CRUD endpoints. Same '/my/listings' base path, disjoint routes.
@Controller('my/listings')
@UseGuards(JwtGuard)
export class ListingImageController {
  constructor(private readonly listings: ListingsService) {}

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }))
  addImage(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Rasm fayli talab qilinadi');
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Faqat JPEG, PNG yoki WebP formatidagi rasm qabul qilinadi');
    }

    return this.listings.addImage(id, user.id, file);
  }

  @Delete(':id/images/:imageId')
  removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.listings.removeImage(id, imageId, user.id);
  }
}
