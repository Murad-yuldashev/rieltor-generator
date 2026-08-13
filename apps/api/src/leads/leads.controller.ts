import { Body, Controller, Ip, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { LeadCreateDto } from './leads.dto';
import { LeadsService } from './leads.service';

// Public, no guard — the "raqamimni qoldiraman" CTA on a listing page (design
// spec §8.4), called from every visitor's browser, same trust level as POST /api/event.
@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Lid qabul qilindi' })
  create(@Body() body: LeadCreateDto, @Ip() ip: string) {
    const { website: honeypot, ...input } = body;
    return this.leads.create(input, honeypot, ip);
  }
}
