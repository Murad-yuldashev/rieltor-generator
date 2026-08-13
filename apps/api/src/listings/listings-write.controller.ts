import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentRealtor } from '../auth/current-realtor.decorator';
import { RealtorGuard } from '../auth/realtor.guard';
import { ListingInputDto, ListingStatusChangeDto } from './listings.dto';
import { ListingsWriteService } from './listings-write.service';

// Same 'objects' prefix as the public read controller — the methods do not collide
// (GET vs POST/PATCH), and every write route sits behind RealtorGuard.
@ApiTags('objects')
@Controller('objects')
@UseGuards(RealtorGuard)
@ApiUnauthorizedResponse({ description: 'Sessiya topilmadi' })
export class ListingsWriteController {
  constructor(private readonly write: ListingsWriteService) {}

  @Post()
  @ApiCreatedResponse({ description: "Yangi DRAFT e'lon yaratildi" })
  create(@CurrentRealtor() realtorId: string, @Body() body: ListingInputDto) {
    return this.write.createDraft(realtorId, body);
  }

  @Patch(':id')
  update(
    @CurrentRealtor() realtorId: string,
    @Param('id') id: string,
    @Body() body: ListingInputDto,
  ) {
    return this.write.update(realtorId, id, body);
  }

  @Post(':id/status')
  changeStatus(
    @CurrentRealtor() realtorId: string,
    @Param('id') id: string,
    @Body() body: ListingStatusChangeDto,
  ) {
    return this.write.changeStatus(realtorId, id, body.to);
  }

  @Delete(':id')
  remove(@CurrentRealtor() realtorId: string, @Param('id') id: string) {
    return this.write.remove(realtorId, id);
  }
}
