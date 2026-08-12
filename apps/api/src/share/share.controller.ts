import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentRealtor } from '../auth/current-realtor.decorator';
import { RealtorGuard } from '../auth/realtor.guard';
import { ShareCreateDto, ShareLinkDto } from './share.dto';
import { ShareService } from './share.service';

// Same 'objects' prefix as the public read controller and ListingsWriteController —
// POST :id/share is a distinct path from every route already registered there.
@ApiTags('objects')
@Controller('objects')
@UseGuards(RealtorGuard)
@ApiUnauthorizedResponse({ description: 'Sessiya topilmadi' })
export class ShareController {
  constructor(private readonly share: ShareService) {}

  @Post(':id/share')
  @ApiCreatedResponse({ type: ShareLinkDto })
  create(
    @CurrentRealtor() realtorId: string,
    @Param('id') id: string,
    @Body() body: ShareCreateDto,
  ) {
    return this.share.create(realtorId, id, body.label);
  }
}
