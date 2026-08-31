import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TopupSchema } from '@rieltor/shared';
import { RealtorGuard } from '../agent/realtor.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(JwtGuard, RealtorGuard)
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  view(@CurrentUser() u: { id: string }) {
    return this.wallet.view(u.id);
  }

  @Post('topup')
  topup(@CurrentUser() u: { id: string }, @Body() body: unknown) {
    return this.wallet.topup(u.id, TopupSchema.parse(body).packageId);
  }
}
