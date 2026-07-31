import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ListingDetailDto, ListingSummaryDto } from './listings.dto';
import { ListingsService } from './listings.service';

@ApiTags('objects')
@Controller('objects')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  @ApiOkResponse({ type: [ListingSummaryDto] })
  findAll() {
    return this.listings.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: ListingDetailDto })
  @ApiNotFoundResponse({ description: 'Obyekt topilmadi' })
  findOne(@Param('id') id: string) {
    return this.listings.findOne(id);
  }
}
