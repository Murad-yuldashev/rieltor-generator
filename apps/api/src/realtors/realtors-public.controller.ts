import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RealtorShowcaseDto } from './realtors.dto';
import { RealtorsService } from './realtors.service';

// Public, no guard — the /r/:username page this backs is open to anyone, same as
// GET /api/objects/:id. Separate controller from RealtorsController ('me', behind
// RealtorGuard) exactly like ListingsController/MyListingsController split public
// reads from owner-only ones.
@ApiTags('realtors')
@Controller('realtors')
export class RealtorsPublicController {
  constructor(private readonly realtors: RealtorsService) {}

  @Get(':username')
  @ApiOkResponse({ type: RealtorShowcaseDto })
  @ApiNotFoundResponse({ description: 'Rieltor topilmadi' })
  showcase(@Param('username') username: string) {
    return this.realtors.showcase(username);
  }
}
