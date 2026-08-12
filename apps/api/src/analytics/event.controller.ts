import { Body, Controller, HttpCode, Ip, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { EventCreateDto } from './analytics.dto';

// Public, no guard — this is a tracking beacon called from every visitor's browser,
// not a cabinet endpoint. Runs alongside the existing public POST /api/view/:id.
@ApiTags('analytics')
@Controller('event')
export class EventController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post()
  @HttpCode(200)
  @ApiOkResponse({ description: "Voqea qayd etildi (yoki oyna ichida dublikat bo'lgani uchun o'tkazib yuborildi)" })
  record(@Body() body: EventCreateDto, @Ip() ip: string) {
    return this.analytics.recordEvent(body, ip);
  }
}
