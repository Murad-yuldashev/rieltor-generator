import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BecomeDeveloperSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { DeveloperGuard } from './developer.guard';
import { DeveloperService } from './developer.service';

@Controller('crm')
@UseGuards(JwtGuard)
export class DeveloperController {
  constructor(private readonly dev: DeveloperService) {}

  // JwtGuard-only: right after the upgrade the caller's JWT still says USER (like become-realtor).
  @Post('become-developer')
  becomeDeveloper(@CurrentUser() u: { id: string }, @Body() body: unknown) {
    const { name, district } = BecomeDeveloperSchema.parse(body);
    return this.dev.becomeDeveloper(u.id, name, district);
  }

  @Get('org')
  @UseGuards(DeveloperGuard)
  org(@CurrentUser() u: { id: string }) {
    return this.dev.orgView(u.id);
  }
}
