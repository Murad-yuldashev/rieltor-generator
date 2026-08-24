import { Body, Controller, Post } from '@nestjs/common';
import { ValuationRequestSchema } from '@rieltor/shared';
import { ValuationService } from './valuation.service';

// Global prefix ('api', see bootstrap.ts) makes the real URL /api/valuation.
// Public — no JwtGuard — this is the top-of-funnel "Uyingiz qancha turadi?" seller hook.
@Controller('valuation')
export class ValuationController {
  constructor(private readonly valuation: ValuationService) {}

  @Post()
  estimate(@Body() body: unknown) {
    return this.valuation.estimate(ValuationRequestSchema.parse(body));
  }
}
