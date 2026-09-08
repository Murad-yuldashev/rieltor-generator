import { Controller, Get } from '@nestjs/common';
import { MortgageService } from './mortgage.service';

// @Controller('mortgage') → /api/mortgage. PUBLIC (buyer-facing, no auth) like @Controller('objects').
@Controller('mortgage')
export class MortgageController {
  constructor(private readonly mortgage: MortgageService) {}

  @Get('programs')
  listPrograms() {
    return this.mortgage.listPrograms();
  }
}
