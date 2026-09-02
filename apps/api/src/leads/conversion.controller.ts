import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { LeadsService } from './leads.service';

// Global 'api' prefix -> real URL /api/moderation/conversion.
@Controller('moderation/conversion')
@UseGuards(JwtGuard, RolesGuard)
@Roles('MODERATOR', 'ADMIN')
export class ConversionController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  overview() {
    return this.leads.platformConversion();
  }
}
