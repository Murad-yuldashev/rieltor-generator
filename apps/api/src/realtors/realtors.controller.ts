import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { RealtorProfile } from '@rieltor/shared';
import { CurrentRealtor } from '../auth/current-realtor.decorator';
import { RealtorGuard } from '../auth/realtor.guard';
import { RealtorProfileDto, RealtorProfileUpdateDto } from './realtors.dto';
import { RealtorsService } from './realtors.service';

@ApiTags('me')
@Controller('me')
@UseGuards(RealtorGuard)
@ApiUnauthorizedResponse({ description: 'Sessiya topilmadi' })
export class RealtorsController {
  constructor(private readonly realtors: RealtorsService) {}

  @Get()
  @ApiOkResponse({ type: RealtorProfileDto })
  profile(@CurrentRealtor() realtorId: string): Promise<RealtorProfile> {
    return this.realtors.profile(realtorId);
  }

  @Patch()
  @ApiOkResponse({ type: RealtorProfileDto })
  update(
    @CurrentRealtor() realtorId: string,
    @Body() body: RealtorProfileUpdateDto,
  ): Promise<RealtorProfile> {
    return this.realtors.updateProfile(realtorId, body);
  }
}
