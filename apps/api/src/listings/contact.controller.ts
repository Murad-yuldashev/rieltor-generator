import { Controller, Get, Ip, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ListingsService } from './listings.service';

@ApiTags('objects')
@Controller('objects')
export class ContactController {
  constructor(private readonly listings: ListingsService) {}

  /** Called when the visitor taps the masked number — this event *is* the lead. */
  @Get(':id/contact')
  @ApiOkResponse({ description: 'The real phone/telegram; also records a ContactReveal row.' })
  @ApiNotFoundResponse({ description: 'Obyekt topilmadi' })
  reveal(@Param('id') id: string, @Ip() ip: string) {
    return this.listings.revealContact(id, ip);
  }
}
