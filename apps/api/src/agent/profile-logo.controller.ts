import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { ProfileService } from './profile.service';
import { RealtorGuard } from './realtor.guard';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Separate from AgentController: multipart upload wiring (multer interceptor,
// mimetype/size validation) is a distinct concern from the JSON profile CRUD.
// Same '/agent/profile' base path, disjoint route. Real URL: POST /api/agent/profile/logo.
@Controller('agent/profile')
@UseGuards(JwtGuard, RealtorGuard)
export class ProfileLogoController {
  constructor(private readonly profiles: ProfileService) {}

  @Post('logo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }))
  uploadLogo(@CurrentUser() user: { id: string }, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Rasm fayli talab qilinadi');
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Faqat JPEG, PNG yoki WebP formatidagi rasm qabul qilinadi');
    }

    return this.profiles.setLogo(user.id, file);
  }
}
