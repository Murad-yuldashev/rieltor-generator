import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TopupSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { DeveloperService } from '../developer/developer.service';
import { DeveloperGuard } from '../developer/developer.guard';
import { OrgWalletService } from './org-wallet.service';

// @Controller('crm/wallet') → /api/crm/wallet — NOT 'wallet', which would collide
// with the realtor wallet at /api/wallet. DeveloperGuard resolves the caller's org.
@Controller('crm/wallet')
@UseGuards(JwtGuard, DeveloperGuard)
export class OrgWalletController {
  constructor(
    private readonly orgWallet: OrgWalletService,
    private readonly developer: DeveloperService,
  ) {}

  @Get()
  async view(@CurrentUser() u: { id: string }) {
    return this.orgWallet.view(await this.developer.orgIdOf(u.id));
  }

  @Post('topup')
  async topup(@CurrentUser() u: { id: string }, @Body() body: unknown) {
    const { packageId } = TopupSchema.parse(body);
    return this.orgWallet.topup(await this.developer.orgIdOf(u.id), packageId);
  }
}
