import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentRealtor } from '../auth/current-realtor.decorator';
import { RealtorGuard } from '../auth/realtor.guard';
import { AnalyticsService } from './analytics.service';
import { ListingStatsDto } from './analytics.dto';

// Same 'me' prefix as RealtorsController/MyListingsController — routes here
// ('stats', 'objects/:id/stats') do not collide with anything already registered.
@ApiTags('me')
@Controller('me')
@UseGuards(RealtorGuard)
@ApiUnauthorizedResponse({ description: 'Sessiya topilmadi' })
export class StatsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('stats')
  @ApiOkResponse({ type: ListingStatsDto })
  myStats(@CurrentRealtor() realtorId: string) {
    return this.analytics.statsForRealtor(realtorId);
  }

  @Get('objects/:id/stats')
  @ApiOkResponse({ type: ListingStatsDto })
  listingStats(@CurrentRealtor() realtorId: string, @Param('id') id: string) {
    return this.analytics.statsForListing(realtorId, id);
  }
}
