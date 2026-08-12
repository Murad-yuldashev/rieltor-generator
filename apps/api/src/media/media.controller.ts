import { Controller, Delete, Param, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentRealtor } from '../auth/current-realtor.decorator';
import { RealtorGuard } from '../auth/realtor.guard';
import { MediaService } from './media.service';

/** Design spec §6.4: at most 12 images per listing, so a single request can never carry more. */
const MAX_FILES_PER_REQUEST = 12;

// Same 'objects' prefix as ListingsWriteController — a third controller on this
// prefix is fine, the routes (:id/images) don't collide with the others.
@ApiTags('objects')
@Controller('objects')
@UseGuards(RealtorGuard)
@ApiUnauthorizedResponse({ description: 'Sessiya topilmadi' })
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post(':id/images')
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: "Rasmlar qayta ishlanib qo'shildi" })
  @UseInterceptors(
    // Memory storage (not disk): the pipeline works on buffers end-to-end, and a
    // read-only Lambda filesystem could not accept a disk-backed upload anyway.
    FilesInterceptor('images', MAX_FILES_PER_REQUEST, { storage: memoryStorage() }),
  )
  uploadImages(
    @CurrentRealtor() realtorId: string,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
  ) {
    return this.media.uploadImages(realtorId, id, files ?? []);
  }

  @Delete(':id/images/:imageId')
  @ApiOkResponse({ description: "Rasm o'chirildi, qolganlari qayta raqamlandi" })
  deleteImage(
    @CurrentRealtor() realtorId: string,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.media.deleteImage(realtorId, id, imageId);
  }
}
